package cn.buaa.edu.wifi.service.impl;

import java.util.ArrayList;
import java.util.List;

import javax.jms.Connection;
import javax.jms.ConnectionFactory;
import javax.jms.Destination;
import javax.jms.MessageConsumer;
import javax.jms.Session;
import javax.jms.TextMessage;

import org.apache.activemq.ActiveMQConnection;
import org.apache.activemq.ActiveMQConnectionFactory;

import cn.buaa.edu.wifi.domain.MsgDevMac_V2;

import com.alibaba.fastjson.JSON;

public class AMQReceiverG11 {
	/**
	 * 从AMQ中读取数据
	 * @param Mac device_Mac地址
	 */
	List getListFromAMQByMac(String Mac){

        // ConnectionFactory ：连接工厂，JMS 用它创建连接
        ConnectionFactory connectionFactory;
        // Connection ：JMS 客户端到JMS Provider 的连接
        Connection connection = null;
        // Session： 一个发送或接收消息的线程
        Session session;
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
                //设置接收者接收消息的时间，为了便于测试，这里谁定为100s
                TextMessage message = (TextMessage) consumer.receive(1);
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
	
	
}
