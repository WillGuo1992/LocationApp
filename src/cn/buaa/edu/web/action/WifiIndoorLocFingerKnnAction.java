package cn.buaa.edu.web.action;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.log4j.Logger;
import org.apache.struts2.interceptor.ServletRequestAware;
import org.apache.struts2.interceptor.ServletResponseAware;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;

import cn.buaa.edu.wifi.domain.LocationResult;
import cn.buaa.edu.wifi.service.impl.WifiIndoorLocFingerKnnMethod;
import cn.buaa.edu.wifi.service.impl.WifiIndoorTriangleLocMethod;

import com.alibaba.fastjson.JSON;
import com.opensymphony.xwork2.ActionSupport;

/**
 * 室内定位——三角定位
 * @author nlsde
 *
 */

@SuppressWarnings("serial")
@Controller("WifiIndoorLocFingerKnnAction")
@Scope(value="prototype")
public class WifiIndoorLocFingerKnnAction extends ActionSupport implements ServletRequestAware,ServletResponseAware {
	private Logger logger = Logger.getLogger(WifiIndoorLocFingerKnnAction.class);
	protected HttpServletRequest request;
	protected HttpServletResponse response;
	
	@Override
	public void setServletResponse(HttpServletResponse arg0) {
		this.response = arg0;
	}

	@Override
	public void setServletRequest(HttpServletRequest arg0) {
		this.request = arg0;
	}
	public String get() throws Exception{
		request.setCharacterEncoding("utf-8");  //这里不设置编码会有乱码
		response.setContentType("text/html;charset=utf-8");
		String device_mac = request.getParameter("device_mac").toUpperCase();
		//TODO iphone MAC:C0:CC:F8:B1:D2:0D   android mac:CC:3A:61:A9:09:53
		device_mac = "CC:3A:61:A9:09:53";
		WifiIndoorLocFingerKnnMethod method = new WifiIndoorLocFingerKnnMethod();
		LocationResult locationResult = method.getLocByKnnMethodUsingActiveMQ(device_mac);
		String res = JSON.toJSONString(locationResult);
		response.getWriter().write(res);
		return NONE;
	}
}
