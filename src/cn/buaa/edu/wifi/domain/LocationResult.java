package cn.buaa.edu.wifi.domain;

public class LocationResult {
	private int msgCode ; //定位结果标志位  1.表示定位成功      2.表示三角定位中AP数少,定位不成功  3.指纹法由于定位报文少,定位不成功
	private String apName;
	private int locationId;
	private float x;
	private float y;
	private float z;
	private int locationMethod;	//定位方式 1.tag定位 2.三角定位 3.指纹定位KNN
	private String remark;	//附加信息，传给前端，便于查看
	
	
	public String getApName() {
		return apName;
	}
	public void setApName(String apName) {
		this.apName = apName;
	}
	public int getLocationId() {
		return locationId;
	}
	public void setLocationId(int locationId) {
		this.locationId = locationId;
	}
	public float getX() {
		return x;
	}
	public void setX(float x) {
		this.x = x;
	}
	public float getY() {
		return y;
	}
	public void setY(float y) {
		this.y = y;
	}
	public float getZ() {
		return z;
	}
	public void setZ(float z) {
		this.z = z;
	}
	public int getLocationMethod() {
		return locationMethod;
	}
	public void setLocationMethod(int locationMethod) {
		this.locationMethod = locationMethod;
	}
	public String getRemark() {
		return remark;
	}
	public void setRemark(String remark) {
		this.remark = remark;
	}
	public void appendRemark(String append) {
		this.remark = this.remark+";"+ append;
	}
	public int getMsgCode() {
		return msgCode;
	}
	public void setMsgCode(int msgCode) {
		this.msgCode = msgCode;
	}
}
