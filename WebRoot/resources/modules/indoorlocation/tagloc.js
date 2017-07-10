/**
 * Created by nlsde on 2017-06-11.
 */
$(document).ready(function () {
    var intervaltime = 5000;//定位时间间隔5000ms,5s
    var index = null;
    $("#start_loc").click(function () {
        if(index!=null){
            console.error("已经创建interval，阻止重复创建");
            return;
        }
        index = setInterval(indoorlocation,intervaltime);
        //index = setInterval(paintpoint,intervaltime);
        console.log("start interval: No. "+ index);

    });
    $("#start_file_loc").click(function () {
        if(index!=null){
            console.error("已经创建interval，阻止重复创建");
            return;
        }
        index = setInterval(indoorlocation_file,intervaltime);
        //index = setInterval(paintpoint,intervaltime);
        console.log("start interval: No. "+ index);

    });

    //结束定位
    $("#stop_loc").click(function () {
        var $loc_msg = $("#loc_msg");
        $loc_msg.text("定位相关调试信息");
        var $pin_pic = $("#pin_pic");
        $pin_pic.hide();

        if (index==null)
            return;

        console.log("stop interval: No. "+ index);
        clearInterval(index);
        index = null;
    });
})

function indoorlocation() {
    // var url="indoorlocation/getLocByMac";
    var url="/LocationApp/wifi/WifiIndoorTriangleAction_get.do";
    var device_mac = $("#device_mac").serialize();
    console.log(device_mac);
    $.post(url,device_mac,function(data){paintpoint(data)},"json");

}

function indoorlocation_file() {
    // var url="indoorlocation/getLocByMac";
    var url="/LocationApp/wifi/WifiIndoorTriangleAction_getfromfile.do";
    var device_mac = $("#device_mac").serialize();
    console.log(device_mac);
    $.post(url,device_mac,function(data){paintpoint(data)},"json");

}
function paintpoint(data) {
    //回调函数执行将定位点绘制在界面上
    //此函数调用则一定取得返回值
    /**
     * device_mac:设备mac地址
     * x,y坐标
     * poistiontype:定位类型
     *      1.三角定位
     *      2.
     * xytype:坐标类型
     *      1.绝对坐标，即大地坐标
     *      2.相对坐标
     * //@type {{mac: string, x: string, y: string, : string}}
     */

    var postion = data;   // eg. {apName: "G1149", locationId: 0, locationMethod: 1, x: 38, y: 16, z: 0}
    // postion = {apName: "G1149", locationId: 0, locationMethod: 1, x: 38, y: 16, z: 0};
    if (postion == null)
        return;
    console.log(postion);
    var $g11_pic = $("#g11_pic");
    var $pin_pic = $("#pin_pic");
    var $loc_msg = $("#loc_msg");
    $loc_msg.text(JSON.stringify(postion));
    var height = $g11_pic.height();
    var witdth = $g11_pic.width();
    var real_x = postion.x;
    var real_y = postion.y;
    var x_px = real_x*witdth/80;
    var y_px = real_y*height/30;
    var radom_x = Math.random()*height;
    var radom_y = Math.random()*witdth;
    //console.log(height+","+witdth);

    var x = $g11_pic.position().left + parseFloat(x_px) ;
    var y = $g11_pic.position().top+height - parseFloat(y_px) ;

    //test
    // var x = x_px + $g11_pic.position().top;
    // var y = y_px + + $g11_pic.position().left;
    //alert($g11_pic.position().top);
    //alert(x+","+y+","+$g11_pic.position().top+","+$g11_pic.position().left);

    $pin_pic.show();
    $pin_pic.offset({ "left": x, "top": y });

}