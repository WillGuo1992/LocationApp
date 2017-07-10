package cn.buaa.edu.wifi.domain;

import java.io.BufferedReader;
import java.io.FileReader;
import java.util.ArrayList;
import java.util.List;

import javax.swing.JPopupMenu.Separator;

public class SpectrumMap {
	public SpectrumMap() {
		if(spectrumMap.size()==0 || titles.length==0)
			loadMap();
	}
	public static List<SpectrumInfo> spectrumMap = new ArrayList<SpectrumInfo>();
	public static String[] titles = null ; 		//spectrum.csv文件里的表头， 可获得在spectrumMap里的rssi值对应的ap顺序
	
	public void loadMap(){
		// 获取到classes目录的全路径
		String path = this.getClass().getResource("/").getPath();
		System.out.println(path);
		
		try{
			//从spectrum.csv加载map信息
			BufferedReader reader = new BufferedReader(new FileReader(path+"/spectrum.csv"));
			String line = reader.readLine();
			titles = line.split(",");
			while((line = reader.readLine()) != null){
				SpectrumInfo info = new SpectrumInfo();
				String[] blocks = line.split(",");
				info.setLocationID(Integer.valueOf(blocks[0]));
				List<Float> list = new ArrayList<Float>();
				for(int i=1;i<titles.length;i++){
					list.add(Float.valueOf(blocks[i]));
				}
				info.setRssi(list);
				spectrumMap.add(info);
			}
			//从location-map.csv加载x y信息
			reader = new BufferedReader(new FileReader(path+"/location-map.csv"));
			line = reader.readLine();
			while((line = reader.readLine()) != null){
				String[] blocks = line.split(",");
				int locationId = Integer.valueOf(blocks[0]);
				for(SpectrumInfo info : spectrumMap){
					if(info.getLocationID()==locationId){
						info.setX(Float.valueOf(blocks[1]));
						info.setY(Float.valueOf(blocks[2]));
						break;
					}
				}
			}
		}
		catch (Exception e){
			e.printStackTrace();
		}
		finally{
			System.out.println("加载两个map文件完成");
		}
	}
	
	public SpectrumInfo getSpectrumInfoByLocationId(int id){
		for(SpectrumInfo info : spectrumMap){
			if(info.getLocationID()==id)
				return info;
		}
		return null;
		
	}
}
