package cn.buaa.edu.wifi.service.impl;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.Destination;
import javax.jms.JMSException;
import javax.jms.Message;
import javax.jms.MessageConsumer;
import javax.jms.MessageListener;
import javax.jms.Session;
import javax.jms.TextMessage;

import org.apache.activemq.ActiveMQConnection;
import org.apache.activemq.ActiveMQConnectionFactory;
import org.apache.log4j.Logger;
import org.jfree.util.Log;

import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

import com.alibaba.fastjson.JSON;


public class AMQReceiverG11 {
	private static String user = ActiveMQConnection.DEFAULT_USER;
	private static String password = ActiveMQConnection.DEFAULT_PASSWORD;
	private static String url = "tcp://localhost:61616";
	private static long subtime = 100; 	//切分时间间隔（单位毫秒） 因为receive函数为阻塞等待，如果不切分则导致一直从mq中取数据。真正实现方式应为JMX，但是没有测试成功，故暂时采取此方法
	private static Logger logger = Logger.getLogger(AMQReceiverG11.class);
	private static MessageConsumer consumer = null;
	static{
		try{
			ConnectionFactory connectionFactory =new ActiveMQConnectionFactory(user,password,url);
			Connection connection = null;
			connection = connectionFactory.createConnection();
			connection.start();
			Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
			Destination distination = session.createQueue("aruba");
			consumer = session.createConsumer(distination);
		}
		catch (JMSException e){
			e.printStackTrace();
		}
		
	}
	
	public List getListFromAMQByMac(String Mac) {
		List<MsgDevMac_V2> list = new ArrayList<MsgDevMac_V2>();
		try{
			while(true){
				TextMessage message = (TextMessage) consumer.receive(100);
				//判断是否是最新数据，达到当前时间数据则break
				if(message!=null){
					long timestamp = message.getJMSTimestamp();
					Date date = new Date();
					long now = date.getTime();
					long substract = Math.abs(now-timestamp);
					if(substract<subtime){
						logger.info("AMQ时间切分成功");
						break;
					}
				}
				//print非常影响性能 谨慎使用
				//System.out.println(message);
				if(message != null){
					String jsonString = message.getText();
					MsgDevMac_V2 devMac = JSON.parseObject(jsonString,MsgDevMac_V2.class);
					String receiveMac = devMac.getDevMac().toUpperCase();
					if(!receiveMac.equals(Mac.toUpperCase()) )
						continue;
					list.add(devMac);
				}else{
					logger.info("activemq message is null");
					break;
				}
			}
		} 
		catch (Exception e) {
			e.printStackTrace();
		}
		return list;
		
	}
	
}
