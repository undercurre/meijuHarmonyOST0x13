import { image } from '../../config/getImage';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';
import { dayjs } from 'm-utilsdk/index';

import cloudAPI from '../../config/api_M0200003'

let timerLongArr = []
for (let i = 0; i <= 120; i++) {
  timerLongArr.push(i)
}
let bottleArr = []
for (let i = 0; i <= 400; i+=5) {
  bottleArr.push(i)
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
      isLoaded: false,
      iconBaby: image.baby_head,
      iconBottle: image.milk_bottle,
      isMonther: false,
      curHistoryId: '',
      curBabyName: '--',
      curBabyList: [
        // { name: '宝宝1', icon: '', age: '3个月2天', isCur: true, birthday: '2023-10-10', sex: '男'},
      ],
      montherDataList: [
        { name: '开始时间', value: '--', isCanEdit: true },
        { name: '左侧时长', value: '--分钟', isCanEdit: true },
        { name: '右侧时长', value: '--分钟', isCanEdit: true },
        { name: '总时长', value: '--分钟', isCanEdit: false },
        { name: '本次喂养位置', value: '--', isCanEdit: false }
      ],
      curNote: '',
      ////////////////////////////////////
      isShowBabySelect: false,
      curBabySelectIndex: 0,
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
      ////////////////////////////////////
      isShowSidePicker: false,
      curSideIndex: 0,
      sideArr: ['左侧', '右侧', '左侧+右侧'],
      ////////////////////////////////////
      bottleArr,
      curBottleIndex: [0],
      bottleStartTime: '--',
      bottleTypeArr: ['母乳', '奶瓶', '母乳+奶瓶', '水', '水奶', '其他'],
      curBottleTypeIndex: -1,
      pvTempValue: 0
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
    } else if (index == 4) {
      // let sideIndex = this.data.curSideIndex
      // let monData = this.data.montherDataList
      // for (let i = 0; i < monData.length; i++) {
      //   if (monData[i].name == '本次喂养位置') {
      //     if (monData[i].value == '左侧') sideIndex = 0
      //     else if (monData[i].value == '右侧') sideIndex = 1
      //     else if (monData[i].value == '左侧+右侧') sideIndex = 2
      //     break
      //   }
      // }
      // this.setData({
      //   isShowSidePicker: true,
      //   curSideIndex: sideIndex
      // })
    }
  },
  onDatePickConfirm(e) {
    const timeVal = e.detail
    this.setData({
      isShowDatePicker: false,
      curPickDate: timeVal
    })
    if (this.data.isMonther) {
      let monData = this.data.montherDataList
      for (let i = 0; i < monData.length; i++) {
        if (monData[i].name == '开始时间') {
          monData[i].value = dayjs(timeVal).format('YYYY-MM-DD  HH:mm')
          break
        }
      }
      this.setData({
        montherDataList: monData
      })
    } else {
      this.setData({
        bottleStartTime: dayjs(timeVal).format('YYYY-MM-DD  HH:mm')
      })
    }
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
  onSidePickConfirm(e) {
    const index = e.detail.index
    this.setData({
      isShowSidePicker: false
    })
  },
  onSidePickCancel() {
    this.setData({
      isShowSidePicker: false
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
      maxPickDate: new Date().valueOf()
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
      let saveBabyId = this.data.curBabyList[this.data.curBabySelectIndex].id
      let params = {
        feedWay: this.data.isMonther ? '0' : '1',
        lightUserId: saveBabyId,
        feedTime: dayjs(this.data.curPickDate).format('YYYY-MM-DD HH:mm:ss')
      }
      if (this.data.curNote) Object.assign(params, { remark: this.data.curNote })
      if (this.data.isMonther) {
        let lrTime = this.getLeftRightTimeFromView()
        Object.assign(params, { leftTime: lrTime[0] * 60, rightTime: lrTime[1] * 60 })
      } else {
        Object.assign(params, { feedCapacity: this.data.curBottleIndex * 5, feedType: this.data.curBottleTypeIndex })
      }

      wx.showLoading({ title: '加载中', mask: true })
      cloudAPI.updateHistory(this.data.curHistoryId, params).then(res => {
        wx.hideLoading()
        this.goback()
      }).catch(err => {
        wx.hideLoading()
        Toast('保存失败')
      })
  },
  onDeleteClick() {
    wx.showLoading({ title: '加载中', mask: true })
    cloudAPI.deleteHistory([this.data.curHistoryId]).then(res => {
      wx.hideLoading()
      this.goback()
    }).catch(err => {
      wx.hideLoading()
      Toast('删除失败')
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const data = JSON.parse(options.data)
    console.log('lmn>>>', JSON.stringify(data))
    //---------------------------
    let curName = this.data.curBabyName
    const user = cloudAPI.getUserById(data.lightUserId)
    if (user) {
      curName = user.username
    }
    //-------------------------
    const userList = cloudAPI.getLocalUserList()
    const curEditBabyId = cloudAPI.getCurUserID()
    let babyList = []
    let nowVal = new Date().valueOf()
    let selectIndex = this.data.curBabySelectIndex
    for (let i = 0; i < userList.length; i++) {
      // { name: '宝宝1', icon: '', age: '3个月2天', isCur: true, birthday: '2023-10-10', sex: '男'},
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
      if (userList[i].lightUserId == data.lightUserId) selectIndex = i
    }
    //-------------------------
    let pickDateVal = new Date(data.feedTime).valueOf()
    let pickDateMinVal = pickDateVal -  86400000 * 365

    let monDataList = this.data.montherDataList
    let bottleTime = this.data.bottleStartTime
    let bottleTypeIndex = this.data.curBottleTypeIndex
    if (data.feedWay == 0) {
      let monStartTime = dayjs(data.feedTime).format('YYYY-MM-DD  HH:mm')
      let monLTime = parseInt(data.leftTime / 60)
      let monRTime = parseInt(data.rightTime / 60)
      let LRText = ''
      if (data.leftTime > 0 && data.rightTime > 0) LRText = '左侧+右侧'
      else if (data.leftTime > 0) LRText = '左侧'
      else if (data.rightTime > 0) LRText = '右侧'
      monDataList = [
        { name: '开始时间', value: monStartTime, isCanEdit: true },
        { name: '左侧时长', value: `${monLTime}分钟`, isCanEdit: true },
        { name: '右侧时长', value: `${monRTime}分钟`, isCanEdit: true },
        { name: '总时长', value: `${monLTime + monRTime}分钟`, isCanEdit: false },
        { name: '本次喂养位置', value: LRText, isCanEdit: false }
      ]
    } else if (data.feedWay == 1) {
      bottleTime = dayjs(data.feedTime).format('YYYY-MM-DD  HH:mm')
      if (data.feedType) bottleTypeIndex = parseInt(data.feedType)
      setTimeout(() => {
        this.setData({
          curBottleIndex: [parseInt(data.feedCapacity / 5)]
        })
      }, 0)
    }
    //-------------------------
    let note = this.data.curNote
    if (data.remark) note = data.remark

    this.setData({
      isLoaded: true,
      curHistoryId: data.historyId,
      isMonther: data.feedWay == 0,
      curBabyName: curName,
      curBabyList: babyList,
      curBabySelectIndex: selectIndex,
      curNote: note,
      curPickDate: pickDateVal,
      minPickDate: pickDateMinVal,
      montherDataList: monDataList,
      bottleStartTime: bottleTime,
      curBottleTypeIndex: bottleTypeIndex
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