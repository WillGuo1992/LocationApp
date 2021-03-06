package WifiTest;

import javax.management.MBeanServerConnection;
import javax.management.MBeanServerInvocationHandler;
import javax.management.ObjectName;
import javax.management.remote.JMXConnector;
import javax.management.remote.JMXConnectorFactory;
import javax.management.remote.JMXServiceURL;

import org.apache.activemq.broker.jmx.BrokerViewMBean;
import org.apache.activemq.broker.jmx.QueueViewMBean;

public class StateTest1 {

    /**
     * 获取状态
     * @throws Exception
     */
    public static void main(String[] args) throws Exception {
        JMXServiceURL url = new JMXServiceURL("service:jmx:rmi:///jndi/rmi://localhost:2011/jmxrmi");
        JMXConnector connector = JMXConnectorFactory.connect(url, null);
        connector.connect();
        MBeanServerConnection connection = connector.getMBeanServerConnection();

         // 需要注意的是，这里的my-broker必须和上面配置的名称相同
        ObjectName name = new ObjectName("my-broker:BrokerName=localhost,Type=Broker");
        BrokerViewMBean mBean =  (BrokerViewMBean)MBeanServerInvocationHandler.newProxyInstance(connection,                     name, BrokerViewMBean.class, true);
        // System.out.println(mBean.getBrokerName());
        for(ObjectName queueName : mBean.getQueues()) {
            QueueViewMBean queueMBean =                     (QueueViewMBean)MBeanServerInvocationHandler.newProxyInstance(connection, queueName, QueueViewMBean.class, true);
            System.out.println("\n------------------------------\n");

            // 消息队列名称
            System.out.println("States for queue --- " + queueMBean.getName());

            // 队列中剩余的消息数
            System.out.println("Size --- " + queueMBean.getQueueSize());

            // 消费者数
            System.out.println("Number of consumers --- " + queueMBean.getConsumerCount());

            // 出队数
            System.out.println("Number of dequeue ---" + queueMBean.getDequeueCount() );
        }
        
        }

    }