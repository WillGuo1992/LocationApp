package cn.buaa.edu.wifi.knn;
//basic metric interface

public interface Metric {
	double getDistance(Record s, Record e);
}
