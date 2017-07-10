package cn.buaa.edu.wifi.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.apache.commons.math3.stat.regression.SimpleRegression;
import org.apache.log4j.Logger;

import com.alibaba.fastjson.JSON;

import cn.buaa.edu.util.DevMsgComparator;
import cn.buaa.edu.wifi.domain.ApInfo;
import cn.buaa.edu.wifi.domain.LocationResult;
import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

public class WifiIndoorTriangleLocMethod {
	private static Logger logger = Logger.getLogger(WifiIndoorTagLocMethod.class);
	public static String remark="";//用于接收部分需要前端显示的调试信息，拼装
	
	
	public LocationResult getLocByTriangleMethodUsingFile(String Mac) throws Exception{
		Date start = new Date();
		logger.info("开始File定位："+start);
		remark="开始File定位："+start+"\n";
		//从文件中获得当前MAC的报文，用于历史数据定位
		CSVReceiverG11 csvReceiverG11 = new CSVReceiverG11();
		List list = csvReceiverG11.getListFromCSVByMac(Mac);
		
		LocationResult locationResult = triangleMethod(list);
		
		Date end = new Date();
		logger.info("结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n");
		remark+="结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n";
		locationResult.setRemark(remark);
		return locationResult;
	}
	


	//实时定位 注：需打开AMQ
	public LocationResult getLocByTriangleMethodUsingActiveMQ(String Mac) throws Exception{
		Date start = new Date();
		logger.info("开始AMQ定位："+start);
		remark="开始AMQ定位";
		//从MQ中获得当前MAC的报文,用于实时定位
		AMQReceiverG11 mq = new AMQReceiverG11();
		List list = mq.getListFromAMQByMac(Mac);
		logger.info("reveive message from mq : "+list.size());
		LocationResult locationResult = triangleMethod(list);
		
		logger.info(JSON.toJSONString(locationResult));
		Date end = new Date();
		logger.info("结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n");
		remark+="结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"";
		//locationResult.setRemark(remark);
		return locationResult;
	}
	
	
	private LocationResult triangleMethod(List<MsgDevMac_V2> list) {
		LocationResult locationResult = new LocationResult();
		//1. choose apNum the strongest rssi's aps
		int lowestRssi = -70;
		DevMsgComparator devMsgComparator = new DevMsgComparator();
		Collections.sort(list, devMsgComparator);
		for(MsgDevMac_V2 dev : list){
			logger.info(dev.toValue());
		}
		ArrayList<String> apString = new ArrayList<String>();
		ArrayList<MsgDevMac_V2> aps = new ArrayList<MsgDevMac_V2>();
		for(MsgDevMac_V2 dev : list){
			String mac = dev.getApMac();
			if(apString.contains(mac) || dev.getRssi()<lowestRssi)
				continue;
			apString.add(mac);
			aps.add(dev);
		}
		int apSize = aps.size();
		logger.info("用于该Dev定位有关的AP数:"+apSize);
		for(MsgDevMac_V2 dev : aps){
			logger.info(dev.toValue());
		}
		//1.1 如果少于三个AP 则返回相应信息
		if(apSize<3){
			logger.info("该时段内可用于定位的AP少于三个，无法完成三角定位,个数:"+apSize);
			locationResult.setMsgCode(2);
			locationResult.setRemark("该时段内可用于定位的AP少于三个，无法完成三角定位,个数:"+apSize);
			return locationResult;
		}
		for(MsgDevMac_V2 ap: aps){
			logger.info("old loc ap info:"+ap.toValue());
		}
		//将用于定位的AP的信号强度进行平均，防止瞬时抖动过大
		for(MsgDevMac_V2 ap: aps){
			int sumRssi =0 ;
			int num =0;
			for(MsgDevMac_V2 dev : list){
				if(dev.getApMac().equals(ap.getApMac()) && dev.getRssi()>lowestRssi){
					sumRssi+=dev.getRssi();
					num++;
				}
			}
			if(num<=0)
				continue;
			short newRssi = (short) (sumRssi/num);
			//求完平均再看看是否有过小Rssi
			if(newRssi<lowestRssi){
				aps.remove(ap);
				logger.info("because of the average, remove an ap info:"+ap.toValue());
				continue;
			}
			ap.setRssi(newRssi);
		}
		for(MsgDevMac_V2 ap: aps){
			logger.info("new loc ap info:"+ap.toValue());
		}
		
		
		//2. 最小二乘定位
		APTools apTools = new APTools();
		List apList = apTools.getApList();
		double [][] info = new double[apSize][3];
		for(int index =0;index < apSize; index++){
			String apMac = aps.get(index).getApMac();
			ApInfo apInfo = apTools.findApByApMac(apMac, apList);
			info[index][0] = apInfo.getX();  //xi
			info[index][1] = apInfo.getY();	 //yi
			info[index][2] = getLen(aps.get(index).getRssi()) ;  //di
			String log = " apName:"+apInfo.getApName()+" , rssi:"+aps.get(index).getRssi()+" , Len :"+info[index][2];
			logger.info(log);
			String _remark = locationResult.getRemark();
			locationResult.setRemark(_remark+log);
		}
		double ps[][] = new double[apSize-1][4];
		double r1 = info[0][2] * info[0][2];  //d1平方
		double r2 = info[0][0] * info[0][0] + info[0][1] * info[0][1];			//x1平方+y1平方
		for(int index =0;index < apSize-1; index++){
			ps[index][0] = info[index+1][0]*info[index+1][0] + info[index+1][1]*info[index+1][1] - r2 ;
			ps[index][1] = 2*(info[0][0] - info[index+1][0]);
			ps[index][2] = 2*(info[0][1] - info[index+1][1]);
			ps[index][3] = info[index+1][2]*info[index+1][2] - r1 ;
			double k = ps[index][0];
			ps[index][0] = ps[index][2] / ps[index][1];
			ps[index][1] = (ps[index][3] - k) / ps[index][1];
		}
		Date startReg = new Date();
		SimpleRegression reg = new SimpleRegression(true);
		reg.addData(ps);
		float x = (float)reg.getIntercept();
		float y = (float)reg.getSlope();
		Date endReg = new Date();
		logger.info("calculate SimpleRegression time(ms):"+String.valueOf(endReg.getTime()-startReg.getTime()));
		logger.info("result:(x,y):"+x+","+y);
		
		locationResult.setLocationMethod(2);
		locationResult.setX(x);
		locationResult.setY(y);
		return locationResult;
	}
	
	//信号强度转距离的公式
	//参考http://tech.meituan.com/mt-wifi-locate-practice-part1.html
	public double getLen(double rssi) {
		//d为定位节点与参考点之间的距离，单位m；A为定位节点与参考点之间的距离d为1m时测得的RSSI值；n为信号衰减因子，范围一般为2～4。
		//在现场环境中，我们取A为-40，n为2.1。
		double A = -40; 
		double n = 4;
	    double f=(-rssi+A)/(10*n);
	    return Math.pow(10,f);
	}
}
