package WifiTest;

import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.junit.Test;

import cn.buaa.edu.wifi.domain.MsgDevMac_V2;
import cn.buaa.edu.wifi.domain.SpectrumInfo;
import cn.buaa.edu.wifi.domain.SpectrumMap;
import cn.buaa.edu.wifi.knn.TestRecord;
import cn.buaa.edu.wifi.knn.TrainRecord;
import cn.buaa.edu.wifi.service.impl.WifiIndoorLocFingerKnnMethod;
import cn.buaa.edu.wifi.service.impl.WifiIndoorTagLocMethod;

public class KnnLocTest {
private static Logger logger = Logger.getLogger(WifiIndoorTagLocMethod.class);
	
	public static String Mac = "CC:3A:61:A9:09:53";
	@Test
	public void get(){
		SpectrumMap spectrumMap = new SpectrumMap();
		//spectrumMap.loadMap();
	}
	
	@Test
	public void testset(){
		//2.组织进行knn的测试集和训练集
		//2.1测试集
		List<MsgDevMac_V2> aps = new ArrayList<MsgDevMac_V2>();
		MsgDevMac_V2 dev = new MsgDevMac_V2();
		dev.setApMac("74:1F:4A:C8:9F:80");
		dev.setRssi((short) -40);
		aps.add(dev);
		dev = new MsgDevMac_V2();
		dev.setApMac("38:91:D5:86:CF:20");
		dev.setRssi((short) -50);
		aps.add(dev);
		
		double[] attributes = new double[aps.size()];
		int classLabel=1; 	//classLabel为标签名，此工程中测试集不使用，默认为1，测试集使用预测标签
		for(int i=0;i<aps.size();i++){
			attributes[i]=aps.get(i).getRssi();
		}
		TestRecord testRecord = new TestRecord(attributes,classLabel); 
		//2.2训练集
		SpectrumMap spectrum = new SpectrumMap();
		String[] titles = spectrum.titles;
		List<SpectrumInfo> spectrumMap = spectrum.spectrumMap;
		SpectrumInfo spectrumInfo ; 
		int mapSize = spectrumMap.size();
		TrainRecord[] trainRecord = new TrainRecord[mapSize];
		for(int indexMap=0;indexMap<mapSize;indexMap++){
			spectrumInfo = spectrumMap.get(indexMap);
			attributes = new double[aps.size()];
			for(int t=0;t<aps.size();t++){
				int index = getStringIndexofStrings(aps.get(t).getApMac(),titles);
				float rssi = (Float) spectrumInfo.getRssi().get(index-1);
				attributes[t]= rssi;
			}
			classLabel = spectrumInfo.getLocationID();
			trainRecord[indexMap] = new TrainRecord(attributes, classLabel) ;
		}	
	}

	private int getStringIndexofStrings(String str, String[] strs) {
		for(int i=0;i<strs.length;i++){
			if(strs[i].equals(str))
				return i;
		}
		return -1;
	}
	
	@Test
	public void test3() throws Exception{
		WifiIndoorLocFingerKnnMethod method = new WifiIndoorLocFingerKnnMethod();
		method.getLocByKnnMethodUsingActiveMQ(Mac);
	}
}
