Page({
  /**
   * 页面的初始数据
   */
  data: {
    deviceInfo: {
      info: '未初始化',
      name: '智能灯'
    },
    systemInfo: {},
    isLoaded: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    if (options && options.deviceInfo) {
        let deviceInfo = JSON.parse(decodeURIComponent(options.deviceInfo))
        console.log('首页传过来的数据', deviceInfo)
        console.log('lmn>>>', 'sn8=' + deviceInfo.sn8)
        this.setData({
          deviceInfo: deviceInfo,
          isLoaded: true
        })
    }
    wx.getSystemInfoAsync({
        success: (result) => {
          console.log('手机系统参数', result)
          this.setData({
            systemInfo: result
          })
        },
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    console.log("on onUnload")
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    if (this.data.deviceInfo.sn8 === 'M0200003') {
      let card = this.selectComponent("#cardM0200003")
      try {
        card.pullToSyncDeviceHis()
      } catch (e) {
        console.log('插件刷新函数调用失败', e)
      }
    } else {
      let card = this.selectComponent("#card")
      try {
        card.getDeviceStatus()
      } catch (e) {
        console.log('插件刷新函数调用失败', e)
      }
    }
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return this.commonShareSetting()
  }
})