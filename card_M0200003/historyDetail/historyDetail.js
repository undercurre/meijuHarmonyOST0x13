import { image } from '../../config/getImage';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';
import { dayjs } from 'm-utilsdk/index';

import cloudAPI from '../../config/api_M0200003'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    iconLeft: image.date_left,
    iconRight: image.date_right,
    curTabIndex: 0,
    curDateText: '',
    curTimeVal: new Date().valueOf(),
    totalLine1: '', // '奶瓶喂养   10次   共1200ml（奶瓶10次，1200ml）',
    totalLine2:  '', //'母乳喂养   10次   共12分钟l（左侧4分钟，右侧8分钟）',
    dataListShow: [
      // { id: 0, time: '10:21', type: '奶瓶喂养', content: '总量：120ml' },
      // { id: 0, time: '10:21', type: '左侧喂养', content: '时长：1分钟' },
      // { id: 0, time: '10:21', type: '奶瓶喂养', content: '总量：120ml' },
    ],
    historyDataTemp: null,
    isCalenderShow: false,
    minDate: new Date().valueOf() - 86400000 * 365 * 2,
    maxDate: new Date().valueOf()
  },
  goback() {
    wx.navigateBack()
  },
  onTabChange(e) {
    const index = e.detail.index
    this.setData({
      curTabIndex: index
    })
    this.updateView()
  },
  onLeftClick() {
    this.changeTime(-86400000)
    this.queryHistoryByDate()
  },
  onRightClick() {
    if (parseInt(dayjs(this.data.curTimeVal).format('YYYYMMDD')) >= parseInt(dayjs().format('YYYYMMDD'))) {
      Toast('没有更多了')
      return
    }
    this.changeTime(86400000)
    this.queryHistoryByDate()
  },
  onDateClick() {
    this.setData({isCalenderShow: true})
    setTimeout(() => {
      this.setData({ curTimeVal: this.data.curTimeVal + 1})
    }, 300)
  },
  onCalenderConfirm(e) {
    this.setData({ isCalenderShow: false })
    let dateVal = new Date(e.detail).valueOf()
    this.changeTime(dateVal, false)
    this.queryHistoryByDate()
  },
  onCalenderClose() {
    this.setData({isCalenderShow: false})
  },
  onItemClick(e) {
    const index = e.currentTarget.dataset.item
    let showItem = this.data.dataListShow[index]
    const srcList = this.data.historyDataTemp
    for (let i = 0; i < srcList.length; i++) {
      if (showItem.id == srcList[i].historyId) {
        wx.navigateTo({
          url: "../recordDetail/recordDetail?data=" + JSON.stringify(srcList[i])
        })
        return
      }
    }
  },
  onSwipeClose(e) {
    const index = e.currentTarget.dataset.item
    const { position, instance } = e.detail;
    switch (position) {
      case 'right':
        instance.close();
        this.deleteHistory(index)
        break;
    }
  },
  deleteHistory(index) {
    let showItem = this.data.dataListShow[index]
    const srcList = this.data.historyDataTemp
    for (let i = 0; i < srcList.length; i++) {
      if (showItem.id == srcList[i].historyId) {
        wx.showLoading({ title: '加载中', mask: true })
        cloudAPI.deleteHistory([srcList[i].historyId]).then(res => {
          this.queryHistoryByDate()
        }).catch(err => {
          wx.hideLoading()
          Toast('删除失败')
        })
        return
      }
    }
  },
  changeTime(val, isDiff = true) {
    let timeVal
    if (isDiff) {
      timeVal = this.data.curTimeVal + val
    } else {
      timeVal = val
    }
    let timeObj = new Date(timeVal)
    const arr = ['日', '一', '二', '三', '四', '五', '六']
    this.setData({
      curTimeVal: timeVal,
      curDateText: `${dayjs(timeVal).format('YYYY年MM月DD日')} 周${arr[timeObj.getDay()]}`
    })
  },
  queryHistoryByDate() {
    let dateStr = dayjs(this.data.curTimeVal).format('YYYY-MM-DD')
    wx.showLoading({ title: '加载中', mask: true })
    cloudAPI.queryHistory(dateStr).then(res => {
      wx.hideLoading()
      if (res.result != undefined && res.result.lightFeedHistoryList != undefined) {
        const list = res.result.lightFeedHistoryList
        this.setData({
          historyDataTemp: list
        })
        this.updateView()
      }
    }).catch(err => {
      wx.hideLoading()
      Toast('获取历史数据失败')
    })
  },
  updateView() {
    if (this.data.historyDataTemp == null) return
    if (this.data.historyDataTemp.length == 0) {
      this.setData({
        totalLine1: '',
        totalLine2: '',
        dataListShow: []
      })
      return
    }
    let tabType = this.data.curTabIndex
    let result = []

    let feedWayCnt = [0, 0]
    let feedTypeCnt = [0, 0, 0, 0, 0, 0]
    let totalMonLeftTime = 0
    let totalMonRightTime = 0
    let totalBottle = 0

    const list = this.data.historyDataTemp
    //totalLine1: '', // '奶瓶喂养   10次   共1200ml（奶瓶10次，1200ml）',
    //totalLine2:  '', //'母乳喂养   10次   共12分钟（左侧4分钟，右侧8分钟）',
    for (let i = 0; i < list.length; i++) {
      if (list[i].feedWay == 0) {
        feedWayCnt[0]++
      } else if (list[i].feedWay == 1) {
        feedWayCnt[1]++
      }
      if (list[i].feedType >= 0 && list[i].feedType <= 5) {
        feedTypeCnt[parseInt(list[i].feedType)]++
      }
      if (list[i].leftTime) totalMonLeftTime += parseInt(list[i].leftTime)
      if (list[i].rightTime) totalMonRightTime += parseInt(list[i].rightTime)
      if (list[i].feedCapacity) totalBottle += parseInt(list[i].feedCapacity)
      /////////////////////////////////
      // { id: 0, time: '10:21', type: '奶瓶喂养', content: '总量：120ml' },
      // { id: 0, time: '10:21', type: '左侧喂养', content: '时长：1分钟' },
      if (tabType == 1 && list[i].feedWay != 0) {
        continue
      } else if (tabType == 2 && list[i].feedWay != 1) {
        continue
      }
      let monTypeText = '母乳喂养'
      if (list[i].leftTime > 0 && list[i].rightTime > 0) {
        monTypeText = '左侧+右侧喂养'
      } else if (list[i].leftTime > 0) {
        monTypeText = '左侧喂养'
      } else if (list[i].rightTime > 0) {
        monTypeText = '右侧喂养'
      }
      let item = {
        id: list[i].historyId,
        babyUserId: list[i].lightUserId,
        time: dayjs(list[i].feedTime).format('HH:mm'),
        type: list[i].feedWay == 0 ? monTypeText : '奶瓶喂养',
        content: list[i].feedWay == 0 ? `时长：${parseInt((list[i].leftTime + list[i].rightTime) / 60)}分钟` : `总量：${list[i].feedCapacity}ml`
      }
      result.push(item)
    }
    const feedTypeText = ['母乳', '奶瓶', '母乳+奶瓶', '水', '水奶', '其他']
    let typeTextArr = []
    for (let i = 0; i < feedTypeCnt.length; i++) {
      if (feedTypeCnt[i] > 0) typeTextArr.push(`${feedTypeText[i]}${feedTypeCnt[i]}次`)
    }
    const leftMinute = parseInt(totalMonLeftTime / 60)
    const rightMinute = parseInt(totalMonRightTime / 60)
    this.setData({
      totalLine1: feedWayCnt[1] == 0 ? '奶瓶喂养  0次' : `奶瓶喂养  ${feedWayCnt[1]}次, 共${totalBottle}ml（${typeTextArr.join(',')}）`,
      totalLine2: feedWayCnt[0] == 0 ? '母乳喂养  0次' : `母乳喂养  ${feedWayCnt[0]}次, 共${leftMinute + rightMinute}分钟（左侧${leftMinute}分钟，右侧${rightMinute}分钟）`,
      dataListShow: result
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
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
    this.changeTime(0)
    this.queryHistoryByDate()
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