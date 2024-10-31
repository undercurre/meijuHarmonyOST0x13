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
    curName: '--',
    curSex: '--',
    curBirthday: '--',
    curBabyUserId: '',
    ///////////////////////////
    editNameTemp: '',
    //////////////////////////
    isShowSexPicker: false,
    sexArr: ['男', '女'],
    sexPickIndex: 0,
    /////////////////////////
    isShowDatePicker: false,
    curPickDate: 0,
    minPickDate: 0,
    maxPickDate: new Date().valueOf(),
    formatter(type, value) {
      if (type === 'year') {
        return `${value}年`;
      }
      if (type === 'month') {
        return `${value}月`;
      }
      return `${value}日`;
    }
  },
  goback() {
    wx.navigateBack()
  },
  onImageEditClick() {
    Toast('onImageEditClick')
  },
  onNameClick() {
    Dialog.confirm({
        title: '修改昵称'
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
    const list = cloudAPI.getLocalUserList()
    if (list.length <= 1) {
      Toast('最少保留一个用户')
      return
    }
    let that = this
    wx.showModal({
      title: '确定要删除？',
      confirmColor: '#267AFF',
      cancelColor: '#267AFF',
      confirmText: '确定',
      cancelText: '取消',
      success (res) {
        if (res.confirm) {
          wx.showLoading({ title: '加载中', mask: true })
          cloudAPI.deleteUsers([that.data.curBabyUserId]).then(res => {
            wx.hideLoading()
            that.queryAndBack()
          }).catch(err => {
            wx.hideLoading()
            Toast('删除失败')
          })
        }
      }
    })
  },
  onSaveClick() {
    let sexVal = this.data.curSex == '男' ? '0' : '1'
    let dateStr = dayjs(this.data.curPickDate).format('YYYY-MM-DD')
    wx.showLoading({ title: '加载中', mask: true })
    cloudAPI.updateUser(this.data.curBabyUserId, this.data.curName, sexVal, dateStr, '').then(res => {
      wx.hideLoading()
      this.queryAndBack()
    }).catch(err => {
      wx.hideLoading()
      Toast('保存失败')
    })
  },
  queryAndBack() {
    wx.showLoading({ title: '加载中', mask: true })
    cloudAPI.queryUserList().then(res => {
      wx.hideLoading()
      this.goback()
    }).catch(err => {
      wx.hideLoading()
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    const data = JSON.parse(options.data)
    this.setData({
      curBabyUserId: data.babyUserId,
      curName: data.name,
      curSex: data.sex,
      curBirthday: dayjs(data.birthday).format('YYYY年MM月DD日'),
      curPickDate: new Date(data.birthday).valueOf(),
      minPickDate: new Date(data.birthday).valueOf() - 86400000 * 365 * 5
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