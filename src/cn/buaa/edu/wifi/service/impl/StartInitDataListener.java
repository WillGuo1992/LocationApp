package cn.buaa.edu.wifi.service.impl;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

import org.apache.log4j.Logger;
import org.springframework.context.ApplicationListener;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.stereotype.Service;

import cn.buaa.edu.wifi.domain.ApInfo;
/**
 * spring一起动即加载的资源
 * 
 * @author nlsde
 *
 */
@Service
public class StartInitDataListener implements ApplicationListener<ContextRefreshedEvent>{
	
	private static Logger logger = Logger.getLogger(StartInitDataListener.class);
	public static List<ApInfo> apList = new ArrayList<ApInfo>();
	@Override
	public void onApplicationEvent(ContextRefreshedEvent arg0) {
		logger.info("\n\n\n\n\n______________\n\n\napList加载了\n\n_________\n\n");
		  //获取到classes目录的全路径
		  String path = this.getClass().getClassLoader().getResource("/").getPath();
		  System.out.println(path);
		  //读取apInfo.csv文件
		  try { 
              BufferedReader reader = new BufferedReader(new FileReader(path+"/apInfo.csv"));//换成你的文件名
              reader.readLine();//第一行信息，为标题信息，不用，如果需要，注释掉
              String line = null; 
              
              while((line=reader.readLine())!=null){ 
            	  ApInfo apInfo = new ApInfo();
                  String item[] = line.split(",");//CSV格式文件为逗号分隔符文件，这里根据逗号切分
                  apInfo.setApName(item[0]);
                  apInfo.setApMac(item[1]);
                  apInfo.setX(Float.valueOf(item[2]));
                  apInfo.setY(Float.valueOf(item[3]));
                  apList.add(apInfo);
                  logger.info(apInfo.toString()); 
              } 
          } catch (Exception e) { 
              e.printStackTrace(); 
          } 
	}
	

}
