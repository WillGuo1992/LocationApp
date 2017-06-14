package cn.buaa.edu.web.action;

import javax.annotation.Resource;

import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Controller;

import cn.buaa.edu.wifi.domain.ElecText;
import cn.buaa.edu.wifi.service.IElecTextService;

/**
 * @Controller("elecTextAction")
 * 相当于spring容器中定义
 * <bean id="elecTextAction" class="com.itheima.elec.web.action.ElecTextAction" scope="prototype">
 */
@SuppressWarnings("serial")
@Controller("elecTextAction")
@Scope(value="prototype")
public class ElecTextAction extends BaseAction<ElecText> {
	
	ElecText elecText = this.getModel();
	
	/**注入Service*/
	@Resource(name=IElecTextService.SERVICE_NAME)
	IElecTextService elecTextService;
	
	/**  
	* @Name: save
	* @Description: 保存
	* @Author: 刘洋（作者）
	* @Version: V1.00 （版本号）
	* @Create Date: 2014-11-28 （创建日期）
	* @Parameters: 无
	* @Return: String：跳转到textAdd.jsp
	*/
	public String save(){
		elecTextService.saveElecText(elecText);
		String textDate = request.getParameter("textDate");
		return "save";
	}

	
}
