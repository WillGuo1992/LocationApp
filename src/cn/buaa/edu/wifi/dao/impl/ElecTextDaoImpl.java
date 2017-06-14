package cn.buaa.edu.wifi.dao.impl;


import org.springframework.stereotype.Repository;

import cn.buaa.edu.wifi.dao.IElecTextDao;
import cn.buaa.edu.wifi.domain.ElecText;


/**
 * @Repository(IElecTextDao.SERVICE_NAME)
 * 相当于在spring容器中定义：
 * <bean id="com.itheima.elec.dao.impl.ElecTextDaoImpl" class="com.itheima.elec.dao.impl.ElecTextDaoImpl">
 *
 */
@Repository(IElecTextDao.SERVICE_NAME)
public class ElecTextDaoImpl  extends CommonDaoImpl<ElecText> implements IElecTextDao {

}
