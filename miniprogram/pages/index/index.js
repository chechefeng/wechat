//index.js
const app = getApp()
var MusicService = require('../../services/music');
var SearchService = require('../../services/search');
Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    slider: [],
    indicatorDots: true,
    autoplay: true,
    interval: 5000,
    duration: 1000,
    radioList: [],
    songList: [],
    mainView: 1,
    topList: [],
    hotkeys: [],
    showSpecial: false,
    special: {key: '', url: ''},
    searchKey: '',
    searchSongs: [],
    zhida: {},
    showSearchPanel: 1,
    historySearchs: [],
    isShowCancel: false,
    isShowOk: false

  },
  onReady (e) {
    // 使用 wx.createAudioContext 获取 audio 上下文 context
    this.audioCtx = wx.createAudioContext('myAudio')
    this.audioCtx.setSrc('http://ws.stream.qqmusic.qq.com/M500001VfvsJ21xFqb.mp3?guid=ffffffff82def4af4b12b3cd9337d5e7&uin=346897220&vkey=6292F51E1E384E06DCBDC9AB7C49FD713D632D313AC4858BACB8DDD29067D3C601481D36E62053BF8DFEAF74C0A5CCFADD6471160CAF3E6A&fromtag=46')
    this.audioCtx.play()

  },




onLoad: function () {
  var that = this;
  MusicService.getIndexMusic(that.initPageData);
  MusicService.getTopMusicList(that.initTopList);
  SearchService.getHotSearchKeys(that.initSearchHotKeys);
  if (!wx.cloud) {
    wx.redirectTo({
      url: '../chooseLib/chooseLib',
    })
    return
  }


  // 获取用户信息
  wx.getSetting({
    success: res => {
      if (res.authSetting['scope.userInfo']) {
        // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
        wx.getUserInfo({
          success: res => {
            this.setData({
              avatarUrl: res.userInfo.avatarUrl,
              userInfo: res.userInfo
            })
          }
        })
      }
    }
  })
}
,
initPageData: function (data) {

  console.log(data)
  var self = this;
  if (data.code == 0) {
    self.setData({
      slider: data.data.slider,
      radioList: data.data.radioList,
      songList: data.data.songList
    })
  }
}
,
initTopList: function (data) {
  var self = this;
  if (data.code == 0) {
    self.setData({
      topList: data.data.topList
    })
  }
}
,
initSearchHotKeys: function (data) {
  var self = this;
  if (data.code == 0) {
    var special = {key: data.data.special_key, url: data.data.special_url};
    var hotkeys = [];
    if (data.data.hotkey && data.data.hotkey.length) {
      for (var i = 0; (i < data.data.hotkey.length && i < 6); i++) {
        var item = data.data.hotkey[i];
        hotkeys.push(item);
      }
    }

    if (special != undefined) {
      self.setData({
        showSpecial: true
      })
    } else {

    }
    self.setData({
      special: special,
      hotkeys: hotkeys
    })
  }
}
,
tabItemTap: function (e) {
  var _dataSet = e.currentTarget.dataset;
  this.setData({
    mainView: _dataSet.view
  });
}
,
radioTap: function (e) {
  var dataSet = e.currentTarget.dataset;
  MusicService.getRadioMusicList(dataSet.id, function (data) {

    if (data.code == 0) {
      var list = [];
      var dataList = data.data;
      for (var i = 0; i < dataList.length; i++) {
        var song = {};
        var item = dataList[i];
        song.id = item.id;
        song.mid = item.mid;
        song.name = item.name;
        song.title = item.title;
        song.subTitle = item.subtitle;
        song.singer = item.singer;
        song.album = item.album
        song.url = 'http://ws.stream.qqmusic.qq.com/C100' + item.mid + '.m4a?fromtag=38';
        song.img = 'http://y.gtimg.cn/music/photo_new/T002R150x150M000' + item.album.mid + '.jpg?max_age=2592000'
        list.push(song);
      }
      app.setGlobalData({
        playList: list,
        playIndex: 0
      });
    }
    wx.navigateTo({
      url: '../play/play'
    });
  });
}
,
onGetUserInfo: function (e) {
  if (!this.logged && e.detail.userInfo) {
    this.setData({
      logged: true,
      avatarUrl: e.detail.userInfo.avatarUrl,
      userInfo: e.detail.userInfo
    })
  }
}
,

onGetOpenid: function () {
  // 调用云函数
  wx.cloud.callFunction({
    name: 'login',
    data: {},
    success: res => {
      console.log('[云函数] [login] user openid: ', res.result.openid)
      app.globalData.openid = res.result.openid
      wx.navigateTo({
        url: '../userConsole/userConsole',
      })
    },
    fail: err => {
      console.error('[云函数] [login] 调用失败', err)
      wx.navigateTo({
        url: '../deployFunctions/deployFunctions',
      })
    }
  })
}
,

// 上传图片
doUpload: function () {
  // 选择图片
  wx.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: function (res) {

      wx.showLoading({
        title: '上传中',
      })

      const filePath = res.tempFilePaths[0]

      // 上传图片
      const cloudPath = 'my-image' + filePath.match(/\.[^.]+?$/)[0]
      wx.cloud.uploadFile({
        cloudPath,
        filePath,
        success: res => {
          console.log('[上传文件] 成功：', res)

          app.globalData.fileID = res.fileID
          app.globalData.cloudPath = cloudPath
          app.globalData.imagePath = filePath

          wx.navigateTo({
            url: '../storageConsole/storageConsole'
          })
        },
        fail: e => {
          console.error('[上传文件] 失败：', e)
          wx.showToast({
            icon: 'none',
            title: '上传失败',
          })
        },
        complete: () => {
          wx.hideLoading()
        }
      })

    },
    fail: e => {
      console.error(e)
    }
  })
}
,

})
