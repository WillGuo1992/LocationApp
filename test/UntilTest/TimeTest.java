package UntilTest;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

import org.junit.Test;

public class TimeTest {
	public static String locStartTime = "2017.06.28 16:40:00";
	@Test
	public void test1(){
		//从文件中获得当前MAC的报文，用于历史数据定位
				SimpleDateFormat ft = new SimpleDateFormat("yyyy.MM.dd hh:mm:ss");
				try {
					Date date = ft.parse(locStartTime);
					System.out.println(date);
					
				} catch (ParseException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
	}
}
