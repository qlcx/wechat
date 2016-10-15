var path = require('path')
var util = require('./libs/util')
var wechat_file = path.join(__dirname, './config/wechat.txt');
var wechat_ticket_file = path.join(__dirname, './config/wechat_ticket.txt')

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
    getTicket: function() {
      return util.readFileAsync(wechat_ticket_file)
    },
    saveTicket:  function(data) {
      data = JSON.stringify(data)
      return util.writeFileAsync(wechat_ticket_file, data)
    },
  }
}

module.exports = config;