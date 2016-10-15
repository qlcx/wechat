'use strict'

var path = require('path')
var config = require('../config')
var Wechat = require('../wechat/wechat')
var menu = require('./menu')

var wechatApi = new Wechat(config.wechat)

// //删除菜单
// wechatApi.deleteMenu().then(function() {
//   //创建菜单
//   return wechatApi.createMenu(menu)
// }).then(function(msg) {
//   console.log(msg)
// })

exports.reply = function* (next) {
  var message = this.weixin

  if(message.MsgType == 'event') {
    //接收事件消息
    
    if(message.Event === 'subscribe') {
      //接收订阅消息
      if(message.EventKey) {
        //通过扫描二维码订阅处理
        console.log('扫二维码进来：' + message.EventKey + ' ' + message.Ticket)
      }
      //通过搜索名称订阅
      this.body = '订阅成功'
    } else if(message.Event === 'unsubscribe') {
      //取消订阅
      console.log('取消订阅')
      this.body = ''
    } else if(message.Event === 'LOCATION') {
      //上报地理位置
      this.body = '您上报的位置是: ' + message.Latitude + '/' + message.Longitude + '-' + message.Precision
    } else if(message.Event === 'CLICK') {
      this.body = '您点击了菜单' + message.EventKey
    } else if(message.Event === 'SCAN') {
      //用户已关注时的事件推送
      console.log('关注后扫二维码： ' + message.EventKey + ' ' + message.Ticket)

      this.body = '看到你扫了一下哦'
    } else if(message.Event === 'VIEW') {
      //点击菜单跳转链接时的事件推送
      this.body = '您点击了菜单中的链接： ' + message.EventKey
    } else if(message.Event === 'scancode_push') {
      console.log(message.ScanCodeInfo.ScanResult)
      console.log(message.ScanCodeInfo.ScanType)
      //扫码推送事件
      this.body = '您点击了扫码推送事件： ' + message.EventKey
    } else if(message.Event === 'scancode_waitmsg') {
      console.log(message.ScanCodeInfo.ScanResult)
      console.log(message.ScanCodeInfo.ScanType)
      //扫码推送中
      this.body = '您点击了扫码推送中： ' + message.EventKey
    } else if(message.Event === 'pic_sysphoto') {
      console.log(message.SendPicsInfo.PicList)
      console.log(message.SendPicsInfo.Count)
      //弹出系统拍照
      this.body = '您点击了弹出系统拍照： ' + message.EventKey
    } else if(message.Event === 'pic_photo_or_album') {
      console.log(message.SendPicsInfo.PicList)
      console.log(message.SendPicsInfo.Count)
      //弹出拍照或相册
      this.body = '您点击了弹出拍照或相册： ' + message.EventKey
    } else if(message.Event === 'pic_weixin') {
      console.log(message.SendPicsInfo.PicList)
      console.log(message.SendPicsInfo.Count)
      //微信相册发图
      this.body = '您点击了微信相册发图： ' + message.EventKey
    } else if(message.Event === 'location_select') {
      console.log(message.SendLocationInfo.Location_X)
      console.log(message.SendLocationInfo.Location_Y)
      console.log(message.SendLocationInfo.Scale)
      console.log(message.SendLocationInfo.Label)
      console.log(message.SendLocationInfo.Poiname)
      //地理位置选择
      this.body = '您点击了地理位置选择： ' + message.EventKey
    }
  } else if(message.MsgType === 'text') {
    //接收普通消息

    var content = message.Content
    var reply = '你说的' + message.Content + '太复杂了'

    if(content === '1') {
      reply = '1111111'
      console.log(reply)
      console.log('message.FromUserName: ' + message.FromUserName)
    } else if(content === '2') {
      reply = '222222222'
      console.log(reply)
    } else if(content === '3') {
      reply = '33333333'
      console.log(reply)
    } else if(content === '4') {
      reply = [{
        title: '技术改变世界',
        description: '描述1',
        picUrl: 'https://github.com/qlcx/img/blob/master/qlcx-blog%E2%80%98s%20img/axure%E5%AD%A6%E4%B9%A0/1.1.png',
        url: 'http://github.com'
      }, {
        title: '22222',
        description: '描述2',
        picUrl: 'https://github.com/qlcx/img/blob/master/qlcx-blog%E2%80%98s%20img/axure%E5%AD%A6%E4%B9%A0/1.2.png',
        url: 'http://nodejs.org'
      }]
      console.log(reply)
    } else if(content === '5') {
      var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'))

      reply = {
        type: 'image',
        mediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '6') {
      var data = yield wechatApi.uploadMaterial('video', path.join(__dirname, '../6.mp4'))

      reply = {
        type: 'video',
        title: '回复视频内容',
        description: '打个篮球玩玩',
        mediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '7') {
      var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'))

      reply = {
        type: 'music',
        title: '回复音乐内容',
        description: '放松一下',
        musiceUrl: 'http://mp3.haoduoge.com/s/2016-10-11/1476191250.mp3',
        thumbMediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '8') {
      var data = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'), {type: 'image'})

      reply = {
        type: 'image',
        mediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '9') {
      var data = yield wechatApi.uploadMaterial('video', path.join(__dirname, '../6.mp4'), {type: 'video', description: '{"title":"Really a nice place", "introduction": "adsfdsafsdaf"}'})

      console.log(data)
      reply = {
        type: 'video',
        title: '回复视频内容',
        description: '打个篮球玩玩',
        mediaId: data.media_id,
      }
      console.log(reply)
    }  else if(content === '10') {
      //上传图片对象
      var picData = yield wechatApi.uploadMaterial('image', path.join(__dirname, '../2.jpg'), {type: 'image'})

      var media = {
        articles: [{
          title: 'tututu',
          thumb_media_id: picData.media_id,
          author: 'Scott',
          digest: '没有摘要',
          show_cover_pic: 1,
          content: '没有内容',
          content_source_url: 'https://github.com',
        },]
      }

      //上传图文素材
      var data = yield wechatApi.uploadMaterial('news', media, {})

      //获取图文永久素材
      var data1 = yield wechatApi.fetchMaterial(data.media_id, 'news', {})

      //回复
      var items = data1.news_item
      var news = []

      items.forEach(function(item) {
        news.push({
          title: item.title,
          decription: item.digest,
          picUrl: picData.url,
          url: item.url
        })
      })

      reply = news
    } else if(content === '11') {
      //获取素材总数
      var counts = yield wechatApi.countMaterial()

      console.log(JSON.stringify(counts))

      //获取素材列表 图片&视频&语音&图文 (并行任务)
      var results = yield [
        wechatApi.batchMaterial({
          type: 'image',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'video',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'voice',
          offset: 0,
          count: 10
        }),
        wechatApi.batchMaterial({
          type: 'news',
          offset: 0,
          count: 10
        }),
      ]

      console.log(JSON.stringify(results))

      reply = '11'
    } else if(content === '12') {
      //创建分组wechat
      var group = yield wechatApi.createGroup('wechat3')
      console.log('新分组 wechat')
      console.log(group)

      //获得分组列表
      var groups = yield wechatApi.fetchGroups()
      console.log('加了 wechat 后的分组列表')
      console.log(groups)

      //查看自己的分组
      var group2 = yield wechatApi.checkGroup(message.FromUserName)
      console.log('查看自己的分组')
      console.log(group2)

      //移动分组(移动到id=101的分组)
      var result = yield wechatApi.moveGroup(message.FromUserName, 101)
      console.log('移动到id=101的分组')
      console.log(result)

      //移动后的分组列表
      var groups2 = yield wechatApi.fetchGroups()
      console.log('移动后的分组列表')
      console.log(groups2)

      //批量移动分组(批量移动到100分组)
      var result2 = yield wechatApi.moveGroup([message.FromUserName], 100)
      console.log('批量移动到100分组')
      console.log(result2)

      //移动后的分组列表
      var groups3 = yield wechatApi.fetchGroups()
      console.log('批量移动后的分组列表')
      console.log(groups3)

      //修改分组名
      var result3 = yield wechatApi.updateGroup(101, 'wechat101')
      console.log('101 wechat2 改名 wechat101')
      console.log(result3)

      //改名后的分组列表
      var groups4 = yield wechatApi.fetchGroups()
      console.log('改名后的分组列表')
      console.log(groups4)

      //删除分组
      var result4 = yield wechatApi.deleteGroup(100)
      console.log('删除100  wechat分组')
      console.log(result4)


      //删除100后的分组列表
      var groups5 = yield wechatApi.fetchGroups()
      console.log('删除100后的分组列表')
      console.log(groups5)


      reply = 'Group done'
    } else if(content === '13') {
      //获取用户数据
      var user = yield wechatApi.fetchUsers(message.FromUserName, 'en')
      console.log(user)

      //批量获取用户数据
      var openIds = [
        {
          openid: message.FromUserName,
          lang: 'en'
        }
      ]
      var users = yield wechatApi.fetchUsers(openIds)
      console.log(users)

      reply = JSON.stringify(user)
    } else if(content === '14') {
      //获取用户列表
      var userlist = yield wechatApi.listUsers()
      console.log(userlist)

      reply = userlist.total
    } else if(content === '15') {
      //图文消息
      var mpnews = {
        //直接那永久素材中已存在的media_id
        media_id: 'kf5qul5vyqcWJK31VUM0lxvhv7h9QIikSkIkq5ZxatQ'
      }
      //文字消息
      var text = {
        'content': 'hello wechat'
      }

      var msgData = yield wechatApi.sendByGroup('mpnews', mpnews, null)
      console.log(msgData)

      reply = '分组群发成功'
    } else if(content ==='16') {
      //预览接口
      //文字消息
      var text = {
        'content': 'hello wechat'
      }

      //FromUserName
      var msgData = yield wechatApi.previewMass('text', text, 'oVbCtwAWz9QA50D6xDYi9X3FCbgY')
      console.log(msgData)

      reply = '预览消息成功'
    } else if(content ==='17') {
      //查询群发消息发送状态
      var msgData = yield wechatApi.checkMass('msgId')
      console.log(msgData)

      reply = '查询群发消息发送状态成功'
    }

    this.body = reply
  } else if(message.MsgType === 'image') {
    //回复图片消息
    var reply = 'empth news'
    console.log(message.PicUrl)
    this.body = reply
  }

  yield next
}