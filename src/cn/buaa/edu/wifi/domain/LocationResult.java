package cn.buaa.edu.wifi.domain;

public class LocationResult {
	private String apName;
	private int locationId;
	private float x;
	private float y;
	private float z;
	private int locationMethod;	//定位方式 1.tag定位
	private String remark;
	
	
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
}
