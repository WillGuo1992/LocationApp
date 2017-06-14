package cn.buaa.edu.wifi.service.impl;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import javax.annotation.Resource;

import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import cn.buaa.edu.wifi.dao.IElecTextDao;
import cn.buaa.edu.wifi.domain.ElecText;
import cn.buaa.edu.wifi.service.IElecTextService;


/**
 * @Service
 * 相当于在spring容器中定义：
 * <bean id="com.itheima.elec.service.impl.ElecTextServiceImpl" class="com.itheima.elec.service.impl.ElecTextServiceImpl">
 */
@Service(IElecTextService.SERVICE_NAME)
@Transactional(readOnly=true)
public class ElecTextServiceImpl implements IElecTextService {

	@Resource(name=IElecTextDao.SERVICE_NAME)
	IElecTextDao elecTextDao;
	
	/**保存测试表*/
	@Transactional(isolation=Isolation.DEFAULT,propagation=Propagation.REQUIRED,readOnly=false)
	public void saveElecText(ElecText elecText) {
		elecTextDao.save(elecText);
	}
	
	/**指定查询条件，查询列表*/
	/**
	 * SELECT * FROM elec_text o WHERE 1=1     #Dao层
		AND o.textName LIKE '%张%'   #Service层
		AND o.textRemark LIKE '%张%'   #Service层
		ORDER BY o.textDate ASC,o.textName DESC  #Service层
	 */
	public List<ElecText> findCollectionByConditionNoPage(ElecText elecText) {
		//查询条件
		String condition = "";
		//查询条件对应的参数
		List<Object> paramsList = new ArrayList<Object>();
		if(StringUtils.isNotBlank(elecText.getTextName())){
			condition += " and o.textName like ?";
			paramsList.add("%"+elecText.getTextName()+"%");
		}
		if(StringUtils.isNotBlank(elecText.getTextRemark())){
			condition += " and o.textRemark like ?";
			paramsList.add("%"+elecText.getTextRemark()+"%");
		}
		//传递可变参数
		Object [] params = paramsList.toArray();
		//排序
		Map<String, String> orderby = new LinkedHashMap<String, String>();//有序
		orderby.put("o.textDate", "asc");
		orderby.put("o.textName", "desc");
		//查询
		List<ElecText> list = elecTextDao.findCollectionByConditionNoPage(condition,params,orderby);
		return list;
	}

}
