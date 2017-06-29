package cn.buaa.edu.wifi.domain;

import java.util.Map;
/**
 * 新主楼G11 H3C Ap位置信息
 * @author nlsde
 *
 */
public class ApInfo {
		private String apName;   		//ApName  标注ap位于哪个房间
		private String apMac;			//apMac
		private float x;				//该点的x坐标 单位m
		private float y;				//该点的y坐标 单位m
		private float z;				//该点的z坐标 单位m
		
		public String getApName() {
			return apName;
		}
		public void setApName(String apName) {
			this.apName = apName;
		}
		public String getApMac() {
			return apMac;
		}
		public void setApMac(String apMac) {
			this.apMac = apMac;
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
		@Override
		public String toString() {
			return "ApInfo [apName=" + apName + ", apMac=" + apMac + ", x=" + x
					+ ", y=" + y + ", z=" + z + "]";
		}
		
		
		
		
}
