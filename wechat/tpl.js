'use strict'

var ejs = require('ejs')
//创建多行字符串避免"" +
var heredoc = require('heredoc')

var tpl = heredoc(function() {/*
  <xml>
  <ToUserName><![CDATA[<% toUsername %>]]></ToUserName>
  <FromUserName><![CDATA[<% fromUsername %>]]></FromUserName>
  <CreateTime><% createTime %></CreateTime>
  <MsgType><![CDATA[<% msgType %>]]></MsgType>
  <% if(msgType === 'text') { %>
    <Content><![CDATA[<%- content %>]]></Content>
  <% } else if(msgType === 'image') { %>
    <Image>
      <MediaId><![CDATA[<% content.media_id %>]]></MediaId>
    </Image>
  <% } else if(msgType === 'voice') { %>
    <Voice>
      <MediaId><![CDATA[<% content.media_id %>]]></MediaId>
    </Voice>
  <% } else if(msgType === 'video') { %>
    <Video>
      <MediaId><![CDATA[<% content.media_id %>]]></MediaId>
      <Title><![CDATA[<% content.title %>]]></Title>
      <Description><![CDATA[<% content.description %>]]></Description>
    </Video>
  <% } else if(msgType === 'music') { %>
    <Music>
      <Title><![CDATA[<% content.title %>]]></Title>
      <Description><![CDATA[<% content.description %>]]></Description>
      <MusicUrl><![CDATA[<% content.musicUrl %>]]></MusicUrl>
      <HQMusicUrl><![CDATA[<% content.hqMusicUrl %>]]></HQMusicUrl>
      <ThumbMediaId><![CDATA[<% content.thumbMediaId %>]]></ThumbMediaId>
    </Music>
  <% } else if(msgType === 'news') { %>
    <ArticleCount><% content.length %></ArticleCount>
    <Articles>
    <% content.forEach(function(item) { %>
      <item>
        <Title><![CDATA[<% item.title %>]]></Title> 
        <Description><![CDATA[<% item.description %>]]></Description>
        <PicUrl><![CDATA[<% item.picUrl %>]]></PicUrl>
        <Url><![CDATA[<% item.url %>]]></Url>
      </item>
    <% }) %>
    </Articles>
  <% } %>
  </xml>  
*/})

//编译ejs模板
var compiled = ejs.compile(tpl)

exports = module.exports = {
  compiled: compiled
}