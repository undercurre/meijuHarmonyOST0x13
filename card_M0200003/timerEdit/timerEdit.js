import { ab2hex } from 'm-utilsdk/index';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';
import Dialog from '../../../../../../miniprogram_npm/m-ui/mx-dialog/dialog';

import command from '../../config/cmd_M0200003'
const bleNegotiation = require('../../../../../../utils/ble/ble-negotiation')
const registerBLEConnectionStateChange = require('../../../../../../utils/ble/ble-negotiation');
import { constructionBleControlOrder } from '../../../../../../utils/ble/ble-order';
const app = getApp()

let hourArr = []
for (let i = 0; i <= 23; i++) {
  hourArr.push(i)
}
let minuteArr = []
for (let i = 0; i <= 59; i++) {
  minuteArr.push(i)
}

Page({
  behaviors: [bleNegotiation, registerBLEConnectionStateChange],
  /**
   * 页面的初始数据
   */
  data: {
    deviceMacConnect: '',
    isNew: false,
    editIndex: 0,
    hourArr,
    minuteArr,
    pvTemp: [0, 0],
    curTimeIndex: [0, 0],
    curTag: '',
    curLoopText: '',
    curLoopIndex: 0,
    isLightOn: true,
    isNoticeOn: true,
    inputTemp: '',
    isShowPopup: false,
    popArr: ['仅一次', '每天', '自定义'],
    weekArr: [
      {name: '一', isSelect: false},
      {name: '二', isSelect: false},
      {name: '三', isSelect: false},
      {name: '四', isSelect: false},
      {name: '五', isSelect: false},
      {name: '六', isSelect: false},
      {name: '日', isSelect: false}
    ]
  },
  goback() {
    wx.navigateBack()
  },
  onTimeChange(e) {
    this.setData({
      pvTemp: e.detail.value
    })
  },
  onTimeEnd() {
    setTimeout(() => {
      this.setData({
        curTimeIndex: this.data.pvTemp
      })
    }, 100)
  },
  onDeleteClick() {

  },
  onEditSaveClick() {

  },
  onAddSaveClick() {
    if (!command.getIsConnected()) {
      Toast('请连接设备后再尝试')
      return
    }
    const timeIndex = this.data.editIndex
    command.setTimerName(timeIndex, this.data.curTag)

    const timeArr = this.data.curTimeIndex
    const dataList = command.getTimerList()

    let arr = []
    if (this.data.curLoopIndex == 0) {
      arr = [0, 0, 0, 0, 0, 0, 0]
    } else if (this.data.curLoopIndex == 1) {
      arr = [1, 1, 1, 1, 1, 1, 1]
    } else if (this.data.curLoopIndex == 2) {
      const week = this.data.weekArr
      for (let i = 0; i < week.length; i++) {
        arr.push(week[i].isSelect ? 1 : 0)
      }
    }
    const binStr = command.setTimerCmd(timeIndex, timeArr[0], timeArr[1], dataList[timeIndex].isEnable, arr)
    this.sendBLEBinData(binStr)

    this.goback()
  },
  onTagCellClick() {
    Dialog.confirm({
      title: '输入标签'
    })
    .then((res) => {
      if (res.action == 'confirm') {
        this.setData({
          curTag: this.data.inputTemp
        })
      }
    })
    .catch((error) => {
      if (error.action == 'cancel') {}
    });
  },
  onLoopCellClick() {
    this.setData({ isShowPopup: true })
  },
  onLightSwitchChange() {
    this.setData({
      isLightOn: !this.data.isLightOn
    })
  },
  onNoticeSwitchChange() {
    this.setData({
      isNoticeOn: !this.data.isNoticeOn
    })
  },
  onInputChange(e) {
    this.setData({
      inputTemp: e.detail
    })
  },
  onPopupClose() {
    this.setData({ isShowPopup: false })
  },
  onPopConfirmClick() {
    this.setData({ isShowPopup: false })

    if (this.data.curLoopIndex == 0) {
      this.setData({curLoopText: '仅一次'})
    } else if (this.data.curLoopIndex == 1) {
      this.setData({curLoopText: '每天'})
    } else if (this.data.curLoopIndex == 2) {
      let cnt = 0
      const arr = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      let textArr = []
      const week = this.data.weekArr
      for (let i = 0; i < week.length; i++) {
        if (week[i].isSelect) {
          textArr.push(arr[i])
          cnt++
        }
      }
      this.setData({curLoopText: cnt == 7 ? '每天' : textArr.join(',')})
    }
  },
  onLoopTypeClick(e) {
    const index = e.currentTarget.dataset.item
    this.setData({ curLoopIndex: index })
  },
  onWeekClick(e) {
    const index = e.currentTarget.dataset.item
    let arr = this.data.weekArr
    arr[index].isSelect = !arr[index].isSelect
    this.setData({weekArr: arr})
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
  updateView() {
    const dataList = command.getTimerList()
    const item = dataList[this.data.editIndex]
    let week = this.data.weekArr

    let cnt = 0
    const arr = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    let textArr = []
    for (let i = 0; i < item.loop.length; i++) {
      if (item.loop[i] == 1) {
        week[i].isSelect = true
        textArr.push(arr[i])
        cnt++
      }
    }

    this.setData({
      curTag: item.name,
      curLoopText: cnt == 0 ? '仅一次' : cnt == 7 ? '每天' : textArr.join(','),
      curLoopIndex: cnt == 0 ? 0 : cnt == 7 ? 1 : 2,
      weekArr: week
    })
    
    setTimeout(() => {
      this.setData({
        curTimeIndex: [item.hour, item.minute]
      })
    }, 0)
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      isNew: options.isNew == 1,
      editIndex: options.index,
      deviceMacConnect: options.deviceMacConnect
    })
    this.updateView()
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