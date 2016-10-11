'use strict'

var Promise = require('bluebird')
var _ = require('lodash')
//对node.js的request模块进行promise化
var request = Promise.promisify(require('request'))
var util = require('./util')
var fs = require('fs')

var prefix = 'https://api.weixin.qq.com/cgi-bin/'
var api = {
  accessToken: prefix + 'token?grant_type=client_credential',
  temporary: {
    //临时素材
    upload: prefix + 'media/upload?',
  },
  permanent: {
    //永久素材
    upload: prefix + 'material/add_material?',
    uploadNews: prefix + 'material/add_news?',
    uploadNewsPic: prefix + 'media/uploadimg?',
  }
}

//处理access_toke  有效期7200s
function Wechat(opts) {
  var that = this
  this.appID = opts.appID
  this.appSecret = opts.appSecret
  this.getAccessToken = opts.getAccessToken
  this.saveAccessToken = opts.saveAccessToken

  //fetch票据
  this.fetchAccessToken()
}

Wechat.prototype.fetchAccessToken = function(data) {
  var that = this
  if(this.access_token && this.expires_in) {
    if(this.isValidAccessToken(this)) {
      //如果this上已经有access_token/expires_in并且有效期没有过的话
      return Promise.resolve(this)
    }
  }

  //读取票据信息
  this.getAccessToken()
    .then(function(data) {
      try {
        data = JSON.parse(data)
      }
      catch(e) {
        //文件不存在则更新票据
        return that.updateAccessToken()
      }

      //判断票据合法性
      if(that.isValidAccessToken(data)) {
        return Promise.resolve(data)
        /*
        Promise.resolve('foo')
        // 等价于
        new Promise(resolve => resolve('foo'))
        */
      } else {
        //不合法则向服务端请求票据
        return that.updateAccessToken()
      }
    })
    .then(function(data) {
      that.access_token = data.access_token
      //expires_in: 凭证过期时间
      that.expires_in = data.expires_in

      //写入票据信息
      that.saveAccessToken(data)

      return Promise.resolve(data)
    })
}

//判断access_token合法性
Wechat.prototype.isValidAccessToken = function(data) {
  if (!data || !data.access_token || !data.expires_in) {
    return false
  }

  var access_token = data.access_token
  var expires_in = data.expires_in
  var now = (new Date().getTime())

  if (now < expires_in) {
    return true
  } else {
    return false
  }
}

//向服务端请求票据
Wechat.prototype.updateAccessToken = function(data) {
  var appID = this.appID
  var appSecret = this.appSecret
  var url = api.accessToken + '&appid=' + appID + '&secret=' + appSecret

  return new Promise(function(resolve, reject) {
    request(url).then(function(res) {
      var data = JSON.parse(res.body)
      var now = (new Date().getTime())
      //设置过期时间(将过期时间缩短20s)
      var expires_in = now + (data.expires_in - 20) * 1000

      data.expires_in = expires_in

      resolve(data)
    })
  })
}

//上传临时素材
Wechat.prototype.uploadMaterial = function(type, material, permanent) {
  var that = this
  var form ={}
  //默认为临时素材
  var uploadUrl = api.temporary.upload

  if(permanent) {
    //如果有permanent参数则设置为永久素材
    uploadUrl = api.permanent.upload

    //将permanent上的属性合并到form对象
    _.extend(form, permanent)
  }

  if(type === 'pic') {
    //类型为图像
    uploadUrl = api.permanent.uploadNewsPic
  }

  if(type === 'news') {
    //类型为图文
    uploadUrl = api.permanent.uploadNews

    form = material
  } else {
    form.media = fs.createReadStream(material)
  }

  
  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = uploadUrl + 'access_token=' + data.access_token
        if(!permanent) {
          url += '&type=' + type
        } else {
          form.access_token = data.access_token
        }

        var options = {
          method: 'POST',
          url: url,
        }
        if(type === 'news') {
          options.body = form
        } else {
          options.formData = form
        }

        request({method: 'POST', url: url, formData: form}).then(function(res) {
          var _data = JSON.parse(res.body)

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('Upload material failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//消息响应模块
Wechat.prototype.reply = function() {
  var content = this.body
  var message = this.weixin
  var xml = util.tpl(content, message)

  this.status = 200
  this.type = 'application/xml'
  this.body = xml
}

module.exports = Wechat;