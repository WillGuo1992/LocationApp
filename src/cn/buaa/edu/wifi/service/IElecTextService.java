package cn.buaa.edu.wifi.service;

import java.util.List;

import cn.buaa.edu.wifi.domain.ElecText;


public interface IElecTextService {
	public static final String SERVICE_NAME = "com.itheima.elec.service.impl.ElecTextServiceImpl";
	
	void saveElecText(ElecText elecText);

	List<ElecText> findCollectionByConditionNoPage(ElecText elecText);
}
