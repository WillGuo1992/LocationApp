package cn.buaa.edu.wifi.service.impl;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.nio.file.attribute.FileTime;
import java.text.DateFormat;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Date;
import java.util.List;

import org.apache.log4j.Logger;

import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

import com.alibaba.fastjson.JSON;
import com.sun.org.apache.regexp.internal.recompile;

public class CSVReceiverG11 {
	private static Logger logger = Logger.getLogger(WifiIndoorTagLocMethod.class);
	
	
	//public static String locStartTime = "2017.06.29 00:00:01";	//定位开始时间
	public static String locStartTime = "2017.06.29 15:00:01";	//定位开始时间
	public static int locInterval = 100000 ; //定位时间间隔 单位ms
	public static String dirOrigin = "F:\\G11_origin_data";
	
	public List getListFromCSVByMac(String Mac) throws Exception{
		//得到定位时间
		logger.info("定位时间："+locStartTime+"定位时间间隔"+locInterval);
		WifiIndoorTagLocMethod.remark+="定位时间："+locStartTime+"定位时间间隔"+locInterval;
		SimpleDateFormat ft = new SimpleDateFormat("yyyy.MM.dd HH:mm:ss");
		Date locTime = null;
		locTime = ft.parse(locStartTime);
		//2.得到正确文件
		//2.1文件目录是否存在
		String dirname = dirOrigin + "\\" + locStartTime.split(" ")[0].replace('.', '-');
		File dir = new File(dirname);
		if(!dir.exists() || !dir.isDirectory()){
			logger.info("文件路径不正确   "+dirname);
			return null;
		}
		//2.2便利所有文件名称，得到正确文件
		String[] filenames = dir.list();
		String filename ="";
		for(int i=1;i<filenames.length;i++){
			String file1 = filenames[i-1].substring(0, filenames[i-1].indexOf('.'));
			String file2 = filenames[i].substring(0, filenames[i].indexOf('.'));
			SimpleDateFormat ft2 = new SimpleDateFormat("yyyy-MM-dd-HH-mm");
			Date fileTime1=null,fileTime2=null ;
			try {
				fileTime1 = ft2.parse(file1);
				fileTime2 = ft2.parse(file2);
			} catch (ParseException e) {
				e.printStackTrace();
			}
			if(betweenTimeGap(locTime,fileTime1,fileTime2)){
				filename = file1;
				break;
			} else{
				filename = file2;
			}
		}
		logger.info("定位所用文件为:"+filename);
		
		//3.从该文件中取出合适的定位报文
		List<MsgDevMac_V2> list = new ArrayList<MsgDevMac_V2>();
		String absoluteFile = dirname+"\\"+filename+".csv";
		BufferedReader reader = null;
		reader = new BufferedReader(new FileReader(absoluteFile));
		String line = null;  
	    while((line = reader.readLine())!=null){  
	    	String[] str = line.split(",");
	    	//当前Mac的才进行下面计算
	    	if(!Mac.equals(str[2]))
	    		continue;
	    	SimpleDateFormat ft3 = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss:SSS");
	    	Date devDate = ft3.parse(str[0]);
	    	long devTime = ft3.parse(str[0]).getTime();
	    	//时间超过后直接break;
	    	if(locTime.getTime()<devTime)
	    		break;
	    	if(locTime.getTime()>devTime && (locTime.getTime()-locInterval)<devTime ){
	    		MsgDevMac_V2 dev = new MsgDevMac_V2();
	    		dev.setTime(devTime);
	    		dev.setApMac(str[1]);
	    		dev.setDevMac(str[2]);
	    		dev.setRssi(Short.valueOf(str[3]));
	    		dev.setChannel(Integer.valueOf(str[4]));
	    		list.add(dev);
	    	}
	    }  
	    reader.close();
		//下次定位时间
	    //返回自 1970 年 1 月 1 日 00:00:00 GMT 以来此 Date 对象表示的毫秒数。
	    // 设置此 Date 对象，以表示 1970 年 1 月 1 日 00:00:00 GMT 以后 time 毫秒的时间点。
	    locTime.setTime(locTime.getTime() + locInterval);
	    locStartTime = ft.format(locTime);
	    logger.info("下次定位时间："+locStartTime);
	    WifiIndoorTagLocMethod.remark+="下次定位时间："+locStartTime;
		return list;
	}
	
	
	
	/**
	 * 判断目标时间是否在两个时间之间
	 * @param goal 目标时间
	 * @param source1 时间1, 小
	 * @param source2 时间2, 大
	 * @return 
	 */
	public boolean betweenTimeGap(Date goal,Date source1,Date source2){
		if(goal.after(source1)&&goal.before(source2) || (goal.after(source1)&&goal.equals(source2))){
			return true;
		}
		return false;
	}
}
