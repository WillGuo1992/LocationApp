package cn.buaa.edu.web.action;

import java.io.IOException;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import org.apache.struts2.interceptor.ServletRequestAware;
import org.apache.struts2.interceptor.ServletResponseAware;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;
  
import com.alibaba.fastjson.JSON;
import com.opensymphony.xwork2.ActionSupport;
import com.opensymphony.xwork2.ModelDriven;
import com.sun.corba.se.impl.copyobject.JavaStreamObjectCopierImpl;

/**
 * 室内定位——三角定位
 * @author nlsde
 *
 */

@SuppressWarnings("serial")
@Controller("WifiIndoorTriangleAction")
@Scope(value="prototype")
public class WifiIndoorTriangleAction extends ActionSupport implements ServletRequestAware,ServletResponseAware {

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
	
	public String get() throws IOException{
		String device_mac = request.getParameter("device_mac");
		String str = "{'a':'b','c','d'}";
		response.getWriter().write(str);
		//JSON.toJSONString(object);
		System.out.println(device_mac);
		
		return NONE;
	}
}
