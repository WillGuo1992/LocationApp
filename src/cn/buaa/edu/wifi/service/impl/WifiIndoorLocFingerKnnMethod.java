package cn.buaa.edu.wifi.service.impl;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import org.apache.log4j.Logger;

import cn.buaa.edu.util.DevMsgComparator;
import cn.buaa.edu.wifi.domain.LocationResult;
import cn.buaa.edu.wifi.domain.MsgDevMac_V2;
import cn.buaa.edu.wifi.domain.SpectrumInfo;
import cn.buaa.edu.wifi.domain.SpectrumMap;
import cn.buaa.edu.wifi.knn.CosineSimilarity;
import cn.buaa.edu.wifi.knn.EuclideanDistance;
import cn.buaa.edu.wifi.knn.FileManager;
import cn.buaa.edu.wifi.knn.KNN;
import cn.buaa.edu.wifi.knn.L1Distance;
import cn.buaa.edu.wifi.knn.Metric;
import cn.buaa.edu.wifi.knn.TestRecord;
import cn.buaa.edu.wifi.knn.TrainRecord;

import com.alibaba.fastjson.JSON;

public class WifiIndoorLocFingerKnnMethod {
	private static Logger logger = Logger.getLogger(WifiIndoorTagLocMethod.class);
	public static String remark="";//用于接收部分需要前端显示的调试信息，拼装
	public static SpectrumMap spectrumMapper = new SpectrumMap();
	public LocationResult getLocByKnnMethodUsingFile(String Mac) throws Exception{
		Date start = new Date();
		logger.info("开始File定位："+start);
		remark="开始File定位："+start+"\n";
		//从文件中获得当前MAC的报文，用于历史数据定位
		CSVReceiverG11 csvReceiverG11 = new CSVReceiverG11();
		List list = csvReceiverG11.getListFromCSVByMac(Mac);
		
		LocationResult locationResult = knnMethod(list);
		
		Date end = new Date();
		logger.info("结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n");
		remark+="结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n";
		locationResult.setRemark(remark);
		return locationResult;
	}
	


