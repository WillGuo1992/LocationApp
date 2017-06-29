package WifiTest;

import java.io.File;

import org.apache.activemq.broker.BrokerService;
import org.apache.activemq.broker.jmx.ManagementContext;
import org.apache.activemq.store.kahadb.KahaDBStore;

public class RunServer {
	/** 启动activeMQ服务 */
    public static void main(String[] args) throws Exception {
        RunServer rs = new RunServer();       
        BrokerService broker = rs.startServer();
    }
   
    public BrokerService startServer() throws Exception{
        // java代码调用activemq相关的类来构造并启动brokerService
        BrokerService broker = new BrokerService();

        // 以下是持久化的配置
        // 持久化文件存储位置
        File dataFilterDir = new File("targer/amq-in-action/kahadb");
        KahaDBStore kaha = new KahaDBStore();
        kaha.setDirectory(dataFilterDir);
        // use a bigger journal file
        kaha.setJournalMaxFileLength(1024*100);
        // small batch means more frequent and smaller writes
        kaha.setIndexWriteBatchSize(100);
        // do the index write in a separate thread
        kaha.setEnableIndexWriteAsync(true);
       
        broker.setPersistenceAdapter(kaha);
        // create a transport connector
        broker.addConnector("tcp://localhost:61616");
        broker.setUseJmx(true);
        //broker.setDataDirectory("data/");
       

        // 以下是ManagementContext的配置，从这个容器中可以取得消息队列中未执行的消息数、消费者数、出队数等等
        // 设置ManagementContext
        ManagementContext context = broker.getManagementContext();
        context.setConnectorPort(2011);
        context.setJmxDomainName("my-broker");
        context.setConnectorPath("/jmxrmi");
        broker.start();
        return broker;
    }
}
