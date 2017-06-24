package cn.buaa.edu.util;

public class MacUtil {
	public static String toMacStr(byte[] mac) {
		if (mac == null)
			return null;
		//74:25:8A:61:79:80
		StringBuilder sb = new StringBuilder(17);
		for (byte b : mac) {
			if (sb.length() > 0)
				sb.append(':');
			sb.append(String.format("%02X", b));
		}
		return sb.toString();
	}
	
	public static byte[] toMacBin(String mac){
		String[] units = mac.split(":");
		
		byte[] binMac = new byte[units.length];
		
		for(int i = 0; i < binMac.length; i++){
			binMac[i] = (byte) Integer.parseInt(units[i], 16);
 		}
		
		return binMac;
	}
}
