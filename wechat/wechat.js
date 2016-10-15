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
    upload: prefix + 'media/upload?', //上传
    fetch: prefix + 'media/get?', //下载
  },
  permanent: {
    //永久素材
    upload: prefix + 'material/add_material?',
    fetch: prefix + 'material/get_material?', //获取永久素材
    uploadNews: prefix + 'material/add_news?',
    uploadNewsPic: prefix + 'media/uploadimg?',
    del: prefix + 'material/del_material?', //删除永久素材
    update: prefix + 'material/update_news?', //更新永久素材
    count: prefix + 'material/get_materialcount?', //获取素材总数
    batch: prefix + 'material/batchget_material?', //获取素材列表
  },
  group: {
    //用户分组
    create: prefix + 'groups/create?', //创建分组
    fetch: prefix + 'groups/get?', //查询所有分组
    check: prefix + 'groups/getid?', //查询用户所在分组
    update: prefix + 'groups/update?', //修改分组
    move: prefix + 'groups/members/update?', //移动用户分组
    batchupdate: prefix + 'groups/members/batchupdate?', //批量移动用户分组
    del: prefix + 'groups/delete?', //删除分组
  },
  user: {
    remark: prefix + 'user/info/updateremark?', //设置用户备注名
    fetch: prefix + 'user/info?', //获取用户基本信息
    batchFetch: prefix + 'user/info/batchget?', //批量获取用户基本信息
    list: prefix + 'user/get?', //获取用户列表
  },
  mass: {
    //群发消息
    group: prefix + 'message/mass/sendall?', //分组群发
    openId: prefix + 'message/mass/send?',  //根据openId列表群发
    del: prefix + 'message/mass/delete?', // 删除群发
    preview: prefix + 'message/mass/preview?', //预览接口
    check: prefix + 'message/mass/get?',  //查询群发消息发送状态
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

//上传素材
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
          json: true,
        }
        if(type === 'news') {
          options.body = form
        } else {
          options.formData = form
        }

        request(options).then(function(res) {
          var _data = res.body

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

//获取素材
Wechat.prototype.fetchMaterial = function(mediaId, type, permanent) {
  var that = this
  var form ={}
  //默认为临时素材
  var fetchUrl = api.temporary.fetch

  if(permanent) {
    //如果有permanent参数则设置为永久素材
    fetchUrl = api.permanent.fetch
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = fetchUrl + 'access_token=' + data.access_token + '&media_id=' + mediaId

        var form = {}
        var options = {method: 'POST', url: url, json: true}
        if(permanent) {
          form.media_id = mediaId
          form.access_token = data.access_token
          options.body = form
        } else {
          if(type === 'video') {
            //不是永久素材且type为视频则需要换协议
            url = url.replace('https://', 'http://')
          }
          url += '&media_id=' + mediaId
        }

        if(type === 'news' || type === 'video') {
          request(options).then(function(res) {
            var _data = res.body
            
            if(_data) {
              resolve(_data)
            } else {
              throw new Error('fetch material failed')
            }
          })
          .catch(function(err) {
            reject(err)
          })
        } else {
          resolve(url)
        }
      })
  })
}

