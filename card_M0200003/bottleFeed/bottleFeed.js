import { image } from '../../config/getImage';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';
import { dayjs } from 'm-utilsdk/index';

import cloudAPI from '../../config/api_M0200003'

let bottleArr = []
for (let i = 0; i <= 400; i+=5) {
  bottleArr.push(i)
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    iconBaby: image.baby_head,
    iconBottle: image.milk_bottle,
    applianceCode: '',
    bottleArr,
    curBottleIndex: [0],
    bottleStartTime: '--',
    bottleTypeArr: ['母乳', '奶瓶', '母乳+奶瓶', '水', '水奶', '其他'],
    curBottleTypeIndex: 0,
    pvTempValue: 0,
    //////////////////
    isShowBabySelect: false,
    curBabySelectIndex: 0,
    curBabyName: '--',
    curBabyList: [
      // { id: '', name: '宝宝1', icon: '', age: '3个月2天', isCur: true, birthday: '2023-10-10', sex: '男'},
    ],
    ///////////////////
    isShowDatePicker: false,
    curPickDate: new Date().valueOf(),
    minPickDate: new Date().valueOf() - 86400000 * 365,
    maxPickDate: new Date().valueOf(),
  },
  goback() {
    wx.navigateBack()
  },
  onBabyCardClick() {
    this.setData({
      isShowBabySelect: true
    })
  },
  onBabySelectClose() {
    this.setData({
      isShowBabySelect: false
    })
  },
  onBabySelectClick(e) {
    const index = e.currentTarget.dataset.item
    this.setData({
      curBabyName: this.data.curBabyList[index].name,
      curBabySelectIndex: index,
      isShowBabySelect: false
    })
  },
  onBottleChange(e) {
    const index = e.detail.value[0]
    this.setData({
      pvTempValue: index
    })
  },
  onBottleEnd() {
    setTimeout(() => {
      this.setData({
        curBottleIndex: [this.data.pvTempValue]
      })
    }, 100)
  },
  onBottleTimeClick() {
    this.setData({
      isShowDatePicker: true,
      maxPickDate: new Date().valueOf(),
    })
  },
  onDatePickConfirm(e) {
    const timeVal = e.detail
    this.setData({
      isShowDatePicker: false,
      curPickDate: timeVal,
      bottleStartTime: dayjs(timeVal).format('YYYY-MM-DD HH:mm')
    })
  },
  onDatePickCancel() {
    this.setData({
      isShowDatePicker: false
    })
  },
  onBottleTypeClick(e) {
    const index = e.currentTarget.dataset.item
    this.setData({
      curBottleTypeIndex: index
    })
  },
  onInputChange(e) {
    this.setData({
      curNote: e.detail
    })
  },
  onSaveClick() {
    // let saveBabyId = this.data.curBabyList[this.data.curBabySelectIndex].id
    const sec = new Date().getSeconds()
    const secStr = sec > 9 ? `:${sec}` : `:0${sec}`
    const params = {
      feedWay: 1,
      feedTime: this.data.bottleStartTime + secStr,
      leftTime: 0,
      rightTime: 0,
      feedType: this.data.curBottleTypeIndex,
      feedCapacity: this.data.curBottleIndex[0] * 5,
      remark: this.data.curNote
    }
    console.log('lmn>>>', '手动保存历史参数:' + JSON.stringify(params))
    wx.showLoading({ title: '加载中', mask: true })
    try {
      wx.setStorageSync(`MJ0x13${this.data.applianceCode}BottleCap`, params.feedCapacity)
    } catch (e) {}
    cloudAPI.uploadHistory(params).then(res => {
      wx.hideLoading()
      wx.navigateBack()
    }).catch(res => {
      wx.hideLoading()
      Toast('保存失败')
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    let curName = this.data.curBabyName
    const user = cloudAPI.getUserById(cloudAPI.getCurUserID())
    if (user) {
      curName = user.username
    }
    //----------------------------------
    const userList = cloudAPI.getLocalUserList()
    const curEditBabyId = cloudAPI.getCurUserID()
    let babyList = []
    let nowVal = new Date().valueOf()
    let selectIndex = this.data.curBabySelectIndex
    for (let i = 0; i < userList.length; i++) {
      // {id: '', name: '宝宝1', icon: '', age: '3个月2天', isCur: true, birthday: '2023-10-10', sex: '男'},
      let briVal = new Date(userList[i].birthday).valueOf()
      let dayDiff = parseInt((nowVal - briVal) / 86400000)
      let babyItem = {
        id: userList[i].lightUserId,
        name: userList[i].username,
        icon: '',
        age: `${parseInt(dayDiff / 30)}个月${parseInt(dayDiff % 30)}天`,
        isCur: userList[i].lightUserId == curEditBabyId,
        birthday: userList[i].birthday,
        sex: userList[i].sex == 0 ? '男' : '女'
      }
      babyList.push(babyItem)
      if (userList[i].lightUserId == cloudAPI.getCurUserID()) selectIndex = i
    }
    //---------------------------------
    let bottleTime = dayjs().format('YYYY-MM-DD HH:mm')

    this.setData({
      applianceCode: options.applianceCode,
      curBabyName: curName,
      curBabyList: babyList,
      curBabySelectIndex: selectIndex,
      bottleStartTime: bottleTime,
      curPickDate: new Date().valueOf()
    })

    let cap = wx.getStorageSync(`MJ0x13${options.applianceCode}BottleCap`)
    if (cap) {
      setTimeout(() => {
        this.setData({
          curBottleIndex: [parseInt(cap / 5)]
        })
      }, 0)
    }
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