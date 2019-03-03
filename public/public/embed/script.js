function showchat(livechat) {
    $(".livechat").css("visibility","visible");
    $("#livechat").css("display","block");
    $(".chat_start").css("z-index","0");
    $(".chat-control-btn").css("display", "block");
}
$(document).ready(function() {
   $(".close-btn").click(function() {
       $(".livechat").css("visibility","collapse");
       $(".chat-control-btn").css("display", "none");
       $("#livechat").css("display","none");
       $(".chat_start").css("z-index","1");
   });
});