//删除永久素材
Wechat.prototype.deleteMaterial = function(mediaId) {
  var that = this
  var form ={
    media_id: mediaId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.permanent.del + 'access_token=' + data.access_token + '&media_id=' + mediaId

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('Delete material failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//更新永久素材
Wechat.prototype.updateMaterial = function(mediaId, news) {
  var that = this
  var form ={
    media_id: mediaId
  }

  _.extend(form, news)

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.permanent.update + 'access_token=' + data.access_token + '&media_id=' + mediaId

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('Update material failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//获取素材总数
Wechat.prototype.countMaterial = function() {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.permanent.count + 'access_token=' + data.access_token

        request({method: 'GET', url: url, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('Count material failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//获取素材列表
Wechat.prototype.batchMaterial = function(options) {
  var that = this

  //如果没有type则默认获取image素材
  //类型、偏移量、查询素材个数
  options.type = options.type || 'image'
  options.offset = options.offset || 0
  options.count = options.count || 1

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.permanent.batch + 'access_token=' + data.access_token

        request({method: 'POST', url: url, body: options, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('Batch material failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//创建用户分组
Wechat.prototype.createGroup = function(name) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.group.create + 'access_token=' + data.access_token

        var form = {
          group: {
            name: name
          }
        }

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('create group failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//获取用户分组
Wechat.prototype.fetchGroups = function() {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.group.fetch + 'access_token=' + data.access_token

        request({url: url, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('fetch group failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//查询用户所在分组
Wechat.prototype.checkGroup = function(openId) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.group.check + 'access_token=' + data.access_token

        var form = {
          openid: openId
        }

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('check group failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//修改分组
Wechat.prototype.updateGroup = function(id, name) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.group.update + 'access_token=' + data.access_token

        var form = {
          group: {
            id: id,
            name: name,
          }
        }

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('update group failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//移动&批量移动用户分组
Wechat.prototype.moveGroup = function(openIds, to) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = null
        var form = {
          to_groupid: to,
        }

        //判断openIds是否是数组
        if(_.isArray(openIds)) {
          //批量移动
          url = api.group.batchupdate + 'access_token=' + data.access_token
          form.openid_list = openIds;
        } else {
          //单个移动
          url = api.group.move + 'access_token=' + data.access_token
          form.openid = openIds;
        }

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('move group failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//删除分组
Wechat.prototype.deleteGroup = function(id) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.group.del + 'access_token=' + data.access_token

        var form = {
          group: {
            id: id,
          }
        }

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('delete group failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//设置用户备注名
Wechat.prototype.remarkUser = function(openId, remark) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.remark + 'access_token=' + data.access_token

        var form = {
          openid: openId,
          remark: remark,
        }

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('remark user failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//批量获取用户基本信息&获取用户基本信息
Wechat.prototype.fetchUsers = function(openIds, lang) {
  var that = this

  lang = lang || 'zh-CN'

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var options = {
          json: true,
        }

        if(_.isArray(openIds)) {
          options.url = api.user.batchFetch + 'access_token=' + data.access_token
          options.body = {
            user_list: openIds,
          }
          options.method = 'POST'
        } else {
          options.url = api.user.fetch + 'access_token=' + data.access_token + '&openid=' + openIds + '&lang=' + lang
        }

        request(options).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('batch fetch user failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//获取用户列表
Wechat.prototype.listUsers = function(openId) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.user.list + 'access_token=' + data.access_token

        if(openId) {
          url += '&next_openid=' + openId
        }

        request({method: 'GET', url: url, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('list user failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//分组群发
Wechat.prototype.sendByGroup = function(type, message, groupId) {
  var that = this

  var msg = {
    filter: {},
    msgtype: type,
  }

  msg[type] = message

  if(!groupId) {
    //判断是否群发给所有人
    msg.filter.is_to_all = true
  } else {
    //按分组群发
    msg.filter = {
      is_to_all: false,
      group_id: groupId,
    }
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.mass.group + 'access_token=' + data.access_token
        request({method: 'POST', url: url, body: msg, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('sendByGroup failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//根据openId列表群发
Wechat.prototype.sendByOpenId = function(type, message, openIds) {
  var that = this

  var msg = {
    msgtype: type,
    touser: openIds
  }

  msg[type] = message

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.mass.openId + 'access_token=' + data.access_token
        request({method: 'POST', url: url, body: msg, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('send by openId failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//删除群发
Wechat.prototype.deleteMass = function(msgId) {
  var that = this

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.mass.del + 'access_token=' + data.access_token

        var form = {
          msg_id: msgId
        }
        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('delete message failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//预览接口
Wechat.prototype.previewMass = function(type, message, openIds) {
  var that = this

  var msg = {
    msgtype: type,
    touser: openIds
  }

  msg[type] = message

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.mass.preview + 'access_token=' + data.access_token

        request({method: 'POST', url: url, body: msg, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('preview message failed')
          }
        })
        .catch(function(err) {
          reject(err)
        })
      })
  })
}

//查询群发消息发送状态
Wechat.prototype.checkMass = function(msgId) {
  var that = this

  var form = {
    msg_id: msgId
  }

  return new Promise(function(resolve, reject) {
    that
      .fetchAccessToken()
      .then(function(data) {
        var url = api.mass.check + 'access_token=' + data.access_token

        request({method: 'POST', url: url, body: form, json: true}).then(function(res) {
          var _data = res.body

          if(_data) {
            resolve(_data)
          } else {
            throw new Error('check message failed')
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