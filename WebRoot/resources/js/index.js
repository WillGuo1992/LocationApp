/**
 * Created by nlsde on 2017-06-10.
 */
function pageTo(url) {
    if(!url) {
        return false;
    }
    var iframe = $('iframe[name=containter]'),
        loading = $(".loading");
    loading.show();
    iframe[0].onload = function() {
        window.sessionStorage.setItem("url", url);
        iframe[0].onload = null;
        loading.fadeOut();
    }
    iframe.attr('src', url);
}