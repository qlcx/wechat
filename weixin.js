'use strict'

var config = require('./config')
var Wechat = require('./wechat/wechat')

var wechatApi = new Wechat(config.wechat)

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
    }
  } else if(message.MsgType === 'text') {
    //接收普通消息

    var content = message.Content
    var reply = '你说的' + message.Content + '太复杂了'

    if(content === '1') {
      reply = '1111111'
      console.log(reply)
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
      var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg')

      reply = {
        type: 'image',
        mediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '6') {
      var data = yield wechatApi.uploadMaterial('video', __dirname + '/6.mp4')

      reply = {
        type: 'video',
        title: '回复视频内容',
        description: '打个篮球玩玩',
        mediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '7') {
      var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg')

      reply = {
        type: 'music',
        title: '回复音乐内容',
        description: '放松一下',
        musiceUrl: 'http://mp3.haoduoge.com/s/2016-10-11/1476191250.mp3',
        thumbMediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '8') {
      var data = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg', {type: 'image'})

      reply = {
        type: 'image',
        mediaId: data.media_id,
      }
      console.log(reply)
    } else if(content === '9') {
      var data = yield wechatApi.uploadMaterial('video', __dirname + '/6.mp4', {type: 'video', description: '{"title":"Really a nice place", "introduction": "adsfdsafsdaf"}'})

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
      var picData = yield wechatApi.uploadMaterial('image', __dirname + '/2.jpg', {type: 'image'})

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
      var data = yield wechatApi.fetchMaterial(data.media_id, 'news', {})

      //回复
      var items = data.news_item
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
    }

    this.body = reply
  }

  yield next
}