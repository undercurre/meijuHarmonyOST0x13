import { image } from '../../config/getImage';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';
import Dialog from '../../../../../../miniprogram_npm/m-ui/mx-dialog/dialog';
import { dayjs } from 'm-utilsdk/index';

import cloudAPI from '../../config/api_M0200003'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    iconBaby: image.baby_head,
    curBabyImage: '',
    curName: '',
    curSex: '请输入',
    curBirthday: '请输入',
    ///////////////////////////
    editNameTemp: '',
    //////////////////////////
    isShowSexPicker: false,
    sexArr: ['男', '女'],
    sexPickIndex: 0,
    /////////////////////////
    isShowDatePicker: false,
    curPickDate: new Date().valueOf(),
    minPickDate: new Date().valueOf() - 86400000 * 365 * 10,
    maxPickDate: new Date().valueOf(),
    formatter(type, value) {
      if (type === 'year') {
        return `${value}年`;
      }
      if (type === 'month') {
        return `${value}月`;
      }
      return `${value}日`;
    },
    //////////////////////////
    isNewUser: false,
    tipText: "说明：\n宝宝的基本信息仅用于宝宝成长数据记录，您的所有信息我们将严格保密。"
  },
  goback() {
    if (this.data.isNewUser) {
      // wx.navigateBack({
      //   delta: 2
      // })
      wx.reLaunch({
        url: '/pages/index/index',
      })
    } else {
      wx.navigateBack()
    }
  },
  onImageEditClick() {},
  onNameClick() {
    Dialog.confirm({
        title: '输入昵称'
      })
      .then((res) => {
        if (res.action == 'confirm') {
          this.setData({
            curName: this.data.editNameTemp
          })
        }
      })
      .catch((error) => {
        if (error.action == 'cancel') {}
      });
  },
  onInputChange(e) {
    this.setData({
      editNameTemp: e.detail
    })
  },
  onSexClick() {
    this.setData({
      isShowSexPicker: true,
      sexPickIndex: this.data.curSex == '男' ? 0 : 1
    })
  },
  onSexConfirm(e) {
    this.setData({
      isShowSexPicker: false,
      curSex: e.detail.value
    })
  },
  onSexCancel() {
    this.setData({
      isShowSexPicker: false
    })
  },
  onBirthdayClick() {
    this.setData({
      isShowDatePicker: true
    })
  },
  onBirthdayConfirm(e) {
    const timeVal = e.detail
    this.setData({
      isShowDatePicker: false,
      curBirthday: dayjs(timeVal).format('YYYY年MM月DD日'),
      curPickDate: timeVal
    })
  },
  conBirthdayCancel() {
    this.setData({
      isShowDatePicker: false
    })
  },
  onDeleteClick() {
    // Toast('onDeleteClick')
  },
  onSaveClick() {
    if (this.data.curName === '请输入' || this.data.curName === '') {
      Toast('请输入昵称')
      return
    }
    if (this.data.curSex === '请输入') {
      Toast('请选择性别')
      return
    }
    if (this.data.curBirthday === '请输入') {
      Toast('请选择出生日期')
      return
    }
    let sexVal = this.data.curSex === '男' ? '0' : '1'
    let dateStr = dayjs(this.data.curPickDate).format('YYYY-MM-DD')
    wx.showLoading({ title: '加载中', mask: true })
    cloudAPI.addUser(this.data.curName, sexVal, dateStr, '').then(res => {
      cloudAPI.queryUserList()
      wx.hideLoading()
      wx.navigateBack()
    }).catch(err => {
      wx.hideLoading()
      Toast('新建用户失败')
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      isNewUser: parseInt(options.isNewUser) == 1
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