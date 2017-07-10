/**
 * Created by nlsde on 2017-07-03.
 */
$(document).ready(function () {
    //A不变，n变化
    triangleEcharts("change_n");
    triangleEcharts("change_A");
})
function calculateData() {

}
function getLen(rssi) {
    //d为定位节点与参考点之间的距离，单位m；A为定位节点与参考点之间的距离d为1m时测得的RSSI值；n为信号衰减因子，范围一般为2～4。
    //在现场环境中，我们取A为-50，n为2.1。
    var A = -40;
    var n = 2.2;
    var f=(-rssi+A)/(10*n);
    return Math.pow(10,f);
}
function getLen(rssi,A,n) {
    //d为定位节点与参考点之间的距离，单位m；A为定位节点与参考点之间的距离d为1m时测得的RSSI值；n为信号衰减因子，范围一般为2～4。
    //在现场环境中，我们取A为-40，n为2.1。
    var f=(-rssi+A)/(10*n);
    return Math.pow(10,f);
}
function triangleEcharts(Id) {
    var series = [ ];
    var legendnames = [];
    var sbutitle = '';
    // 基于准备好的dom，初始化echarts实例
    var myChart = echarts.init(document.getElementById(Id));

    //change n
    if(Id.toString() == 'change_n'){
        sbutitle = 'A=-40,n变化';
        var A=-40;
        for(var n=2;n<=4;n=n+0.5){
            var data = [];

            for(var i = -80; i< -30; i++){
                var x = i;
                var y = getLen(x,A,n);
                y = (Number(y)).toFixed(3);
                data.push([x,y]);
            }
            var name = 'n='+n;
            series.push({
                name: name,
                type: 'line',
                data: data
            })
            legendnames.push(name)
        }
    }
    //change A
    if(Id.toString() == 'change_A'){
        sbutitle = 'n=2,A变化';
        var n=2;
        for(var A=-50;A<=-40;A=A+1){
            var data = [];

            for(var i = -80; i< -30; i++){
                var x = i;
                var y = getLen(x,A,n);
                y = (Number(y)).toFixed(3);
                data.push([x,y]);
            }
            var name = 'A='+A;
            series.push({
                name: name,
                type: 'line',
                data: data
            })
            legendnames.push(name)
        }
    }


    // 指定图表的配置项和数据
    option = {
        title: {
            text: 'RSSI测距信号衰减模型',
            left: 'center',
            subtext: sbutitle
        }
        ,
        tooltip: {
            trigger: 'axis',
            axisLabel: {
                formatter: '{value}'
            }
        },
        toolbox: {

            feature: {
                saveAsImage: {},
                magicType: {type: ['line', 'bar']},
                restore:{},
                dataZoom:{},
                dataView:{}
            }
        },
        legend: {
            top: '13%',
            show: true,
            right:'right',
            data: legendnames
        },
        dataZoom: {
            type: 'inside'
        },
        grid: {
            left: '3%',
            right: '10%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: 'rssi强度/dBm',
            splitLine: {show: true},
            axisLine:{onZero: false},
            scale: true

        },
        yAxis: {
            type: 'value',
            name: '距离/m',
            position: 'left',
            nameLocation: 'end',
            axisLine:{onZero: false}
        },
        series:series

    };

    // 使用刚指定的配置项和数据显示图表。
    myChart.setOption(option);
}