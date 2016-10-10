'use strict'

var Koa = require('koa')
var path = require('path')
var util = require('./libs/util')
var wechat = require('./wechat/g')
var wechat_file = path.join(__dirname, './config/wechat.txt');
var config = {
  wechat: {
    appID: 'wxabe99c16609120e9',
    appSecret: '83f8ae5f08d53bb09b6c1f90ccf542c5',
    token: 'weixin',
    getAccessToken: function() {
      return util.readFileAsync(wechat_file)
    },
    saveAccessToken:  function(data) {
      data = JSON.stringify(data)
      return util.writeFileAsync(wechat_file, data)
    },
  }
}

var app = new Koa()

app.use(wechat(config.wechat))

app.listen(3200)
console.log('Listening: 3200')