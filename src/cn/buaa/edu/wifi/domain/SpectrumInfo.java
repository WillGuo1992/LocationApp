package cn.buaa.edu.wifi.domain;

import java.util.List;
import java.util.Map;
/**
 * 指纹库信息
 * @author nlsde
 *
 */
public class SpectrumInfo {
	private int locationID;   		//指纹点ID
	private List<Float> rssi; //该点处对应Ap的rssi强度 集合 按顺序
	private float x;				//该点的x坐标 单位m
	private float y;				//该点的y坐标 单位m
	private float z;				//该点的z坐标 单位m
	
	
	public int getLocationID() {
		return locationID;
	}
	public void setLocationID(int locationID) {
		this.locationID = locationID;
	}
	public List getRssi() {
		return rssi;
	}
	public void setRssi(List rssi) {
		this.rssi = rssi;
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
	
	
}
