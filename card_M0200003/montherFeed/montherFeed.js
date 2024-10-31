import { image } from '../../config/getImage';
import { dayjs } from 'm-utilsdk/index';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';

import cloudAPI from '../../config/api_M0200003'

let timerLongArr = []
for (let i = 0; i <= 120; i++) {
  timerLongArr.push(i)
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    applianceCode: '',
    iconStart: image.timing_start,
    iconStop: image.timing_stop,
    curTabIndex: 0,
    curShowTimeText: '--',
    curShowStartTimeText: '--',
    isLeftRunning: false,
    isRightRunning: false,
    curLeftTimeText: '--',
    curRightTimeText: '--',
    curNote: '',
    montherDataList: [
      { name: '开始时间', value: '--', isCanEdit: true },
      { name: '左侧时长', value: '0分钟', isCanEdit: true },
      { name: '右侧时长', value: '0分钟', isCanEdit: true },
      { name: '总时长', value: '0分钟', isCanEdit: false },
      { name: '本次喂养位置', value: '--', isCanEdit: false }
    ],
    ////////////////////////////////////
    isShowDatePicker: false,
    curPickDate: new Date().valueOf(),
    minPickDate: new Date().valueOf() - 86400000 * 365,
    maxPickDate: new Date().valueOf(),
    ////////////////////////////////////
    isShowTimeLongPicker: false,
    curTimeLongIndex: 0,
    timerLongArr,
    curLeftRightIndex: 0,
    //////////////////////////////////
    secondTimer: null,
    isLeftLongStart: false,
    leftLongCnt: 0,
    isRightLongStart: false,
    rightLongCnt: 0,
    //////////////////////////////////
    localConfig: {
      startTime: 0,
      leaveTime: 0,
      addUp1: 0,
      isRunning1: 0,
      addUp2: 0,
      isRunning2: 0
    }
  },
  goback() {
    wx.navigateBack()
  },
  onTabClick(e) {
    const index = e.detail.index
    this.setData({
      curTabIndex: index
    })
  },
  onGiveUpClick() {
    this.clearConfig()
    this.updateMonTimerView()
  },
  onFinishClick() {
    let config = this.data.localConfig
    if (config.startTime == 0 || (config.addUp1 + config.addUp2) < 30 ) {
      Toast('计时小于30秒，无法保存')
      return
    }
    config.isRunning1 = 0
    config.isRunning2 = 0
    this.setData({localConfig: config})
    this.updateMonTimerView()
    let params = {
      feedWay: 0,
      feedTime: dayjs(config.startTime).format('YYYY-MM-DD HH:mm:ss'),
      leftTime: config.addUp1,
      rightTime: config.addUp2,
      feedType: 0,
      feedCapacity: 0,
      remark: this.data.curNote
    }
    wx.showLoading({ title: '加载中', mask: true })
    try {
      let saveText = config.addUp1 != 0 && config.addUp2 != 0 ? '左侧+右侧' : config.addUp1 != 0 ? '左侧' : config.addUp2 != 0 ? '右侧' : '--'
      wx.setStorageSync(`MJ0x13${this.data.applianceCode}MonFeedSide`, saveText)
    } catch (e) {}
    cloudAPI.uploadHistory(params).then(res => {
      wx.hideLoading()
      this.clearConfig()
      wx.navigateBack()
    }).catch(res => {
      wx.hideLoading()
      Toast('保存失败')
    })
  },
  clearConfig() {
    let config =  {
      startTime: 0,
      leaveTime: 0,
      addUp1: 0,
      isRunning1: 0,
      addUp2: 0,
      isRunning2: 0
    }
    this.setData({localConfig: config})
  },
  onRecordSaveClick() {
    let lrTime = this.getLeftRightTimeFromView()
    if (lrTime[0] == 0 && lrTime[1] == 0) {
      Toast('请选择喂养时间')
      return
    }
    let params = {
      feedWay: 0,
      feedTime: dayjs(this.data.curPickDate).format('YYYY-MM-DD HH:mm:ss'),
      leftTime: lrTime[0] * 60,
      rightTime: lrTime[1] * 60,
      feedType: 0,
      feedCapacity: 0,
      remark: this.data.curNote
    }
    wx.showLoading({ title: '加载中', mask: true })
    let saveText = lrTime[0] != 0 && lrTime[1] != 0 ? '左侧+右侧' : lrTime[0] != 0 ? '左侧' : lrTime[1] != 0 ? '右侧' : '--'
    try {
      wx.setStorageSync(`MJ0x13${this.data.applianceCode}MonFeedSide`, saveText)
    } catch (e) {}
    cloudAPI.uploadHistory(params).then(res => {
      wx.hideLoading()
      wx.navigateBack()
    }).catch(res => {
      wx.hideLoading()
      Toast('保存失败')
    })
  },
  onLeftBtnClick() {
    let config = this.data.localConfig
    config.isRunning2 = config.isRunning1 == 0 && config.isRunning2 == 1 ? 0 : config.isRunning2
    config.isRunning1 = config.isRunning1 == 0 ? 1 : 0
    if (config.addUp1 == 0 && config.addUp2 == 0) config.startTime = new Date().valueOf()
    this.setData({
      localConfig: config
    })
    this.updateMonTimerView()
  },
  onLeftBtnLongClick() {
    this.setData({
      isLeftLongStart: true,
      leftLongCnt: 0
    })
  },
  onRightBtnClick() {
    let config = this.data.localConfig
    config.isRunning1 = config.isRunning2 == 0 && config.isRunning1 == 1 ? 0 : config.isRunning1
    config.isRunning2 = config.isRunning2 == 0 ? 1 : 0
    if (config.addUp1 == 0 && config.addUp2 == 0) config.startTime = new Date().valueOf()
    this.setData({
      localConfig: config
    })
    this.updateMonTimerView()
  },
  onRightBtnLongClick() {
    this.setData({
      isRightLongStart: true,
      rightLongCnt: 0
    })
  },
  onInputChange(e) {
    this.setData({
      curNote: e.detail
    })
  },
  onMontherDataItemClick(e) {
    const index = e.currentTarget.dataset.item
    if (index == 0) {
      this.setData({
        isShowDatePicker: true,
        maxPickDate: new Date().valueOf()
      })
    } else if (index == 1 || index == 2) {
      let lrTime = this.getLeftRightTimeFromView()
      this.setData({
        isShowTimeLongPicker: true,
        curTimeLongIndex: lrTime[index - 1],
        curLeftRightIndex: index - 1
      })
    }
  },
  onDatePickConfirm(e) {
    const timeVal = e.detail
    let monData = this.data.montherDataList
    for (let i = 0; i < monData.length; i++) {
      if (monData[i].name == '开始时间') {
        monData[i].value = dayjs(timeVal).format('YYYY-MM-DD HH:mm')
        break
      }
    }
    this.setData({
      isShowDatePicker: false,
      curPickDate: timeVal,
      montherDataList: monData
    })
  },
  onDatePickCancel() {
    this.setData({
      isShowDatePicker: false
    })
  },
  onTimeLongPickConfirm(e) {
    const value = e.detail.value
    let monData = this.data.montherDataList
    const index = this.data.curLeftRightIndex
    let lrTime = this.getLeftRightTimeFromView()
    lrTime[index] = value
    for (let i = 0; i < monData.length; i++) {
      if (monData[i].name == '左侧时长') {
        monData[i].value = `${lrTime[0]}分钟`
      } else if (monData[i].name == '右侧时长') {
        monData[i].value = `${lrTime[1]}分钟`
      } else if (monData[i].name == '总时长') {
        monData[i].value = `${lrTime[0] + lrTime[1]}分钟`
      } else if (monData[i].name == '本次喂养位置') {
        if (lrTime[0] > 0 && lrTime[1] > 0) monData[i].value = '左侧+右侧'
        else if (lrTime[0] > 0) monData[i].value = '左侧'
        else if (lrTime[1] > 0) monData[i].value = '右侧'
      }
    }
    this.setData({
      isShowTimeLongPicker: false,
      montherDataList: monData
    })
  },
  getLeftRightTimeFromView() {
    let monData = this.data.montherDataList
    let result = [0, 0]
    for (let i = 0; i < monData.length; i++) {
      if (monData[i].name == '左侧时长') {
        result[0] = parseInt(monData[i].value.replace('分钟', '')) || 0
      } else if (monData[i].name == '右侧时长') {
        result[1] = parseInt(monData[i].value.replace('分钟', '')) || 0
      }
    }
    return result
  },
  onTimeLongPickCancel() {
    this.setData({
      isShowTimeLongPicker: false
    })
  },
  timerTask() {
    if (this.data.isLeftLongStart) {
      let cnt = this.data.leftLongCnt
      if (cnt < 2) {
        cnt++
        this.setData({leftLongCnt: cnt})
      } else {
        this.setData({isLeftLongStart: false})
        this.clearLeft()
      }
    }
    /////////////////////////////////////
    if (this.data.isRightLongStart) {
      let cnt = this.data.rightLongCnt
      if (cnt < 2) {
        cnt++
        this.setData({rightLongCnt: cnt})
      } else {
        this.setData({isRightLongStart: false})
        this.clearRight()
      }
    }
    /////////////////////////////////////
    let config = this.data.localConfig
    if (config.isRunning1 == 1 || config.isRunning2 == 1) {
      if (config.isRunning1 == 1) config.addUp1++
      if (config.isRunning2 == 1) config.addUp2++
      this.setData({
        localConfig: config
      })
      this.updateMonTimerView()
    }
  },
  clearLeft() {
    if (this.data.isLeftRunning) return
    let config = this.data.localConfig
    config.addUp1 = 0
    this.setData({
      localConfig: config
    })
    this.updateMonTimerView()
  },
  clearRight() {
    if (this.data.isRightRunning) return
    let config = this.data.localConfig
    config.addUp2 = 0
    this.setData({
      localConfig: config
    })
    this.updateMonTimerView()
  },
  updateMonTimerView(isFirst = false) {
    let config = this.data.localConfig
    // console.log('lmn>>>time config=', JSON.stringify(config))
    if (isFirst) {
      const nowVal = new Date().valueOf()
      let lastTime = config.leaveTime <= 0 ? nowVal : config.leaveTime
      const diff = parseInt((nowVal - lastTime) / 1000)
      if (config.isRunning1 == 1) config.addUp1 += diff
      if (config.isRunning2 == 1) config.addUp2 += diff
    }
    this.setData({
      curShowTimeText: this.second2Text(config.addUp1 + config.addUp2),
      curShowStartTimeText: config.startTime == 0 ? '--' : dayjs(config.startTime).format('HH:mm'),
      curLeftTimeText: this.second2Text(config.addUp1),
      curRightTimeText: this.second2Text(config.addUp2),
      isLeftRunning: config.isRunning1 == 1,
      isRightRunning: config.isRunning2 == 1
    })
  },
  second2Text(sec) {
    let hour = parseInt(sec / 60)
    let minute = sec % 60
    return `${hour > 9 ? hour : '0' + hour}:${minute > 9 ? minute : '0' + minute}`
  },
  initTimerValueLoacl() {
    let value = wx.getStorageSync(`MJ0x13${this.data.applianceCode}MonTimerCfg`)
    if (value) {
      this.setData({
        localConfig: JSON.parse(value)
      })
      this.updateMonTimerView(true)
    }
  },
  saveTimerValueLocal() {
    let config = this.data.localConfig
    config.leaveTime = new Date().valueOf()
    try {
      wx.setStorageSync(`MJ0x13${this.data.applianceCode}MonTimerCfg`, JSON.stringify(config))
    } catch (e) {}
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let monData = this.data.montherDataList
    for (let i = 0; i < monData.length; i++) {
      if (monData[i].name == '开始时间') {
        monData[i].value = dayjs().format('YYYY-MM-DD HH:mm')
        break
      }
    }
    let timer = setInterval(() => {
      this.timerTask()
    }, 1000)
    this.setData({
      applianceCode: options.applianceCode,
      montherDataList: monData,
      secondTimer: timer,
      curPickDate: new Date().valueOf()
    })
    this.initTimerValueLoacl()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    clearInterval(this.data.secondTimer)
    this.saveTimerValueLocal()
  },
  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
  },
  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {
  },
  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
  }
})