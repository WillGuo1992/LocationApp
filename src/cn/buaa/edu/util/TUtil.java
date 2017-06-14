package cn.buaa.edu.util;


import java.lang.reflect.ParameterizedType;

public class TUtil {

	/**T型转换*/
	public static Class getActualType(Class entity) {
		ParameterizedType parameterizedType = (ParameterizedType) entity.getGenericSuperclass();
		Class entityClass = (Class) parameterizedType.getActualTypeArguments()[0];
		return entityClass;
	}
	
}
