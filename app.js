'use strict'

var Koa = require('koa')
var wechat = require('./wechat/g')
var config = require('./config')
var reply = require('./wx/reply')

var app = new Koa()

app.use(wechat(config.wechat, reply.reply))

app.listen(3200)
console.log('Listening: 3200')