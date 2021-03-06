#北航室内外定位及大数据分析系统
##综述

## 室内定位

### 整体概况

包含数据总条数、指纹点数、zmq内数据量、设备在线情况、可用于定位的设备情况、

1. 历史
2. 实时

### 室内定位基本方法

#### 1.标签定位 

注：连接到某一个AP后就不再收到其他AP的报文信息。所以服务端定位时将WIFI功能打开但是不要连接到某一个特定AP

> 标签定位指利用信号源作为定位锚点，将用户位置固定到某一个锚点上。 标签定位流程如下：
>
> 1. 预先取得室内信号源的位置，包括水平坐标，楼层
> 2. 扫描信号
> 3. 当扫描到数据库对应的信号源信号，以rssi最大的信号源所在的位置作为当前的定位位置
>
> 标签定位的优点是：
>
> 1. 没有计算量
> 2. 部署简单
> 3. 定位不会出现不合理的偏差
>
> 标签定位的劣势是：
>
> 1. 定位精度取决于信号源部署密度
> 2. 无法覆盖区域，只能标识热点区域

* AMQ实时定位200-350ms时间；文件定位最多可能需要1s钟，主要用在文件中相关报文查找
* 定位间隔为5s时，每次能收到4-7个AP的信息
* 定位间隔为1s时，收到的AP数很少，位置点经常跳动

#### 2.三角定位

> 三角定位通过rssi值计算用户与信号源间的距离（rssi-dist mapper），再通过基本的几何运算计算确定用户的位置。定位流程如下：
>
> 1. 预先取得无线信号源的几何位置，包括水平坐标，高度
> 2. 扫描信号
> 3. 当扫描到至少三个已知信号源信号，根据预置的rssi-dist mapper计算出用户与各个对应信号源的直线距离
> 4. 根据3中换算的直线距离，进行三角定位计算，得出当前的水平位置坐标
>
> 三角定位的优点：
>
> 1. 无须勘测
> 2. 计算量小
> 3. 便于快速部署
>
> 三角定位的缺点：
>
> 1. 精度一般
> 2. 需要精确标注Ap位置
> 3. 需要部署硬件
> 4. rssi-dist mapper容易受室内环境影响，如反射，障碍（多径效应、信号衰减不确定性）
> 5. 因为手机不同的制造工艺，不同的芯片，不同的机壳材质，会导致无线电信号RSSI感知的差异，呈现出非线性的规律
> 6. ​

* [美团总部比较好的实现例子](http://tech.meituan.com/mt-wifi-locate-practice-part1.html)
* 目前系统使用的n=4，A=-40
* 目前系统使用方法：均值滤波（-75以上的报文才使用）+最小二乘线性回归；
* 其他方法还有：三角形质心法及三角形加权质心法等
* 三角定位调参A和n：A为距离AP位置一米时rssi强度，n为衰减系数，为经验值（2-4）之间，由于是系数为负数的对数函数，所以n越小，突变越大，即对rssi越敏感。总结，在复杂的环境中尽量使用大的n，在开阔的环境中使用小的n
* G1149工位静止还可以（精度不好，由于和G1101之间穿过了2面墙和一个防火门，所以到此点的距离与实际差别较大，将n调小的原因也在此）
####3.指纹匹配

*  [APP-记录wifi的RSS数据以及传感器（磁力计等）数据，可以用来为室内定位建立指纹库。(Collect data of RSS, Magnetic, and some other sensors)](https://github.com/jiangqideng/RssMagDetect)
* 提高定位速度的方法     划分子区域：通过是否可以接收到此AP信息

####4.KNN
####5.KNN+SVM

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

5. apache-tomcat-7.0.73-windows-x64（因与struts2存在兼容问题，弃用，换用一个老一点的版本）apache-tomcat-7.0.57-windows-x64

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
* [Log4j 使用详解](http://blog.csdn.net/evankaka/article/details/45815047)
* 高考志愿小强（问答机器人）





