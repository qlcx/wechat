//中间件
'use strict'

var sha1 = require('sha1')
var Wechat = require('./wechat')
var getRawBody = require('raw-body')
var util = require('./util')

module.exports = function(opts, handler) {
  var wechat = new Wechat(opts)

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

      //将解析后的数据挂载到this上
      this.weixin = message

      //call 用来改变函数运行时的上下文(函数内部this的指向)
      //暂停处理逻辑，控制权交给业务逻辑(消息类型判断以及回复信息处理)
      yield handler.call(this, next)

      //重新获得控制权，并回复消息
      wechat.reply.call(this)
    }
  }
}