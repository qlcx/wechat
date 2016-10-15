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
      <title>猜电影</title>
      <meta nam="viewport" content="initial-scale=1", maximum-scale=1, minimum-scale=1">
    </head>
    <body>
      <h1>点击标题，开始录音翻译</h1>
      <p id="title"></p>
      <div id="poster"></div>

      <script src="http://zeptojs.com/zepto-docs.min.js"></script>
      <script src="http://res.wx.qq.com/open/js/jweixin-1.0.0.js"></script>
      <script>
        wx.config({
          debug: true, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
          appId: 'wxabe99c16609120e9', // 必填，公众号的唯一标识
          timestamp: '<%= timestamp %>', // 必填，生成签名的时间戳
          nonceStr: '<%= noncestr %>', // 必填，生成签名的随机串
          signature: '<%= signature %>',// 必填，签名，见附录1
          jsApiList: [
            'startRecord'
            'stopRecord'
            'onVoiceRecordEnd'
            'translateVoice'
          ] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
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
    var ticket = data.ticket
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