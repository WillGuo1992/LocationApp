package cn.buaa.edu.wifi.domain;

import java.io.Serializable;
import java.nio.ByteBuffer;
import java.text.ParseException;

import org.apache.commons.lang3.StringUtils;
import org.apache.commons.lang3.time.DateFormatUtils;
import org.apache.commons.lang3.time.DateUtils;

import cn.buaa.edu.util.MacUtil;


/**
 * 
 * @author gaojie
 *
 */
public class MsgDevMac_V1 extends MsgDevMac implements Serializable {
	 
	private static final long serialVersionUID = 1L;
	public static final int VERSION = 1;
	
	public static final int EstimateCapacity = 100;

	public MsgDevMac_V1(long seq, ORIGIN org, String apMac, String devMac, short rssi,
			long time, int channel) {
		super(seq, org, devMac, apMac, rssi, time, channel);
	}

	public MsgDevMac_V1() {
	}

	public static MsgDevMac_V1 buildFromText(String message, String origin)
			throws ParseException {
		// {send_time, ap_mac, dev_mac, rssi, ap_time, channel,
		// sequence, frameType}
		// 20140731160827,9C:1C:12:CC:2B:6A,A0:88:B4:55:0D:C8,-62,1406794107194,153,397274,100
		String[] split = StringUtils.split(message, ",");

		long sendTime = DateUtils.parseDate(split[1], "yyyyMMddHHmmss", "yyyyMMddHHmmss.SSS").getTime();
		String apMac = split[2];
		String devMac = split[3];
		short rssi = Short.parseShort(split[4]);
		@SuppressWarnings("unused")
		long apTime = Long.parseLong(split[5]);
		int channel = Integer.parseInt(split[6]);
		long seq = Long.parseLong(split[7]);

		return new MsgDevMac_V1(seq, ORIGIN.valueOf(origin.toUpperCase()), apMac, devMac, rssi, sendTime, channel);
	}

	@Override
	public StringBuilder toValue() {
		// 20140731160827,9C:1C:12:CC:2B:6A,A0:88:B4:55:0D:C8,-62,1406794107194,153,397274,100
		StringBuilder buf = new StringBuilder(EstimateCapacity);
		buf.append(getVersion()).append(",");
		buf.append(DateFormatUtils.format(System.currentTimeMillis(), "yyyyMMddHHmmss")).append(",");
		buf.append(this.getApMac()).append(",");
		buf.append(this.getDevMac()).append(",");
		buf.append(this.getRssi()).append(",");
		buf.append(this.getTime()).append(",");
		buf.append(this.getChannel()).append(",");
		buf.append(this.getSeq());
		return buf;
	}

	@Override
	public int getVersion() {
		return VERSION;
	}

	public int getEstimateCapacity() {
		return EstimateCapacity;
	}

	@Override
	public StringBuilder toAPValue() {
		StringBuilder sb = new StringBuilder();
		sb.append(this.getDevMac()).append(",");
		sb.append(this.getRssi()).append(",");
		sb.append(this.getTime()).append(",");
		sb.append(this.getChannel());
		return sb;
	}
	
	
	//[devMac:6][rssi:2][time:8][channel:4]
	public static final int BIN_LEN = 6+2+8+4;
	@Override
	public byte[] toAPBinValue() {
		ByteBuffer bb = ByteBuffer.allocate(BIN_LEN);
		bb.put(MacUtil.toMacBin(getDevMac()));
		bb.putShort(getRssi());
		bb.putLong(getTime());
		bb.putInt(getChannel());
		return bb.array();
	}
}
