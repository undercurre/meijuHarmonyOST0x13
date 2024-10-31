import { image } from '../../config/getImage';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';

import cloudAPI from '../../config/api_M0200003'

Page({
  /**
   * 页面的初始数据
   */
  data: {
    iconBaby: image.baby_head,
    iconEdit: image.mem_edit,
    babyList: [
      // { name: '宝宝1', icon: '', age: '3个月2天', isCur: true, birthday: '2023-10-10', sex: '男'},
      // { name: '宝宝2', icon: '', age: '3个月2天', isCur: false, birthday: '2023-10-10', sex: '女'}
    ]
  },
  goback() {
    wx.navigateBack()
  },
  onAddClick() {
    if (this.data.babyList.length >= 3) {
      Toast("最多添加3个宝宝")
      return
    }
    wx.navigateTo({
        url: "../babyAdd/babyAdd?isNewUser=0"
    })
  },
  onEditClick(e) {
    const index = e.currentTarget.dataset.item
    wx.navigateTo({
        url: "../babyEdit/babyEdit?data=" + JSON.stringify(this.data.babyList[index])
    })
  },
  onCardClick(e) {
    const index = e.currentTarget.dataset.item
    let list = this.data.babyList
    cloudAPI.setCurUserID(list[index].babyUserId)
    this.updateView()
  },
  updateView() {
    const list = cloudAPI.getLocalUserList()
    let result = []
    for (let i = 0; i < list.length; i++) {
      let now = new Date().valueOf()
      let date = new Date(list[i].birthday).valueOf()
      const diff = (now - date) / 86400000
      const diffDay = parseInt(diff % 30)
      const diffMonth = parseInt(diff / 30)
      result.push({
        babyUserId: list[i].lightUserId,
        name: list[i].username,
        icon: '',
        age:  (diffMonth > 0 ? `${diffMonth}个月` : '') + (diffDay > 0 ? `${diffDay}天` : '今天'),
        isCur: cloudAPI.getCurUserID() == list[i].lightUserId,
        birthday: list[i].birthday,
        sex: list[i].sex == 0 ? '男' : '女'
      })
    }
    this.setData({ babyList: result })
  },
  //////////////////////////////////////////////////////////////////
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
    this.updateView()
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