	//实时定位 注：需打开AMQ
	public LocationResult getLocByKnnMethodUsingActiveMQ(String Mac) throws Exception{
		Date start = new Date();
		logger.info("开始AMQ定位："+start);
		remark="开始AMQ定位";
		//从MQ中获得当前MAC的报文,用于实时定位
		AMQReceiverG11 mq = new AMQReceiverG11();
		List list = mq.getListFromAMQByMac(Mac);
		logger.info("reveive message from mq : "+list.size());
		
		LocationResult locationResult = knnMethod(list);
		
		logger.info(JSON.toJSONString(locationResult));
		Date end = new Date();
		logger.info("结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"\n\n\n\n");
		remark+="结束定位："+end+",用时(ms)："+String.valueOf(end.getTime()-start.getTime())+"";
		//locationResult.setRemark(remark);
		return locationResult;
	}
	
	//knn算法
	private LocationResult knnMethod(List<MsgDevMac_V2> list) {
		LocationResult locationResult = new LocationResult();
		//0.list中rssi强度排序、对应每个ap的信号强度取平均
		DevMsgComparator devMsgComparator = new DevMsgComparator();
		Collections.sort(list, devMsgComparator);
		for(MsgDevMac_V2 dev : list){
			logger.info(dev.toValue());
		}
		
		//筛选出用于定位的数据
		ArrayList<String> apString = new ArrayList<String>();
		ArrayList<MsgDevMac_V2> aps = new ArrayList<MsgDevMac_V2>();
		for(MsgDevMac_V2 dev : list){
			String mac = dev.getApMac();
			if(apString.contains(mac) )
				continue;
			apString.add(mac);
			aps.add(dev);
		}
		int apSize = aps.size();
		logger.info("用于该Dev定位有关的AP数:"+apSize);
		for(MsgDevMac_V2 dev : aps){
			logger.info(dev.toValue());
		}
		//  如果少于1个AP 则返回相应信息
		if(apSize<1){
			logger.info("该时段内无满足定位的AP,个数:"+apSize);
			locationResult.setMsgCode(3);
			locationResult.appendRemark("该时段内无满足定位的AP,个数:"+apSize);
			return locationResult;
		}
		logger.info("用于定位的AP,个数:"+apSize);
		
		
		//将用于定位的AP的信号强度进行平均，防止瞬时抖动过大
		//TODO 是否进行平均滤波需再考虑， 以测试手机为例，-40到-50的变动是需要滤波的，-80就不能加入到滤波中来，避免多径效应和反射效应
		for(MsgDevMac_V2 ap: aps){
			logger.info("old loc ap info:"+ap.toValue());
		}
		for(MsgDevMac_V2 ap: aps){
			int sumRssi =0 ;
			int num =0;
			for(MsgDevMac_V2 dev : list){
				if(dev.getApMac().equals(ap.getApMac()) ){
					sumRssi+=dev.getRssi();
					num++;
				}
			}
			if(num<=0)
				continue;
			short newRssi = (short) (sumRssi/num);
			//求完平均再看看是否有过小Rssi
			ap.setRssi(newRssi);
		}
		for(MsgDevMac_V2 ap: aps){
			logger.info("new loc ap info:"+ap.toValue());
		}
		
		//2.组织进行knn的测试集和训练集
		//2.1测试集
		double[] attributes = new double[aps.size()];
		int classLabel=1; 	//classLabel为标签名，此工程中测试集不使用，默认为1，测试集使用预测标签
		for(int i=0;i<aps.size();i++){
			attributes[i]=aps.get(i).getRssi();
		}
		TestRecord testRecord = new TestRecord(attributes,classLabel); 
		//2.2训练集
		String[] titles = SpectrumMap.titles;
		List<SpectrumInfo> spectrumMap = SpectrumMap.spectrumMap;
		SpectrumInfo spectrumInfo ; 
		int mapSize = spectrumMap.size();
		TrainRecord[] trainingSet = new TrainRecord[mapSize];
		for(int indexMap=0;indexMap<mapSize;indexMap++){
			spectrumInfo = spectrumMap.get(indexMap);
			attributes = new double[aps.size()];
			for(int t=0;t<aps.size();t++){
				int index = getStringIndexofStrings(aps.get(t).getApMac(),titles);
				float rssi = (Float) spectrumInfo.getRssi().get(index-1);
				attributes[t]= rssi;
			}
			classLabel = spectrumInfo.getLocationID();
			trainingSet[indexMap] = new TrainRecord(attributes, classLabel) ;
		}
		int K=3;
		int metricType =2 ;
		//determine the type of metric according to metricType
		Metric metric;
		if(metricType == 0)
			metric = new CosineSimilarity();
		else if(metricType == 1)
			metric = new L1Distance();
		else if (metricType == 2)
			metric = new EuclideanDistance();
		else{
			System.out.println("The entered metric_type is wrong!");
			return null;
		}
		
		//get the current time
		final long startTime = System.currentTimeMillis();
				
		//test those TestRecords one by one
		TrainRecord[] neighbors = KNN.findKNearestNeighbors(trainingSet, testRecord , K, metric);
		logger.info(neighbors);
		classLabel = KNN.classify(neighbors);

		testRecord.predictedLabel = classLabel; //assign the predicted label to TestRecord
		logger.info("预测的classLabel:"+testRecord.predictedLabel);
		
		
		//print the total execution time
		final long endTime = System.currentTimeMillis();
		logger.info("KNN using time: "+(endTime - startTime) / (double)1000 +" seconds.");
		SpectrumInfo location;
		location = spectrumMapper.getSpectrumInfoByLocationId(testRecord.predictedLabel);
		locationResult.setLocationId(location.getLocationID());
		locationResult.setLocationMethod(3);
		locationResult.setX(location.getX());
		locationResult.setY(location.getY());
		return locationResult;
	}
	
	int getStringIndexofStrings(String str,String[] strs){
		for(int i=0;i<strs.length;i++){
			if(strs[i].equals(str))
				return i;
		}
		return -1;
	}
	
}
