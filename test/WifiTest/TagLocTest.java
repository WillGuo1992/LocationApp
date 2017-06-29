package WifiTest;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Map.Entry;

import org.apache.log4j.Logger;
import org.junit.Test;

import cn.buaa.edu.wifi.domain.MsgDevMac_V2;
import cn.buaa.edu.wifi.service.impl.AMQReceiverG11;
import cn.buaa.edu.wifi.service.impl.APTools;
import cn.buaa.edu.wifi.service.impl.CSVReceiverG11;
import cn.buaa.edu.wifi.service.impl.WifiIndoorTagLocMethod;

public class TagLocTest {
	private static Logger logger = Logger.getLogger(WifiIndoorTagLocMethod.class);
	
	public static String Mac = "CC:3A:61:A9:09:53";
	@Test
	public void get() throws Exception{
		WifiIndoorTagLocMethod wifiIndoorTagLocMethod = new WifiIndoorTagLocMethod();
		wifiIndoorTagLocMethod.getLocByTagMethodUsingActiveMQ(Mac);
		
	}
	
	@Test
	public void get_csv() throws Exception{
		
		WifiIndoorTagLocMethod wifiIndoorTagLocMethod = new WifiIndoorTagLocMethod();
		wifiIndoorTagLocMethod.getLocByTagMethodUsingFile(Mac);
		
	
	}
	
}
