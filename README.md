#北航室内外定位及大数据分析系统
##综述

## 室内定位

1. 整体概况

   包含数据总条数、指纹点数、zmq内数据量、设备在线情况、可用于定位的设备情况、

   1. 历史
   2. 实时

2. 室内定位方法

   1. 三角定位
   2. 指纹匹配
   3. KNN
   4. KNN+SVM

## 手机信令

1. 整体概况
   1. 设备总数、在线情况
2. 轨迹回放
3. POI
4. ​

## 大数据分析_客流分析

1. 整体客流
2. 轨迹回放
3. POI
4. 楼层客流
5. 业态客流
6. 顾客模型
7. 特征日模型
8. 客流热力图
9. 手机数据
   1. 手机品牌
   2. 操作系统

## 系统管理

1. 管理1

## 其他

1. 测试1

2. 测试2

3. 。。。

   ​


# 参考文档

1. [某公司将室内定位的review](https://github.com/ibip/ibip_document/wiki/%E5%AE%A4%E5%86%85%E5%AE%9A%E4%BD%8D%E5%8E%9F%E7%90%86%E4%B8%8E%E5%BC%95%E6%93%8E%E6%9E%B6%E6%9E%84)
2. ​


# 系统说明

## 环境配置说明

1. jdk1.7

   必须为1.7，测试时发现1.6或1.8都有问题，未解决，配置成1.7就可以了。

2. apache-maven-3.5.0

3. ZeroMQ 4.0.4（暂未使用）

4. apache-activemq-5.14.5

   ​	使用前需启动activemq.bat，windows下可配置为服务，启动服务即可；

5. apache-tomcat-7.0.73-windows-x64

## 部分协议说明

1. AP to LocationEngine_GW：

   ​	使用的是AeroScout协议，注意要G11实验室AC配置页面将协议配成AS协议

2. ​


# 其他说明

1. iPhone iOS 8 设备探测阶段存在随机 MAC 地址 [见链接](https://www.zhihu.com/question/24094236?sort=created)
2. activemq 37G —>3.9G 可以设定缓存大小等
3. ​


# 不清楚的名词解释（TO DO）

* JSM 
* NIO
* 卡尔曼滤波
* 隐马尔科夫模型
* 高斯滤波
* 贝叶斯公式
*  [Log4j 使用详解](http://blog.csdn.net/evankaka/article/details/45815047)
* 高考志愿小强（问答机器人）





