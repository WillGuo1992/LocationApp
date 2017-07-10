package cn.buaa.edu.util;

import java.util.Comparator;

import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

/**
 * 对MsgDevMac_V2的数组进行排序 按信号强度由高到低  get(0)为最大
 * @author nlsde
 *
 */
public class DevMsgComparator implements Comparator<MsgDevMac_V2>{

	@Override
	public int compare(MsgDevMac_V2 o1, MsgDevMac_V2 o2) {
		int rssi_o1 = o1.getRssi();
		int rssi_o2 = o2.getRssi();
		if(rssi_o1>rssi_o2)
			return -1;
		else if(rssi_o1<rssi_o2)
			return 1;
		else if(rssi_o1 == rssi_o2)
			return (int) (o1.getStime()-o2.getStime());
		return 0;
	}

}
