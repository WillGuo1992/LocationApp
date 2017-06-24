package cn.buaa.edu.wifi.service.impl;

import java.util.List;

/**
 * 获得定位结果：三角定位
 * 由action发起调用
 * @author nlsde
 *
 */
public class LocationMethod {
	
	//三角定位
	public String getLocBytriangleMethod(String Mac){
		//从MQ中获得当前MAC的报文
		AMQReceiverG11 mq = new AMQReceiverG11();
		List list = mq.getListFromAMQByMac(Mac);
		System.out.println(list.size());
		//进行定位
		
		return null;
	}
}
