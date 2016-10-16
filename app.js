'use strict'

var Koa = require('koa')
var wechat = require('./wechat/g')
var config = require('./config')
var reply = require('./wx/reply')
var Wechat = require('./wechat/wechat')

var app = new Koa()

//js-sdk
var ejs = require('ejs')
var crypto = require('crypto')
var heredoc = require('heredoc')

var tpl = heredoc(function() {/*
  <!DOCTYPE>
  <html>
    <head>
      <title>搜电影</title>
      <meta nam="viewport" content="initial-scale=1", maximum-scale=1, minimum-scale=1">
    </head>
    <body>
      <h1>点击标题，开始录音翻译</h1>
      <p id="title"></p>
      <p id="director"></p>
      <p id="year"></p>
      <p id="poster"></p>
      <div id="poster"></div>

      <script src="http://zeptojs.com/zepto-docs.min.js"></script>
      <script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
      <script>
        wx.config({
          debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
          appId: 'wxabe99c16609120e9', // 必填，公众号的唯一标识
          timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
          nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
          signature: '<%= signature %>',// 必填，签名，见附录1
          jsApiList: [
            'onMenuShareTimeline',
            'onMenuShareAppMessage',
            'onMenuShareQQ',
            'onMenuShareWeibo',
            'onMenuShareQZone',
            'previewImage',
            'startRecord',
            'stopRecord',
            'onVoiceRecordEnd',
            'translateVoice',
          ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
        });

        //通过ready接口处理成功验证
        wx.ready(function(){
          //判断当前客户端版本是否支持指定JS接口
          wx.checkJsApi({
            jsApiList: ['onVoiceRecordEnd'], // 检查音频结束的接口
            success: function(res) {
              console.log(res)
              // 以键值对的形式返回，可用的api值true，不可用为false
              // 如：{"checkResult":{"chooseImage":true},"errMsg":"checkJsApi:ok"}
            }
          });

          //分享给朋友
          var shareContent = {
            title: '默认标题', // 分享标题
            desc: '默认分享', // 分享描述
            link: 'https://github.com', // 分享链接
            imgUrl: 'https://ss0.bdstatic.com/5aV1bjqh_Q23odCf/static/superman/img/logo/logo_white.png', // 分享图标
            success: function () { 
              // 用户确认分享后执行的回调函数
              window.alert('分享成功')
            },
            cancel: function () { 
              // 用户取消分享后执行的回调函数
              window.alert('分享失败')                
            }
          }
          wx.onMenuShareAppMessage(shareContent);
          
          //图片预览
          var slides
          $('#poster').on('tap', function() {
            wx.previewImage(slides);
          })

          //找到标题标签  tap事件  =>   移动端触摸事件
          var isRecording = false;
          $('h1').on('tap', function() {
            if(!isRecording) {
              isRecording = true;
              //开始录音
              wx.startRecord({
                //用户取消事件
                cancel: function() {
                  window.alert('那就不搜了哦');
                }
              })

              return
            }

            //停止录音
            isRecording = false;
            wx.stopRecord({
              success: function (res) {
                var localId = res.localId;

                //识别音频并返回识别结果接口
                wx.translateVoice({
                  localId: localId, // 需要识别的音频的本地Id，由录音相关接口获得
                    isShowProgressTips: 1, // 默认为1，显示进度提示
                    success: function (res) {
                      var s = res.translateResult //语音识别的结果
                      var result = s.substring(0, s.length - 1);   //文字处理

                      //get请求
                      //jsonp 设置浏览器跨域处理
                      $.ajax({
                        type: 'get',
                        url: 'https://api.douban.com/v2/movie/search?q=' + result,
                        dataType: 'jsonp',
                        jsonp: 'callback',
                        success: function(data) {
                          var subject = data.subjects[0]

                          $('#title').html(subject.title)                          
                          $('#year').html(subject.year)                          
                          $('#director').html(subject.directors[0].name)
                          $('#poster').html('<img src="' + subject.images.large + '" />')

                          //图片预览
                          slides = {
                            current: subject.images.large,
                            urls: [subject.images.large],
                          }

                          data.subjects.forEach(function(item) {
                            slides.urls.push(item.images.large)
                          })

                          //分享给朋友
                          shareContent = {
                            title: subject.title, // 分享标题
                            desc: '电影分享：' + subject.title, // 分享描述
                            link: 'https://github.com', // 分享链接
                            imgUrl: subject.images.large, // 分享图标
                            type: 'link', // 分享类型,music、video或link，不填默认为link
                            dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                            success: function () { 
                              // 用户确认分享后执行的回调函数
                              window.alert('分享成功')
                            },
                            cancel: function () { 
                              // 用户取消分享后执行的回调函数
                              window.alert('分享失败')                
                            }
                          }
                          wx.onMenuShareAppMessage(shareContent);

                        }
                      })
                    }
                });
              }
            });
          })
        });
      </script>
    </body>
  </html>
*/})

//生成随机字符串&时间戳
var createNonce = function() {
  return Math.random().toString(36).substr(2, 15)
}
var createTimestamp = function() {
  return parseInt(new Date().getTime() / 1000, 10) + ''
}

var _sign = function(noncestr, ticket, timestamp, url) {
  var params = [
    'noncestr=' + noncestr,
    'jsapi_ticket=' + ticket,
    'timestamp=' + timestamp,
    'url=' + url
  ]
  var str = params.sort().join('&')
  //哈希加密
  var shasum = crypto.createHash('sha1')

  shasum.update(str)

  return shasum.digest('hex')
}

//实现签名算法
function sign(ticket, url) {
  var noncestr = createNonce()
  var timestamp = createTimestamp()
  var signature = _sign(noncestr, ticket, timestamp, url)

  return {
    noncestr: noncestr,
    timestamp: timestamp,
    signature: signature,
  }

}

app.use(function *(next) {
  //如果url中包含用'/moive'字符串
  if(this.url.indexOf('/moive') > -1) {
    var wechatApi = new Wechat(config.wechat)
    var data = yield wechatApi.fetchAccessToken()
    var access_token = data.access_token
    var ticketData = yield wechatApi.fetchTicket(access_token)
    var ticket = ticketData.ticket
    var url = this.href
    var params = sign(ticket,url)
  
    console.log(params)
    this.body = ejs.render(tpl, params)

    return next
  }

  yield next
})

//引用微信中间件
app.use(wechat(config.wechat, reply.reply))

app.listen(3200)
console.log('Listening: 3200')