import { image } from '../../config/getImage';
import Toast from '../../../../../../miniprogram_npm/m-ui/mx-toast/toast';
import Dialog from '../../../../../../miniprogram_npm/m-ui/mx-dialog/dialog';
import { dayjs, ab2hex } from 'm-utilsdk/index';

import command from '../../config/cmd_M0200003'
import bluetooth from '../../config/bluetooth'
const bleNegotiation = require('../../../../../../utils/ble/ble-negotiation')
const registerBLEConnectionStateChange = require('../../../../../../utils/ble/ble-negotiation');
import { paesrBleResponData, constructionBleControlOrder } from '../../../../../../utils/ble/ble-order';

import cloudAPI from '../../config/api_M0200003'

const app = getApp()

Component({
    behaviors: [bleNegotiation, registerBLEConnectionStateChange],
    /**
     * 组件的属性列表
     */
    properties: {
      devInfo: {
          type: Object,
          value: {
            name: ''
          }
      }
    },
    /**
     * 组件的初始数据
     */
    data: {
        deviceInfoMS: {name: ''},
        deviceName: '母婴灯',
        version: '1.1.1',
        iconProduct: image.product,
        imageBG: image.home_bg,
        iconBabyEntry: image.baby_manage_entry,
        iconBaby: image.baby_head,
        iconTip: image.warn_tip,
        iconClose: image.warn_close,
        iconArrowRight: image.arrow_right,
        iconHisMilk: image.his_milk,
        iconHisMonLeft: image.his_monther_left,
        iconHisMonRight: image.his_mother_right,
        ////////////////////////////////
        isPageShow: false,
        isWorking: false, // 是否喂养中
        isLowBattery: false, // 是否低电量
        isUserCloseTip: false, //是否用户关闭提示
        curDevDelayTime: '--', //当前设备延时关机时间点
        isShowDelaySetting: false, //显示延迟设置
        delayConfig: [1, 15, 30], //延迟配置
        curDelaySelectIndex: 0,
        delayCalcTimeStr: '', //预计延迟关机时间点
        sliderValue: 1, // 亮度滑条值
        isSliderDisable: true,
        bottomConfig: { //底部设置
            iconPowerOn: image.power_on,
            iconPowerOff: image.power_off,
            iconTimerOn: image.timer_on,
            iconTimerOff: image.timer_off,
            powerOn: true,
            timerOn: false
        },
        isHistoryShowMore: false, // 历史展开
        historydata: [ // 列表数据 type: 0母乳/1奶瓶，subType：0左侧/1右侧/2左侧+右侧
            // { type: 0, subType: 0, dateStr: '1天前 （11月28日  21:10）', main: '左侧喂养', sub: '时长：1分钟'},
            // { type: 1, subType: 0, dateStr: '2天前 （11月27日  11:09）', main: '奶瓶+母乳', sub: '125ml'},
        ],
        historySrcList: [],
        cardConfig: [
          { name: '母乳喂养', icon: image.entry_mother, contant: '--' },
          { name: '奶瓶喂养', icon: image.entry_milk, contant: '--' },
          { name: '定时提醒', icon: image.entry_timer, contant: '--' }
        ],
        curBabyName: '',
        ///////////////////////////////////
        status: {},
        isHadNew: false,
        BlueToothStatus: -1, // -1：初始未连接， 0：未连接成功，1：连接中，2：已连接，3：断开
        isBlueToothReady: false,
        deviceMacConnect: '',
        btConnectTimeout: null,
        isClickBlueConnect: false,
        isLastTimeBlueEnable: false,
        ///////////////////////////////////
        isSystemBLEAuthorize: false,
        isSystemBLEOpen: false,
        isSystemLocationAuthorize : false,
        isSystemLocationOpen: false,
        isSupportBLE: false,
        isGetAuthorizeSuccess: false,
        /////////////////////////////
        syncHisLock: false,
        hadTryAutoSyncHis: false,
        ////////////////////////////
        queryTimer: null,
        isNeedCheckSystemOnOff: false,
        checkSysOnOffTimer: null,
        hadSyncTime: false,
        btConnectStartTime: 0,
        btScanFinishTime: 0,
        lastUpdateViewTime: 0
    },
  
    /**
     * 组件的方法列表
     */
    methods: {
      goback() {
          //wx.navigateBack()
          wx.reLaunch({
            url: '/pages/index/index',
          })
      },
      goToBabyManage() {
        wx.navigateTo({
            url: "../card_M0200003/babyManage/babyManage"
        })
      },
      onTipCloseClick() {
        this.setData({
            isUserCloseTip: true
        })
      },
      onBirghtSliderChange(e) {
        this.setData({
            sliderValue: e.detail
        })
        this.sendControl({
          brightness: e.detail
        })
      },
      onPowerClick(e) {
          let config = this.data.bottomConfig
          config.powerOn = e.detail
          this.setData({
            bottomConfig: config
          })
          this.sendControl({
            light: config.powerOn ? 'on' : 'off'
          })
      },
      onTimerClick(e) {
        // let config = this.data.bottomConfig
        // config.timerOn = e.detail
        let nowVal = new Date().valueOf()
        this.setData({
          //bottomConfig: config,
          isShowDelaySetting: true,
          delayCalcTimeStr: dayjs(nowVal + 60000).format('HH:mm')
        })
      },
      goToMoreHistory() {
        wx.navigateTo({
            url: "../card_M0200003/historyDetail/historyDetail"
        })
      },
      onShowMoreClick() {
        this.setData({
            isHistoryShowMore: !this.data.isHistoryShowMore
        })
      },
      onDelaySetChange(e) {
        const val = e.detail.value * 60000
        let nowVal = new Date().valueOf()
        this.setData({
            delayCalcTimeStr: dayjs(nowVal + val).format('HH:mm')
        })
      },
      onDelaySetConfirm(e) {
        const val = e.detail.value * 60000
        let nowVal = new Date().valueOf()
        this.setData({
            isShowDelaySetting: false,
            curDevDelayTime: dayjs(nowVal + val).format('HH:mm')
        })
        this.sendControl({
          timing_light_off: e.detail.value
        })
      },
      onDelaySetCancel() {
        this.setData({
            isShowDelaySetting: false
        })
      },
      onCardClick(e) {
        const index = e.currentTarget.dataset.item
        if (index == 0) {
          wx.navigateTo({
            url: "../card_M0200003/montherFeed/montherFeed?applianceCode=" + this.data.deviceInfoMS.applianceCode
          })
        } else if (index == 1) {
          wx.navigateTo({
            url: "../card_M0200003/bottleFeed/bottleFeed?applianceCode=" + this.data.deviceInfoMS.applianceCode
          })
        } else if (index == 2) {
          if (this.data.BlueToothStatus != 2) {
            Toast('请先连接设备')
            return
          }
          wx.navigateTo({
            url: "../card_M0200003/deviceTimer/deviceTimer?deviceMacConnect=" + this.data.deviceMacConnect
          })
        }
      },
      onHistoryItemClick(e) {
        const index = e.currentTarget.dataset.item
        wx.navigateTo({
          url: "../card_M0200003/recordDetail/recordDetail?data=" + JSON.stringify(this.data.historySrcList[index])
        })
      },
      onDeviceSerClick() {
        wx.navigateTo({
          url:
            '/miniprogram_npm/m-services/services/index?applianceData=' +
            encodeURIComponent(JSON.stringify(this.data.deviceInfoMS)) +
            '&version=' +
            this.data.version,
        })
      },
      startQueryLooping() {
        clearInterval(this.data.queryTimer)
        let timer = setInterval(() => {
          this.sendQuery()
          this.queryCloudHistory()
        }, 10000);
        this.setData({
          queryTimer: timer
        })
      },
      sendQuery() {
        if (this.data.BlueToothStatus == 2) {
          let binStr = command.queryCMD()
          this.sendBLEBinData(binStr)
        }
      },
      sendTimeSync() {
        if (this.data.BlueToothStatus == 2) {
          let binStr = command.json2bin({})
          console.log('lmn>>>同步时间：', binStr)
          this.sendBLEBinData(binStr)
        }
      },
      sendControl(json) {
        if (this.data.BlueToothStatus == 2) {
          let binStr = command.json2bin(json)
          this.sendBLEBinData(binStr)
        }
      },
      sendHistoryReq() {
        if (this.data.BlueToothStatus == 2) {
          let binStr = command.historyReqCMD()
          this.sendBLEBinData(binStr)
        }
      },
      sendHistoryACK() {
        if (this.data.BlueToothStatus == 2) {
          let binStr = command.historyACKSuccessCMD()
          this.sendBLEBinData(binStr)
        }
      },
      sendHistoryFail() {
        if (this.data.BlueToothStatus == 2) {
          let binStr = command.historyACKFailCMD()
          this.sendBLEBinData(binStr)
        }
      },
      pullToSyncDeviceHis() {
        console.log('lmn>>>', '手动下拉')
        if (!this.data.syncHisLock && cloudAPI.getCurUserID() != 0 && this.data.BlueToothStatus == 2) {
          console.log('lmn>>>', '开始同步历史(手动)')
          this.setData({
            syncHisLock: true
          })
          this.sendHistoryReq()
        }
      },
      queryCloudHistory() {
        cloudAPI.queryHistory('', 10).then(res => {
          if (res.result != undefined && res.result.lightFeedHistoryList != undefined) {
            const list = res.result.lightFeedHistoryList
            if (list.length === 0) {
              this.setData({
                historydata: [],
                historySrcList: []
              })
              return
            }
            let arr = []
            let now = new Date()
            list.sort((a, b) => {
              return new Date(b.feedTime).valueOf() - new Date(a.feedTime).valueOf()
            })
            for (let i = 0; i < list.length && i < 10; i++) {
              // { type: 0, subType: 0, dateStr: '1天前 （11月28日  21:10）', main: '左侧喂养', sub: '时长：1分钟'},
              let sub  = 0
              let mainText = '母乳喂养'
              let time = 0
              if (list[i].leftTime > 0 && list[i].rightTime > 0) {
                sub = 2
                mainText = '左侧+右侧喂养'
                time = parseInt((list[i].leftTime + list[i].rightTime) / 60)
              } else if (list[i].leftTime > 0) {
                sub = 0
                mainText = '左侧喂养'
                time = parseInt(list[i].leftTime / 60)
              } else if (list[i].rightTime > 0) {
                sub = 1
                mainText = '右侧喂养'
                time = parseInt(list[i].rightTime / 60)
              }
              const feedTypeArr = ['母乳', '奶瓶', '母乳+奶瓶', '水', '水奶', '其他']
              let dateStr = dayjs(list[i].feedTime).format('MM月DD日  HH:mm')
              let dataDate = new Date(list[i].feedTime)
              
              let secondSurplus = parseInt(((now.valueOf() - dataDate.valueOf()) % 86400000 ) / 1000)
              let tadaySec = now.getHours() * 3600 + now.getMinutes() * 60

              let diff = parseInt((now.valueOf() - dataDate.valueOf()) / 86400000)
              if (secondSurplus > tadaySec) diff++

              let item = {
                type: list[i].feedWay,
                subType: sub,
                dateStr: (diff > 0 ? `${diff}天前` : '今天') + ` (${dateStr})`,
                main: list[i].feedWay == 0 ? mainText : `${feedTypeArr[parseInt(list[i].feedType)] || '其他'}喂养`,
                sub: list[i].feedWay == 0 ? `${time}分钟` : `${list[i].feedCapacity || 0}ml`
              }
              arr.push(item)
            }
            this.setData({
              historydata: arr,
              historySrcList: list
            })
          }
        }).catch(err => {
        })
      },
      updateView() {
        const nowVal = new Date().valueOf()
        if (nowVal - this.data.lastUpdateViewTime < 300) {
          return
        }
        console.log('lmn>>>', '界面更新')
        const status = this.data.status
        ////-----------------------------
        let bottomData = this.data.bottomConfig
        let delayIndex = this.data.curDelaySelectIndex
        let delayTime = this.data.curDevDelayTime
        let slderDisable = this.data.isSliderDisable
        if (status.light != undefined && status.light == 'on') {
          bottomData.powerOn = true
          slderDisable = false
        } else if (status.light != undefined && status.light == 'off') {
          bottomData.powerOn = false
          slderDisable = true
        }
        ///----------------------------------
        if (status.timing_light_off != undefined) {
          if (status.timing_light_off > 0 && status.light == 'on') {
            bottomData.timerOn = true
            delayTime = dayjs(nowVal + status.timing_light_off * 60000).format('HH:mm')
          } else {
            bottomData.timerOn = false
            delayTime = '--'
          }
          if (status.timing_light_off > 15) {
            delayIndex = 2
          } else if (status.timing_light_off > 1) {
            delayIndex = 1
          } else {
            delayIndex = 0
          }
        }
        ///----------------------------------
        let bri = this.data.sliderValue
        if (status.brightness != undefined) {
          if (status.brightness >= 1 && status.brightness <= 100) bri = status.brightness
          else if (status.brightness < 1) bri = 1
          else if (status.brightness > 100) bri = 100
        }
        ///----------------------------------
        let isLow = this.data.isLowBattery
        if (status.battery_level_low != undefined) {
          if (status.battery_level_low == 'alarm') isLow = true
          else if (status.battery_level_low == 'normal') isLow = false
        }
        ///----------------------------------
        this.setData({
          bottomConfig: bottomData,
          curDelaySelectIndex: delayIndex,
          curDevDelayTime: delayTime,
          sliderValue: bri,
          isSliderDisable: slderDisable,
          isLowBattery: isLow,
          lastUpdateViewTime: nowVal,
          isHadNew: false
        })
        this.updateDeviceTimerTime()
        setTimeout(() => {
          if (this.data.isHadNew) {
            this.updateView()
          }
        }, 300)
      },
      updateDeviceTimerTime() {
        const list = command.getTimerList()
        let devTimerList = JSON.parse(JSON.stringify(list))
        let now = new Date()
        const nowHMVal = parseInt(`${now.getHours()}${this.toTwoStr(now.getMinutes())}`)
        let weekIndex = now.getDay()
        if (weekIndex == 0) weekIndex = 6
        else weekIndex--
        let tomorrowIndex = weekIndex + 1
        if (tomorrowIndex >= 7) tomorrowIndex = 0
        const t0HMVal = parseInt(`${devTimerList[0].hour}${this.toTwoStr(devTimerList[0].minute)}`)
        const t1HMVal = parseInt(`${devTimerList[1].hour}${this.toTwoStr(devTimerList[1].minute)}`)
        const t2HMVal = parseInt(`${devTimerList[2].hour}${this.toTwoStr(devTimerList[2].minute)}`)
        let t0LoopCnt = 0
        let t1LoopCnt = 0
        let t2LoopCnt = 0
        for (let i = 0; i < 7; i++) {
          if (devTimerList[0].loop[i] == 1) t0LoopCnt++
          if (devTimerList[1].loop[i] == 1) t1LoopCnt++
          if (devTimerList[2].loop[i] == 1) t2LoopCnt++
        }
        if (devTimerList[0].isEnable && t0LoopCnt == 0) {
          if (t0HMVal >= nowHMVal) devTimerList[0].loop[weekIndex] = 1
          else devTimerList[0].loop[tomorrowIndex] = 1
        }
        if (devTimerList[1].isEnable && t1LoopCnt == 0) {
          if (t1HMVal >= nowHMVal) devTimerList[1].loop[weekIndex] = 1
          else devTimerList[1].loop[tomorrowIndex] = 1
        }
        if (devTimerList[2].isEnable && t2LoopCnt == 0) {
          if (t2HMVal >= nowHMVal) devTimerList[2].loop[weekIndex] = 1
          else devTimerList[2].loop[tomorrowIndex] = 1
        }

        let HMValTemp = 2460
        let resTimerIndex = -1
        let isAfterDay = false
        for (let i = 0; i < 7; i++) {
          if (devTimerList[0].isEnable && devTimerList[0].loop[weekIndex] == 1) {
            if (isAfterDay) {
              if (t0HMVal < HMValTemp) {
                HMValTemp = t0HMVal
                resTimerIndex = 0
              }
            } else if (t0HMVal >= nowHMVal && t0HMVal < HMValTemp) {
              HMValTemp = t0HMVal
              resTimerIndex = 0
            }
          }
          if (devTimerList[1].isEnable && devTimerList[1].loop[weekIndex] == 1) {
            if (isAfterDay) {
              if (t1HMVal < HMValTemp) {
                HMValTemp = t1HMVal
                resTimerIndex = 1
              }
            } else if (t1HMVal >= nowHMVal && t1HMVal < HMValTemp) {
              HMValTemp = t1HMVal
              resTimerIndex = 1
            }
          }
          if (devTimerList[2].isEnable && devTimerList[2].loop[weekIndex] == 1) {
            if (isAfterDay) {
              if (t2HMVal < HMValTemp) {
                HMValTemp = t2HMVal
                resTimerIndex = 2
              }
            } else if (t2HMVal >= nowHMVal && t2HMVal < HMValTemp) {
              HMValTemp = t2HMVal
              resTimerIndex = 2
            }
          }
          if (HMValTemp != 2460) break
          weekIndex++
          if (weekIndex >= 7) weekIndex = 0
          isAfterDay = true
        }
        let cardCfg = this.data.cardConfig
        if (HMValTemp == 2460 || resTimerIndex == -1) {
          cardCfg[2].contant = '--'
        } else {
          const weekArr = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
          cardCfg[2].contant = `${weekArr[weekIndex]} ${this.toTwoStr(devTimerList[resTimerIndex].hour)}:${this.toTwoStr(devTimerList[resTimerIndex].minute)}`
        }
        this.setData({ cardConfig: cardCfg })
      },
      toTwoStr(num) {
        return num > 9 ? `${num}` : `0${num}`
      },
      updateMonAndBottleFeed() {
        let cardCfg = this.data.cardConfig
        let monSide = wx.getStorageSync(`MJ0x13${this.data.deviceInfoMS.applianceCode}MonFeedSide`)
        if (monSide) {
          cardCfg[0].contant = monSide
        }
        let cap = wx.getStorageSync(`MJ0x13${this.data.deviceInfoMS.applianceCode}BottleCap`)
        if (cap) {
          cardCfg[1].contant = `${cap}ml`
        }
        this.setData({ cardConfig: cardCfg })
      },
      uploadHistory(data) {
        let type = data.historicalDataType == 0 || data.historicalDataType == 1 ? '0' : '1'
        let LTime = data.historicalDataType == 0 ? data.historicalDataEndTime - data.historicalDataStartTime : 0
        let RTime = data.historicalDataType == 1 ? data.historicalDataEndTime - data.historicalDataStartTime : 0
        let params = {
          feedWay: type, //喂养方式,0-母乳喂养，1-奶瓶喂养
          feedTime: dayjs(data.historicalDataStartTime * 1000).format('YYYY-MM-DD HH:mm:ss'),
          leftTime: LTime,
          rightTime: RTime,
          feedType: type,
          feedCapacity: 0
        }
        cloudAPI.uploadHistory(params).then(res => {
          this.sendHistoryACK()
        }).catch(res => {
          this.sendHistoryFail()
        })
      },
      updateBabyInfo() {
        const curBabyId = cloudAPI.getCurUserID()
        if (curBabyId != 0) {
          const babyData = cloudAPI.getUserById(curBabyId)
          if (babyData != null) this.setData({ curBabyName: babyData.username.slice(0, 3) })
        }
      },
      ///////////////////////////////////////////////////////
      checkSystemAuthorize() {
        let that = this
        wx.getSetting({
            success (res) {
                let isSystemBLEAuthorize = that.data.isSystemBLEAuthorize
                let isSystemLocationAuthorize = that.data.isSystemLocationAuthorize
                if (res.authSetting['scope.bluetooth'] != undefined) isSystemBLEAuthorize = res.authSetting['scope.bluetooth']
                if (res.authSetting['scope.userLocation'] != undefined) isSystemLocationAuthorize = res.authSetting['scope.userLocation']
                that.setData({
                    isSystemBLEAuthorize: isSystemBLEAuthorize,
                    isSystemLocationAuthorize: isSystemLocationAuthorize,
                    isGetAuthorizeSuccess: true
                })
                console.log('lmn>>> 检查权限成功')
                that.onBlueAuthorizeChange({enable: isSystemBLEAuthorize})
            },
            fail (res) {
                console.log('lmn>>> 检查权限失败')
            }
        })
      },
      checkAuthorizeAndConnect() {
        let that = this
        if (!this.data.isSystemBLEAuthorize) {
          // Dialog.confirm({
          //   title: '蓝牙权限未开启',
          //   message: '“美的美居Lite”想要开启您的蓝牙功能，用于手机蓝牙控制设备',
          //   confirmButtonText: '去开启'
          // })
          // .then((res) => {
          //   if (res.action == 'confirm') {
          //     that.getBLEAuthorize()
          //   }
          // })
          // .catch(() => {
          //   if (error.action == 'cancel') {
          //   }
          // });
          wx.showModal({
            title: '蓝牙权限未开启',
            content: '“美的美居”想要开启您的蓝牙权限，用于手机蓝牙控制设备',
            confirmColor: '#267AFF',
            cancelColor: '#267AFF',
            confirmText: '去开启',
            cancelText: '取消',
            success (res) {
              if (res.confirm) {
                that.getBLEAuthorize()
              }
            }
          })
          return
        }
        if (!this.data.isSystemLocationAuthorize) {
          // Dialog.confirm({
          //   title: '位置权限未开启',
          //   message: '“美的美居Lite”想要开启您的定位权限，用于手机蓝牙控制设备',
          //   confirmButtonText: '去开启'
          // })
          // .then((res) => {
          //   if (res.action == 'confirm') {
          //     that.getLocationAuthorize()
          //   }
          // })
          // .catch(() => {
          //   if (error.action == 'cancel') {
          //   }
          // });
          wx.showModal({
            title: '位置权限未开启',
            content: '“美的美居”想要开启您的定位权限，用于手机蓝牙控制设备',
            confirmColor: '#267AFF',
            cancelColor: '#267AFF',
            confirmText: '去开启',
            cancelText: '取消',
            success (res) {
              if (res.confirm) {
                that.getLocationAuthorize()
              }
            }
          })
          return
        }
        this.checkSystemOnOff()
        if (!this.data.isSystemBLEOpen || !this.data.isSystemLocationOpen) {
          Dialog.alert({
            message: '请开启手机蓝牙及定位功能后再试',
            confirmButtonText: '我知道了'
          }).then(() => {
          });
          return
        }
        this.blueToothConnect()
      },
      getBLEAuthorize() {
        let that = this
        wx.getSetting({
            success(res) {
              //判断是否有scope.bluetooth属性
              if (res.authSetting.hasOwnProperty('scope.bluetooth')) {
                if (!res.authSetting['scope.bluetooth']) {
                  //弹窗授权
                  wx.openSetting({
                    success(res) {
                        that.checkSystemAuthorize()
                    }
                  })
                }
              } else {
                //scope.bluetooth属性不存在,需要授权
                wx.authorize({
                    scope: 'scope.bluetooth',
                    success(res) {
                        that.checkSystemAuthorize()
                    }
                })
              }
            }
        })
      },
      getLocationAuthorize() {
        let that = this
        wx.getSetting({
            success(res) {
              //判断是否有scope.userLocation属性
              if (res.authSetting.hasOwnProperty('scope.userLocation')) {
                if (!res.authSetting['scope.userLocation']) {
                  //弹窗授权
                  wx.openSetting({
                    success(res) {
                        that.checkSystemAuthorize()
                    }
                  })
                }
              } else {
                //scope.userLocation属性不存在,需要授权
                wx.authorize({
                    scope: 'scope.userLocation',
                    success(res) {
                        that.checkSystemAuthorize()
                    }
                })
              }
            }
        })
      },
      checkSystemOnOff() {
        let that = this
        wx.getSystemInfo({
            success (res) {
                let isSystemBLEOpen = false
                let isSystemLocationOpen = false
                if (res.bluetoothEnabled != undefined) isSystemBLEOpen = res.bluetoothEnabled
                if (res.locationEnabled != undefined) isSystemLocationOpen = res.locationEnabled
                that.setData({
                    isSystemBLEOpen: isSystemBLEOpen,
                    isSystemLocationOpen: isSystemLocationOpen,
                    isNeedCheckSystemOnOff: !isSystemBLEOpen
                })
            }
        })
      },
      /****************蓝牙 start*****************/
      blueToothInit() {
        if (this.data.isBlueToothReady) return
        let that = this
        // 打开蓝牙
        bluetooth.open().then((res) => {
          this.setData({isBlueToothReady: true})
        }).catch((err) => {
          this.setData({isBlueToothReady: false})
        });

        // 监听连接状态改变
        this.registerBLEConnectionStateChange(res => {
          if (!res.connected) { // 断开
            this.clearDataAfterBlueFail()
            wx.getBluetoothAdapterState({
              success (res) {
                if (!res.available) { // 已连接后被关了手机蓝牙
                  that.setData({
                    isBlueToothReady: false,
                    isSystemBLEOpen: false,
                    isNeedCheckSystemOnOff: true
                  })
                }
              }
            })
          }
          console.log('lmn>>> BLEConnectionStateChange res=' +JSON.stringify(res))
        })

        // 监听校验绑定成功
        this.resisterOnBlebindSuccess(res => {
          const nowVal = new Date().valueOf()
          console.log('lmn>>>蓝牙连接耗时:', `搜索耗时=${this.data.btScanFinishTime - this.data.btConnectStartTime}ms，总耗时=${nowVal - this.data.btConnectStartTime}ms`)
          // 蓝牙已连接
          // 为去抖动，延时一段时间再显示连接成功(模组配网状态下连上后会马上断开)
          let timeout = setTimeout(() => {
            that.setData({
              BlueToothStatus: 2,
              btConnectTimeout: null,
              isClickBlueConnect: false
            })
            command.setIsConnected(true)
            that.sendQuery()
            that.startQueryLooping()
          }, 1000)
          this.setData({btConnectTimeout: timeout})
          console.log('lmn>>> bleNegotiation success, connected');

          // 监听数据接收
          this.resisterBleDataChanged((data, characteristic) => {
            this.registerBleData(data, characteristic, this)
          });

          this.getBLEDeviceServices(this.data.deviceMacConnect, 'FF90');
        })
        
        // 蓝牙连接失败
        this.resisterOnBlebindFail((error) => {
          console.log('lmn>>> ble bind error, connect fail', error);
          this.clearDataAfterBlueFail()
        })

        // 蓝牙连接失败
        this.resisterOnBleNegFail((error) => {
          console.log('lmn>>> ble negotiation error, connect fail', error);
          this.clearDataAfterBlueFail()
        })
      },
      // 蓝牙连接失败或断开后，清除数据
      clearDataAfterBlueFail() {
        console.log('lmn>>>', '清理连接数据')
        if(this.data.btConnectTimeout != null) {
          clearTimeout(this.data.btConnectTimeout)
        }
        if (this.data.isClickBlueConnect) {
          this.setData({
            BlueToothStatus: 0,
            btConnectTimeout: null,
            isClickBlueConnect: false,
            status: {},
            isHadNew: true
          })
        } else {
          this.setData({
            BlueToothStatus: 3,
            btConnectTimeout: null,
            status: {},
            isHadNew: true
          })
        }
        command.setIsConnected(false)
        this.closeBLEConnection()
        this.clearBlueData()
        setTimeout(() => {
          if (this.data.isPageShow) {
            console.log('lmn>>>', '清理后尝试重新连接')
            this.checkAuthorizeAndConnect()
          }
        }, 3000);
      },
      // 蓝牙重连前，清除ble-negotiation的状态数据
      clearBlueData() {
        this.setData({
          progress: 0,
          isEndon: false,
          connected: false,
          currentOrder: ''
        })
      },
      // 蓝牙权限改变
      onBlueAuthorizeChange(authorize) {
        if (authorize.enable) {
          console.log('lmn>>> 蓝牙权限开启')
          if (!this.data.isLastTimeBlueEnable) {
            this.blueToothInit()
            this.checkAuthorizeAndConnect()
          }
          this.setData({isLastTimeBlueEnable: true})
        } else {
          console.log('lmn>>> 蓝牙权限禁止')
          if (this.data.isLastTimeBlueEnable) {
            this.clearDataAfterBlueFail()
          }
          this.setData({
            isBlueToothReady: false,
            isLastTimeBlueEnable: false
          })
        }
      },
      async blueToothConnect() {
        if (this.data.BlueToothStatus === 2) {
          return
        }
        await this.blueToothInit()
        console.log('lmn>>> bluetooth connect start');
        this.setData({
          BlueToothStatus: 1,
          isClickBlueConnect: true,
          btConnectStartTime: new Date().valueOf()
        })
        command.setIsConnected(false)

        let that = this
        // 监听搜索到目标设备时回调
        bluetooth.resisterFindedTargetDevice(this.data.deviceInfoMS.btMac, (info) => {
          console.log('lmn>>> 目标设备 info=' + JSON.stringify(info));
          if (info.deviceId != null) {
            that.setData({
              deviceMacConnect: info.deviceId,
              btScanFinishTime: new Date().valueOf()
            })
            // 连接蓝牙
            that.bleNegotiation(info.deviceId, true, 1, 3)
          } else {
            if (that.data.isClickBlueConnect) {
              that.setData({
                BlueToothStatus: 0, 
                isClickBlueConnect: false
              })
            } else {
              that.setData({BlueToothStatus: 3})
            }
            command.setIsConnected(false)
            if (info.errCode == 10000) { // 蓝牙适配器未初始化
              that.setData({isBlueToothReady: false})
            }
            setTimeout(() => {
              if (that.data.isPageShow && (that.data.BlueToothStatus == 0 || that.data.BlueToothStatus == 3) ) {
                console.log('lmn>>>', '重新搜索连接')
                that.checkAuthorizeAndConnect()
              }
            }, 3000);
          }
        })
        // 搜索设备
        console.log('lmn>>> discoverying device:' + that.data.deviceInfoMS.btMac);
        await bluetooth.discoveryDevice();
      },
      blueToothDisconnect() {
        this.closeBLEConnection()
      },
      registerBleData(data, characteristic, context) {
        let that = context;
        if (!characteristic.serviceId.includes("FF80")) {
          let parsedData = paesrBleResponData(data, app.globalData.bleSessionSecret);
          let jsonStatus = command.bin2json(parsedData)
          console.log('lmn>>> rece BLE data=' + parsedData + '/json=' + JSON.stringify(jsonStatus));
          if (jsonStatus.report_command != undefined) {
            if (jsonStatus.report_command == 'report_state_data') {
              let statusTemp = that.data.status
              Object.assign(statusTemp, jsonStatus)
              that.setData({
                status: statusTemp,
                isHadNew: true
              })
              that.updateView()
            } else if (jsonStatus.report_command == 'ack_synchronization_historical_data') {
              console.log('lmn>>>收到历史上报:', parsedData)
              const histData = jsonStatus.historical_data
              if (histData.historicalDataSeq < 0xFF) {
                that.uploadHistory(histData)
              } else {
                that.setData({
                  syncHisLock: false
                })
                console.log('lmn>>>', '同步历史结束')
                that.queryCloudHistory()
                that.sendTimeSync()
              }
            }
            if (!that.data.hadTryAutoSyncHis && !that.data.syncHisLock && cloudAPI.getCurUserID() != 0) {
              console.log('lmn>>>', '开始同步历史(自动)')
              that.setData({
                syncHisLock: true,
                hadTryAutoSyncHis: true
              })
              that.sendHistoryReq()
            }
          }
        }
      },
      sendBLEBinData(order) {
        console.log('lmn>>> send BLE data=' + order);
        let parsedData = constructionBleControlOrder(order, app.globalData.bleSessionSecret);
        this.data.currentOrder = ab2hex(parsedData);
        this.getBLEDeviceServices(this.data.deviceMacConnect, 'FF90');
      },
      /****************蓝牙 end******************/
      startCheckSysOnOffTimer() {
        clearInterval(this.data.checkSysOnOffTimer)
        let timer = setInterval(() => {
          if (!this.data.isNeedCheckSystemOnOff) return
          console.log('lmn>>>', '检查蓝牙开关')
          const lastBleOnOff = this.data.isSystemBLEOpen
          this.checkSystemOnOff()
          if (this.data.isSystemBLEOpen  && !lastBleOnOff) {
            console.log('lmn>>>', '蓝牙开启，重新连接')
            this.checkAuthorizeAndConnect()
          }
        }, 5000);
        this.setData({
          checkSysOnOffTimer: timer
        })
      }
    },
    lifetimes: {
      attached: function() {
        this.setData({deviceInfoMS: this.data.devInfo})
        console.log('lmn>>>info=', JSON.stringify(this.data.deviceInfoMS))
        let curName = this.data.deviceName
        if (this.data.deviceInfoMS.name) {
          curName = this.data.deviceInfoMS.name
        }
        this.setData({
          isPageShow: true,
          sliderValue: 1,
          deviceName: curName
        })

        this.checkSystemAuthorize();

        console.log('lmn>>>applianceCode=', this.data.deviceInfoMS.applianceCode)
        command.initDeviceTimerLocal(this.data.deviceInfoMS.applianceCode)

        cloudAPI.setMSInfo(this.data.deviceInfoMS.applianceCode, app.globalData.userData.iotUserId)
        cloudAPI.queryUserList().then(res => {
          if (cloudAPI.getLocalUserList().length == 0) {
            wx.navigateTo({ url: "../card_M0200003/babyAdd/babyAdd?isNewUser=1" })
          } else {
            this.updateBabyInfo()
          }
        }).catch(err => {
          Toast('获取用户列表失败')
        })
      },
      detached: function() {
        this.setData({ isPageShow: false })
        if (this.data.BlueToothStatus == 2) {
          this.closeBLEConnection()
        }
        clearInterval(this.data.queryTimer)
        clearTimeout(this.data.btConnectTimeout)
        clearInterval(this.data.checkSysOnOffTimer)
        this.setData({
          queryTimer: null,
          checkSysOnOffTimer: null,
          btConnectTimeout: null,
          BlueToothStatus: 3
        })
        command.setIsConnected(false)
        console.log('lmn>>>', '退出清理')
      }
    },
    pageLifetimes: {
      show: function() {
        this.updateBabyInfo()
        this.queryCloudHistory()
        this.startCheckSysOnOffTimer()
        this.updateMonAndBottleFeed()
      }
    }
  })