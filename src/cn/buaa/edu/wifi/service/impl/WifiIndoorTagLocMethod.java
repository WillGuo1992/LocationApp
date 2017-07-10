package cn.buaa.edu.wifi.service.impl;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;
import java.util.Set;

import org.apache.commons.logging.Log;
import org.apache.log4j.Logger;

import com.alibaba.fastjson.JSON;

import cn.buaa.edu.wifi.domain.ApInfo;
import cn.buaa.edu.wifi.domain.LocationResult;
import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

/**
 * 获得定位结果：tag定位
 * 由action发起调用
 * 无合格定位报文返回null
 * @author nlsde
 *
 */
public class WifiIndoorTagLocMethod {
	//tag定位
	//文件定位
	private static Logger logger = Logger.getLogger(WifiIndoorTagLocMethod.class);
	public static String remark="";//用于接收部分需要前端显示的调试信息，拼装
	public LocationResult getLocByTagMethodUsingFile(String Mac) throws Exception{
		Date start = new Date();
		logger.info("开始File定位："+start);
		remark="开始File定位："+start+"\n";
		//从文件中获得当前MAC的报文，用于历史数据定位
		CSVReceiverG11 csvReceiverG11 = new CSVReceiverG11();
		List list = csvReceiverG11.getListFromCSVByMac(Mac);
		
		LocationResult locationResult = tagMethod(list);
		
		Date end = new Date();
		logger.info("结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n");
		remark+="结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n";
		locationResult.setRemark(remark);
		return locationResult;
	}
	
	//实时定位 注：需打开AMQ
	public LocationResult getLocByTagMethodUsingActiveMQ(String Mac) throws Exception{
		Date start = new Date();
		logger.info("开始AMQ定位："+start);
		remark="开始AMQ定位";
		//从MQ中获得当前MAC的报文,用于实时定位
		AMQReceiverG11 mq = new AMQReceiverG11();
		List list = mq.getListFromAMQByMac(Mac);
		
		LocationResult locationResult = tagMethod(list);
		
		
		Date end = new Date();
		logger.info("结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n");
		remark+="结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"";
		locationResult.setRemark(remark);
		return locationResult;
	}
		
	public LocationResult tagMethod(List list){
		
		APTools apTools = new APTools();
		List<ApInfo> apList = apTools.getApList();
		
		logger.info("当前device的报文数为:"+list.size());
		remark+="当前device的报文数为:"+list.size();
		for(Object obj : list){
			MsgDevMac_V2 dev = (MsgDevMac_V2)obj;
			ApInfo ap = apTools.findApByApMac(dev.getApMac(),apList);
			logger.info("devMac:"+dev.getDevMac()+"\tapName:"+ap.getApName()+"\trssi:"+dev.getRssi()+"\ttime:"+new Date(dev.getTime()));
		}
		//从list中选择出每个AP信号最强的
		Map<String,Short> unique = new APTools().strongestAp(list);
		logger.info("当前收到当前设备报文的AP数为："+unique.size());
		remark+="当前收到当前设备报文的AP数为："+unique.size();
		//无合格定位报文返回null
		if(unique.size()==0)
			return null;
		
		//进行定位
		//1.选取RSSI最强AP
		String strongAP="";
		short strongRssi =-100;
		for(Map.Entry<String, Short> entry : unique.entrySet()){
			short aprssi = entry.getValue();
			if(aprssi>strongRssi){
				strongAP = entry.getKey();
				strongRssi = entry.getValue();
			}
		}
		logger.info("最近AP信息:"+strongAP+","+strongRssi);
		remark+="最近AP信息:"+strongAP+","+strongRssi;
		//2.得到最强AP的位置
		LocationResult locationResult = new LocationResult();
		for(ApInfo apInfo : apList){
			if(strongAP.equals(apInfo.getApMac())){
				locationResult.setX(apInfo.getX());
				locationResult.setY(apInfo.getY());
				locationResult.setZ(apInfo.getZ());
				locationResult.setApName(apInfo.getApName());
				locationResult.setLocationMethod(1);
				locationResult.setRemark(remark);
				break;
			}
		}
		//3.返回该AP位置
		logger.info(JSON.toJSONString(locationResult));
		return locationResult;
	}
	
}
