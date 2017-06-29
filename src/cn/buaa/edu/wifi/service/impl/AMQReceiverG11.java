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

import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

import com.alibaba.fastjson.JSON;


public class AMQReceiverG11 {
	private static String user = ActiveMQConnection.DEFAULT_USER;
	private static String password = ActiveMQConnection.DEFAULT_PASSWORD;
	private static String url = "tcp://localhost:61616";
	private static long subtime = 100; 	//切分时间间隔（单位毫秒） 因为receive函数为阻塞等待，如果不切分则导致一直从mq中取数据。真正实现方式应为JMX，但是没有测试成功，故暂时采取此方法
	/**
	 * 从AMQ中读取数据 point-to-point模式
	 * @param Mac device_Mac地址
	 */
	@Deprecated
	List getListFromAMQByMac_old(String Mac){

        // ConnectionFactory ：连接工厂，JMS 用它创建连接
        ConnectionFactory connectionFactory;
        // Connection ：JMS 客户端到JMS Provider 的连接
        Connection connection = null;
        // Session： 一个发送或接收消息的线程
        final Session session;
        // Destination ：消息的目的地;消息发送给谁.
        Destination destination;
        // 消费者，消息接收者
        MessageConsumer consumer;
        connectionFactory = new ActiveMQConnectionFactory(
                ActiveMQConnection.DEFAULT_USER,
                ActiveMQConnection.DEFAULT_PASSWORD,
                "tcp://localhost:61616");
        List<MsgDevMac_V2> list = new ArrayList<MsgDevMac_V2>(); 
        try {
            // 构造从工厂得到连接对象
            connection = connectionFactory.createConnection();
            // 启动
            connection.start();
            // 获取操作连接
            session = connection.createSession(Boolean.FALSE,
                    Session.AUTO_ACKNOWLEDGE);
            // 获取session注意参数值xingbo.xu-queue是一个服务器的queue，须在在ActiveMq的console配置
            destination = session.createQueue("aruba");
            consumer = session.createConsumer(destination);
            
            while (true) {
                //receive时间1s
                TextMessage message = (TextMessage) consumer.receive(1000);
                if (null != message) {
                	String jsonString =  message.getText();
                    MsgDevMac_V2  devMac =  JSON.parseObject(jsonString, MsgDevMac_V2.class);
                    String receiveMac = devMac.getDevMac().toUpperCase();
                    if(!devMac.getDevMac().toUpperCase().equals(Mac))
                    	continue ;
                    list.add(devMac);
                } else {
                    break;
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            try {
                if (null != connection)
                    connection.close();
            } catch (Throwable ignore) {
            }
        }
        return list;
    
	}
	public List getListFromAMQByMac(String Mac) {
		List<MsgDevMac_V2> list = new ArrayList<MsgDevMac_V2>();
		ConnectionFactory connectionFactory =new ActiveMQConnectionFactory(user,password,url);
		Connection connection = null;
		try {
			connection = connectionFactory.createConnection();
			connection.start();
			Session session = connection.createSession(Boolean.FALSE, Session.AUTO_ACKNOWLEDGE);
			Destination distination = session.createQueue("aruba");
			MessageConsumer consumer = session.createConsumer(distination);
			while(true){
				TextMessage message = (TextMessage) consumer.receive(100);
				//判断是否是最新数据，达到当前时间数据则break
				if(message!=null){
					long timestamp = message.getJMSTimestamp();
					Date date = new Date();
					long now = date.getTime();
					long substract = Math.abs(now-timestamp);
					if(substract<subtime){
						System.out.println("时间切分成功");
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
					break;
				}
			}
		} catch (JMSException e) {
			e.printStackTrace();
		} finally{
			if(connection != null)
				try {
					connection.close();
					System.out.println("connection closed!!!");
				} catch (JMSException e) {
					e.printStackTrace();
				}
		}
		
		return list;
		
	}
	
}
