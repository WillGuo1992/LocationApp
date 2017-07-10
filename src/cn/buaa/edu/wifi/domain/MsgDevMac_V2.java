package cn.buaa.edu.wifi.domain;

import java.io.Serializable;
import java.nio.ByteBuffer;
import java.text.ParseException;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateFormatUtils;
import org.apache.commons.lang3.time.DateUtils;

import cn.buaa.edu.util.MacUtil;

/**
 * MsgDevMac_V2
 * @author gaojie
 *
 */
public class MsgDevMac_V2 extends MsgDevMac_V1 implements Serializable {
	private static final long serialVersionUID = 1L;
	public static final int VERSION = 2;
	
	public static final int EstimateCapacity = 100;

	
	protected byte frameType;
	protected String bssid;
	// noise Floor
	protected byte noiseFloor;
	// Radio Type
	protected byte radioType;
	// Device Type
	protected byte deviceType; 

	protected int isAssociated;
	
	public MsgDevMac_V2(long seq, ORIGIN org, String apMac, String devMac, short rssi,
			long time, int channel, int isAssociated, byte frameType, String bssid, byte noiseFloor, byte radType, byte devType) {
		super(seq, org, apMac, devMac, rssi, time, channel);
		this.frameType = frameType;
		this.bssid = bssid;
		this.noiseFloor = noiseFloor;
		this.radioType = radType;
		this.deviceType = devType;
		this.isAssociated=isAssociated;
	}

	public MsgDevMac_V2() {
	}

	public static MsgDevMac_V2 buildFromText(String message, String origin)
			throws ParseException {
		//2,20150106185745,0C:DA:41:EA:5E:90,0C:DA:41:EA:60:A1,-94,1420541865859,11,74687369,4,0C:DA:41:EA:5E:90,-105,0,0
		String[] split = StringUtils.split(message, ",");
		long sendTime = DateUtils.parseDate(split[1], "yyyyMMddHHmmss",
				"yyyyMMddHHmmss.SSS").getTime();
		String apMac 	= split[2];
		String devMac 	= split[3];
		short rssi 		= Short.parseShort(split[4]);
		@SuppressWarnings("unused")
		long apTime 	= Long.parseLong(split[5]);
		int channel 		= Integer.parseInt(split[6]);
		long seq 		= Long.parseLong(split[7]);
		byte frameType 	= Byte.parseByte(split[8]);
		
		String bssid = apMac;
		//noise floor
		byte noiseFloor	= 0;
		byte radioType 	= 0;
		byte deviceType = 0;
		
		
		if(split.length > 9){
			 bssid 	= split[9];
			 //noise floor
			 noiseFloor	= Byte.parseByte(split[10]) ;
			 radioType 	= Byte.parseByte(split[11]) ;
			 deviceType = Byte.parseByte(split[12]);
		}
		
		int isAssociated = 0;
		return new MsgDevMac_V2(seq, ORIGIN.valueOf(origin.toUpperCase()), apMac, devMac, rssi, sendTime, channel,isAssociated,
				frameType, bssid, noiseFloor, radioType, deviceType);
	}

	@Override
	public StringBuilder toValue() {
		// 20140731160827,9C:1C:12:CC:2B:6A,A0:88:B4:55:0D:C8,-62,1406794107194,153,397274,100
		StringBuilder buf = new StringBuilder(EstimateCapacity);
		buf.append(getVersion()).append(",");
		buf.append(DateFormatUtils.format(System.currentTimeMillis(), "yyyyMMddHHmmss")).append(",");
		buf.append(getApMac()).append(",");
		buf.append(getDevMac()).append(",");
		buf.append(getRssi()).append(",");
		buf.append(getTime()).append(",");
		buf.append(getChannel()).append(",");
		buf.append(getSeq()).append(",");
		buf.append(getFrameType()).append(",");
		buf.append(getBssid()).append(",");
		buf.append(getNoiseFloor()).append(",");
		buf.append(getRadioType()).append(",");
		buf.append(getDeviceType());
		return buf;
	}
	
	@Override
	public StringBuilder toAPValue() {
		StringBuilder sb = new StringBuilder();
		sb.append(this.getDevMac()).append(",");
		sb.append(this.getRssi()).append(",");
		sb.append(this.getTime()).append(",");
		sb.append(this.getChannel()).append(",");
		sb.append(this.getBssid()).append(",");
		sb.append(this.getFrameType());
		return sb;
	}
	
	public static final int BIN_LEN = 6+2+8+4+6+1;
	@Override
	public byte[] toAPBinValue() {
		//[devMac:6][rssi:2][time:8][channel:4][bssid:6][frameType:1]
		ByteBuffer bb = ByteBuffer.allocate(BIN_LEN);
		bb.put(MacUtil.toMacBin(getDevMac()));
		bb.putShort(getRssi());
		bb.putLong(getTime());
		bb.putInt(getChannel());
		bb.put(MacUtil.toMacBin(getBssid()));
		bb.put(frameType);
		return bb.array();
	}
	
	@Override
	public int getVersion() {
		return VERSION;
	}

	public byte getFrameType() {
		return frameType;
	}

	public void setFrameType(byte frameType) {
		this.frameType = frameType;
	}

	public byte getNoiseFloor() {
		return noiseFloor;
	}

	public void setNoiseFloor(byte noiseFloor) {
		this.noiseFloor = noiseFloor;
	}


	public byte getRadioType() {
		return radioType;
	}


	public void setRadioType(byte radioType) {
		this.radioType = radioType;
	}


	public byte getDeviceType() {
		return deviceType;
	}


	public void setDeviceType(byte deviceType) {
		this.deviceType = deviceType;
	}

	public String getBssid() {
		return (StringUtils.isEmpty(bssid) || "null".equals(bssid)) ? this.getApMac() : bssid;
	}

	public void setBssid(String bssid) {
		this.bssid = bssid;
	}

	

}
