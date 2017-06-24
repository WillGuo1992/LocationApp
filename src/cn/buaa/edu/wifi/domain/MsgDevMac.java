package cn.buaa.edu.wifi.domain;


public abstract class MsgDevMac {
	public abstract int getVersion();

	public abstract StringBuilder toValue();
	public abstract StringBuilder toAPValue();
	public abstract byte[] toAPBinValue();
 
	protected ORIGIN origin;

	public enum ORIGIN{
		TANZHI, RTLS, AEROSCOUT, H3C, ANY;
	
		public static void valueof(String v) {
			 valueOf(ORIGIN.class, v.toUpperCase());
		};
	}
	
	//处理该数据的服务器时间
	private long stime;
	//该数据来源时间
	private long time;

	private long seq;
	private String devMac;
	private String apMac;
	private short rssi;
	
	private int channel;
	private int gId;
	private int mapId;
	
	public MsgDevMac() {
	}

	public MsgDevMac(long seq, ORIGIN origin, String devMac, String apMac, short rssi,
			long time, int channel) {
		super();
		this.seq = seq;
		this.origin = origin;
		this.devMac = devMac;
		this.apMac = apMac;
		this.rssi = rssi;
		this.time = time;
		this.channel = channel;
	}

	public long getSeq() {
		return seq;
	}

	public void setSeq(long seq) {
		this.seq = seq;
	}

	public String getDevMac() {
		return devMac;
	}

	public void setDevMac(String devMac) {
		this.devMac = devMac;
	}

	public short getRssi() {
		return rssi;
	}

	public void setRssi(short rssi) {
		this.rssi = rssi;
	}

	public long getTime() {
		return time;
	}

	public void setTime(long time) {
		this.time = time;
	}

	public int getChannel() {
		return channel;
	}

	public void setChannel(int channel) {
		this.channel = channel;
	}

	public String getApMac() {
		return apMac;
	}

	public void setApMac(String apMac) {
		this.apMac = apMac;
	}

	public long getStime() {
		return stime;
	}

	public void setStime(long stime) {
		this.stime = stime;
	}

	public ORIGIN getOrigin() {
		return origin;
	}

	public void setOrigin(ORIGIN origin) {
		this.origin = origin;
	}

	public int getgId() {
		return gId;
	}

	public void setgId(int gId) {
		this.gId = gId;
	}

	public int getMapId() {
		return mapId;
	}

	public void setMapId(int mapId) {
		this.mapId = mapId;
	}

}
