//中间件
'use strict'

var sha1 = require('sha1')
var Wechat = require('./wechat')
var getRawBody = require('raw-body')
var util = require('./util')

module.exports = function(opts) {
  //var wechat = new Wechat(opts)

  return function *(next) {
    var that = this

    var token = opts.token
    var signature = this.query.signature
    var nonce = this.query.nonce
    var timestamp = this.query.timestamp
    var echostr = this.query.echostr
    var str = [token, timestamp, nonce].sort().join('')
    var sha = sha1(str)

    //判断请求方法 GET/POST  --KOA API
    if(this.method === 'GET') {
      //用户验证
      if(sha === signature) {
        this.body = echostr + ''
      } else {
        this.body = 'wrong'
      }
    } else if(this.method === 'POST') {
      //用户操作
      if(sha !== signature) {
        this.body = 'wrong'
        return false
      }

      //解析request body 数据
      var data = yield getRawBody(this.req, {
        length: this.length,
        limit: '1mb',
        encoding: this.charset
      })

      //xml to json
      var content = yield util.parseXMLAsync(data)

      //格式化json数据
      var message = util.formatMessage(content.xml)

      //判断消息类型是否是一个事件
      if(message.MsgType === 'event') {
        //判断是否是订阅事件
        if(message.Event === 'subscribe') {
          var now = new Date().getTime()

          //回复消息格式
          that.status = 200
          that.type = 'application/xml'
          that.body = '<xml>'
            + '<ToUserName><![CDATA['+message.FromUserName+']]></ToUserName>'
            + '<FromUserName><![CDATA['+message.ToUserName+']]></FromUserName>'
            + '<CreateTime>'+now+'</CreateTime>'
            + '<MsgType><![CDATA[text]]></MsgType>'
            + '<Content><![CDATA[你好]]></Content>'
            + '</xml>'

          return
        }
      }
    }
  }
}