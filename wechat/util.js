'use strict'

var xml2js = require('xml2js')
var Promise = require('bluebird')
var tpl = require('./tpl')

exports.parseXMLAsync = function(xml) {
  return new Promise(function(resolve, reject) {
    xml2js.parseString(xml, {trim: true}, function(err, content) {
      if(err) reject(err)
      else resolve(content)
    })
  })
}

//遍历
function formatMessage(result) {
  var message = {}

  //判断result类型
  if( typeof result === 'object') {
    var keys = Object.keys(result)

    for(var i = 0; i < keys.length; i++) {
      var item = result[keys[i]]
      var key = keys[i]

      //判断item是否是数组
      if(!(item instanceof Array) || item.length === 0) {
        continue
      }

      if(item.length === 1) {
        var val = item[0]

        if(typeof val === 'object') {
          //进一步遍历
          message[key] = formatMessage(val)
        } else {
          message[key] = (val || '').trim()          
        }
      } else {
        //则item为array
        message[key] = []

        for(var j = 0, k = item.length; j < k; j++) {
          message[key].push(formatMessage(item[j]))
        }
      }
    }
  }

  return message
}

exports.formatMessage = formatMessage

exports.tpl = function(content, message) {
  var info = {}
  var type = 'text'
  var fromUserName = message.FromUserName
  var toUserName = message.ToUserName

  if(Array.isArray(content)) {
    //如果content是一个数组则type为图文消息
    type = 'news'
  }

  type = content.type || type
  info.content = content
  info.createTime = new Date().getTime()
  info.msgType = type
  info.toUserName = fromUserName
  info.fromUserName = toUserName

  return tpl.compiled(info)
}