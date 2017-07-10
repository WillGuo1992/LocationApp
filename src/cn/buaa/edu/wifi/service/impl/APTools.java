package cn.buaa.edu.wifi.service.impl;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.apache.log4j.Logger;

import cn.buaa.edu.wifi.domain.ApInfo;
import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

public class APTools {
	private static Logger logger = Logger.getLogger(APTools.class);

	public Map strongestAp(List<MsgDevMac_V2> list) {
		Map<String, Short> uniqueAP = new HashMap<String, Short>();
		for (MsgDevMac_V2 devMac : list) {
			String apMac = devMac.getApMac();
			short apRssi = devMac.getRssi();
			// 在map中没有就添加
			if (!uniqueAP.containsKey(apMac)) {
				uniqueAP.put(apMac, apRssi);
			}
			// 有就比较rssi选择是否更新
			else if (uniqueAP.containsKey(apMac)) {
				short rssiInMap = uniqueAP.get(apMac);
				if (apRssi > rssiInMap) {
					uniqueAP.put(apMac, apRssi);
				}
			}
			// 没有闭包到的 ，please check the reason
			else {
				System.out.println("没有闭包到的 ，please check the reason!");
			}
		}
		return uniqueAP;
	}

	// 根据devMac找到dev对象
	public MsgDevMac_V2 findDevByDevMac(String devMac, List<MsgDevMac_V2> list) {
		for (MsgDevMac_V2 dev : list) {
			if (devMac.equals(dev.getDevMac()))
				return dev;
		}
		return null;
	}

	// 根据apMac找到ap对象
	public ApInfo findApByApMac(String apMac, List<ApInfo> list) {
		for (ApInfo ap : list) {
			if (apMac.equals(ap.getApMac()))
				return ap;
		}
		return null;
	}

	// 加载APlist文件
	public List getApList() {
		List apList = StartInitDataListener.apList;
		if(apList.size()>0)
			return apList;
		// 获取到classes目录的全路径
		String path = this.getClass().getResource("/")
				.getPath();
		System.out.println(path);
		// 读取apInfo.csv文件
		try {
			BufferedReader reader = new BufferedReader(new FileReader(path
					+ "/apInfo.csv"));// 换成你的文件名
			reader.readLine();// 第一行信息，为标题信息，不用，如果需要，注释掉
			String line = null;

			while ((line = reader.readLine()) != null) {
				ApInfo apInfo = new ApInfo();
				String item[] = line.split(",");// CSV格式文件为逗号分隔符文件，这里根据逗号切分
				apInfo.setApName(item[0]);
				apInfo.setApMac(item[1]);
				apInfo.setX(Float.valueOf(item[2]));
				apInfo.setY(Float.valueOf(item[3]));
				apList.add(apInfo);
				//logger.info(apInfo.toString());
			}
		} catch (Exception e) {
			e.printStackTrace();
		}
		return apList;
	}
}
