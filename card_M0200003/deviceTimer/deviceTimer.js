import { ab2hex } from 'm-utilsdk/index';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';
import command from '../../config/cmd_M0200003'
const bleNegotiation = require('../../../../../../utils/ble/ble-negotiation')
const registerBLEConnectionStateChange = require('../../../../../../utils/ble/ble-negotiation');
import { constructionBleControlOrder } from '../../../../../../utils/ble/ble-order';
const app = getApp()

Page({
  behaviors: [bleNegotiation, registerBLEConnectionStateChange],
  /**
   * 页面的初始数据
   */
  data: {
    deviceMacConnect: '',
    timerList: [
      // { name: '定时一', isOn: true, hour: 8, minute: 20, loopArr: [0, 1, 0, 0, 1, 1, 1], loopText: '周一、周二、周三、周四'},
      // { name: '定时二', isOn: true, hour: 8, minute: 20, loopArr: [0, 1, 0, 0, 1, 1, 1], loopText: '周一、周二、周三、周四'},
      // { name: '定时三', isOn: true, hour: 8, minute: 20, loopArr: [0, 1, 0, 0, 1, 1, 1], loopText: '周一、周二、周三、周四'}
    ],
    updateTimer: null,
    isPageShow: false
  },
  goback() {
    wx.navigateBack()
  },
  onAddClick() {
    wx.navigateTo({
      url: "../timerEdit/timerEdit?isNew=1"
    })
  },
  onSwitchChange(e) {
    if (!command.getIsConnected()) {
      Toast('请连接设备后再尝试')
      return
    }
    const index = e.currentTarget.dataset.item
    let list = this.data.timerList
    list[index].isOn = !list[index].isOn
    this.setData({timerList: list})

    let binStr = command.setTimerCmd(index, list[index].hour, list[index].minute, list[index].isOn, list[index].loopArr)
    this.sendBLEBinData(binStr)
  },
  onCardBtnClick(e) {
    const index = e.currentTarget.dataset.item
    wx.navigateTo({
      url: "../timerEdit/timerEdit?isNew=0&index=" + index + '&deviceMacConnect=' + this.data.deviceMacConnect
    })
  },
  updateView() {
    const dataList = command.getTimerList()
    let result = []
    for (let i = 0; i < dataList.length; i++) {
      // { name: '定时一', isOn: true, hour: 8, minute: 20, loopArr: [0, 1, 0, 0, 1, 1, 1], loopText: '周一、周二、周三、周四'},
      let item = {
        name: dataList[i].name, 
        isOn: dataList[i].isEnable, 
        hour: dataList[i].hour, 
        minute: dataList[i].minute, 
        loopArr: dataList[i].loop, 
        loopText: ''
      }

      let cnt = 0
      const arr = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      let textArr = []
      for (let j = 0; j < dataList[i].loop.length; j++) {
          if (dataList[i].loop[j] == 1) {
            textArr.push(arr[j])
            cnt++
          }
      }
      item.loopText = cnt == 0 ? '仅一次' : cnt == 7 ? '每天' : textArr.join(',')
      result.push(item)
    }
    this.setData({timerList: result})
  },
  sendControl(json) {
    let binStr = command.json2bin(json)
    this.sendBLEBinData(binStr)
  },
  sendBLEBinData(order) {
    console.log('lmn>>> send BLE data=' + order);
    let parsedData = constructionBleControlOrder(order, app.globalData.bleSessionSecret);
    this.data.currentOrder = ab2hex(parsedData);
    this.getBLEDeviceServices(this.data.deviceMacConnect, 'FF90');
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({ deviceMacConnect: options.deviceMacConnect })
    this.updateView()
    clearInterval(this.data.updateTimer)
    let timer = setInterval(() => {
      if (this.data.isPageShow) this.updateView()
    }, 2000);
    this.setData({
      updateTimer: timer
    })
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
    this.setData({ isPageShow: true })
  },
  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {
    this.setData({ isPageShow: false })
  },
  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    clearInterval(this.data.updateTimer)
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