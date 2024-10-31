// plugin/T0x13/card_79009833/card_79009833.js
const app = getApp()
const pluginMixin = require('../../../../../utils/plugin-mixin')
const bleService = require('../../../../../utils/ble/ble-negotiation')
const {
        constructionBleOrder,
        paesrBleResponData
} = require('../../../../../utils/ble/ble-order')
import {
        getReqId,
        getStamp,
        ab2hex
} from 'm-utilsdk/index'
import { addDeviceSDK } from '../../../../../utils/addDeviceSDK'
import {
        requestService
} from '../../../../../utils/requestService'
import { imgBaseUrl } from '../../../../../api'

Component({
        pageLifetimes: {
                show: function() {
                  // 页面被展示
                  if (this.data.isConnecting) {
                        this.clearTimer()
                        wx.closeBluetoothAdapter()
                        this.reconnect()
                  }
                },
                hide: function() {
                  // 页面被隐藏
                },
                resize: function(size) {
                  // 页面尺寸变化
                }
        },
        lifetimes: {
                attached: function () {
                        // 在组件实例进入页面节点树时执行
                        try {
                                var value = wx.getStorageSync('isHideWifiNotice')
                                if (value) {
                                    console.log('找到缓存', value)
                                    // Do something with return value
                                    let nowstamp = Date.parse(new Date()); //拿到现在时间
                                    //进行时间比较
                                    if (value < nowstamp) {
                                        //清空缓存
                                        wx.removeStorage({
                                            key: 'isHideWifiNotice',
                                            success: (res) => {
                                                console.log("缓存已过期");
                                                this.setData({
                                                    isHideNotice: false
                                                })
                                            }
                                        })
                                    } else {
                                        this.setData({
                                            isHideNotice: true
                                        })
                                    }
                                }
                            } catch (e) {
                                // Do something when catch error
                                console.log('找不到缓存', e)
                                this.setData({
                                    isHideNotice: false
                                })
                            }
                },
                ready: function () {
                        console.log('传到组件的数据', this.properties)
                        console.log('此时的数据', this.data)
                        // 在组件在视图层布局完成后执行
                        // 监听手机蓝牙状态
                        wx.onBluetoothAdapterStateChange((res) => {
                                console.log('手机蓝牙状态变更', res.available)
                                if (res.available) {
                                        this.setData({
                                                phoneBle: res.available
                                        })
                                } else {
                                        this.bleClose()
                                }
                        })
                        // 获取手机系统参数
                        wx.getSystemInfoAsync({
                                success: (result) => {
                                        console.log('手机系统参数', result)
                                        this.setData({
                                                systemInfo: result
                                        })
                                },
                        })
                        console.log('传到组件的数据', this.data.loadPageData)
                        // 重置有问题的bindtype
                        this.handleWrongBindType()
                        // 首次进入默认操作
                        this.defaultOpenPage()
                },
                detached: function () {
                        try {
                                // 在组件实例被从页面节点树移除时执行
                                this.clearTimer()
                                // 注销蓝牙监听
                                let finishApp = function () {
                                        console.log('插件销毁')
                                }
                                this.registerBLEConnectionStateChange(finishApp)
                                wx.offBluetoothAdapterStateChange()
                                wx.offBluetoothDeviceFound()
                                // 关闭蓝牙连接
                                wx.closeBLEConnection({
                                        deviceId: this.data.deviceInfo.deviceId
                                })
                                // 关闭蓝牙模块
                                wx.closeBluetoothAdapter()
                        } catch (e) {
                                console.log(e)
                        }
                },
        },
        behaviors: [pluginMixin, bleService],
        /**
         * 组件的属性列表
         */
        properties: {
                loadPageData: {
                        type: Object,
                        value: {
                                info: '默认值'
                        },
                        observer: function (info) {
                                console.log('监听到传过来的信息', info)
                        }
                }
        },


        /**
         * 组件的初始数据
         */
        data: {
                hideNotice: false,
                imgUrl: imgBaseUrl.url + '/plugin/0x13/',
                isHideNotice: false, // 是否隐藏警告通知
                isFakeWifi: false, // wifi后蓝牙直连
                isNeedBle: false, // 是否需要蓝牙
                phoneBle: false, // 手机蓝牙打开状态
                isBLEAlarming: false, // 是否正在发起蓝牙状态警报
                isConnecting: false, // 是否正在连接蓝牙
                connectDisrupted: false, // 蓝牙是否断开
                connectFailed: false, // 蓝牙是否连接失败
                deviceStatus: {
                        power: 'off'
                }, // 设备状态
                netTitle: '未连接网络', // 连接类型标题
                statusTitle: '', // 设备状态标题
                timer: {}, // 计时器
                systemInfo: {}, // 手机系统信息
                showPicker: false, // 打开/关闭picker
                // 场景组件渲染参数
                scene: [{
                                icon: imgBaseUrl.url + '/plugin/0x13/' + 'outdoor.png',
                                active: imgBaseUrl.url + '/plugin/0x13/' + 'outdoor_opacity.png',
                                title: '户外',
                                mark: 'life'
                        }, {
                                icon: imgBaseUrl.url + '/plugin/0x13/' + 'warm.png',
                                active: imgBaseUrl.url + '/plugin/0x13/' + 'warm_opacity.png',
                                title: '温馨',
                                mark: 'read'
                        }, {
                                icon: imgBaseUrl.url + '/plugin/0x13/' + 'evening.png',
                                active: imgBaseUrl.url + '/plugin/0x13/' + 'evening_opacity.png',
                                title: '夜灯',
                                mark: 'light'
                        }, {
                                icon: imgBaseUrl.url + '/plugin/0x13/' + 'natural.png',
                                active: imgBaseUrl.url + '/plugin/0x13/' + 'natural_opacity.png',
                                title: '自然',
                                mark: 'mild'
                        }, {
                                icon: imgBaseUrl.url + '/plugin/0x13/' + 'save.png',
                                active: imgBaseUrl.url + '/plugin/0x13/' + 'save_opacity.png',
                                title: '节能',
                                mark: 'film'
                }],
                // 功能组件渲染参数
                functionList: [{
                                icon: imgBaseUrl.url + '/plugin/0x13/' + 'delay.png',
                                title: '延时关',
                                desc: '',
                                check: false,
                }],
        },

        observers: {
                'deviceStatus.power': function (OnOff) {
                        console.log('监听设备开关', this.data.loadPageData, OnOff)
                        if (OnOff !== 'on' && this.data.loadPageData.onlineStatus == '1') {
                                this.setData({
                                        statusTitle: '已关灯'
                                })
                        }
                },

                'loadPageData.onlineStatus': function (status) {
                        console.log('监听在线状态', this.data.loadPageData, status)
                        if (status == '0') {
                                this.setData({
                                        statusTitle: '设备离线',
                                        netTitle: '未连接网络'
                                })
                        } else {
                                if (this.data.loadPageData.bindType == 2) {
                                        this.setData({
                                                netTitle: '已wifi连接'
                                        })
                                } else {
                                        this.setData({
                                                netTitle: '已连接手机蓝牙'
                                        })
                                }
                        }
                },

                'phoneBle': function (OnOff) {
                        console.log('监听手机蓝牙状态', this.data.loadPageData, OnOff)
                        if (!this.data.isBLEAlarming && !OnOff && this.data.isNeedBle) {
                                this.setData({
                                        isBLEAlarming: true
                                }, () => {
                                        wx.showModal({
                                                content: '“美的美居Lite”想要开启您的蓝牙功能',
                                                showCancel: false,
                                                confirmColor: '#267AFF',
                                                cancelColor: '#267AFF',
                                                confirmText: '我知道了',
                                                success: (res) => {
                                                        if (res.confirm) {
                                                                this.setData({
                                                                        isBLEAlarming: false,
                                                                        isConnecting: false
                                                                })
                                                        } else if (res.cancel) {
                                                                this.setData({
                                                                        isBLEAlarming: false,
                                                                        isConnecting: false
                                                                })
                                                        }
                                                }
                                        })
                                })
                        }
                }
        },

        /**
         * 组件的方法列表
         */
        methods: {
                hideNotice() {
                        this.setData({
                            isHideNotice: true
                        })
                        let timestamp = new Date().getTime() + (5 * 60 * 1000)
                        wx.setStorageSync("isHideWifiNotice", timestamp)
                },

                goToWifiConnect() {
                        console.log('蓝牙进入连接wifi')
                        this.connectDisruptClear()
                        wx.offBLEConnectionStateChange()
                        this.connectWifi()
                },

                connectWifi() {
                        console.log('前往wifi连接页')
                        wx.closeBLEConnection({
                            deviceId: this.data.deviceInfo.deviceId,
                            success: () => {
                                addDeviceSDK.msmartLiteBlueAfterLinkNet({
                                    type: '13',
                                    sn8: '79009833',
                                    deviceId: this.data.deviceInfo.deviceId, //蓝牙id
                                    deviceName: this.data.loadPageData.name, //设备名字
                                    deviceImg: this.data.loadPageData.deviceImg, //设备图片
                                })
                            },
                            fail: () => {
                                console.log('蓝牙断开失败')
                                addDeviceSDK.msmartLiteBlueAfterLinkNet({
                                    type: '13',
                                    sn8: '79009833',
                                    deviceId: this.data.deviceInfo.deviceId, //蓝牙id
                                    deviceName: this.data.loadPageData.name, //设备名字
                                    deviceImg: this.data.loadPageData.deviceImg, //设备图片
                                })
                            }
                        })
                },

                // 清除计时器
                clearTimer() {
                        clearTimeout(this.data.timer)
                        this.setData({
                                timer: null
                        })
                },
                // 蓝牙关闭
                bleClose() {
                        if (this.data.loadPageData.bindType !== 2 || (this.data.loadPageData.bindType === 2 && this.data.loadPageData.onlineStatus === '0')) {
                                this.setData({
                                        phoneBle: false,
                                        'loadPageData.onlineStatus': '0',
                                        isConnecting: false
                                })
                        }
                },
                // lua控制
                luaControl(param) {
                        return new Promise((resolve, reject) => {
                                wx.showNavigationBarLoading()
                                let reqData = {
                                        "reqId": getReqId(),
                                        "stamp": getStamp(),
                                        "applianceCode": this.data.loadPageData.applianceCode,
                                        "command": {
                                                "control": param
                                        }
                                }
                                requestService.request("luaControl", reqData).then((resp) => {
                                        wx.hideNavigationBarLoading()
                                        if (resp.data.code === '0') {
                                                resolve(resp.data.data.status || {})
                                        } else {
                                                reject(resp)
                                        }
                                }, (error) => {
                                        wx.hideNavigationBarLoading()
                                        wx.showToast({
                                                title: '设备未响应，请稍后尝试刷新',
                                                icon: 'none',
                                                duration: 2000
                                        })
                                        console.error(error)
                                        reject(error)
                                })
                        })
                },
                // lua查询
                luaQuery() {
                        return new Promise((resolve, reject) => {
                                wx.showNavigationBarLoading()
                                let reqData = {
                                        "reqId": getReqId(),
                                        "stamp": getStamp(),
                                        "applianceCode": this.data.loadPageData.applianceCode,
                                        "command": {}
                                }
                                requestService.request("luaGet", reqData).then((resp) => {
                                        wx.hideNavigationBarLoading()
                                        if (resp.data.code === '0') {
                                                resolve(resp.data.data || {})
                                        } else {
                                                reject(resp)
                                        }
                                }, (error) => {
                                        wx.hideNavigationBarLoading()
                                        console.error(error)
                                        reject(error)
                                })
                        })
                },
                // 蓝牙获取数据
                getStatusByBle() {
                        return new Promise((resolve, reject) => {
                                let order = '24'
                                let data1 = '00'
                                let data2 = '00'
                                let data3 = '00'
                                let data4 = '00'
                                let body = order + data1 + data2 + data3 + data4
                                let type = 0x03
                                this.gen2wriOrder(type, body, '9').then(res => {
                                        resolve(true)
                                }).catch(err => {
                                        reject(false)
                                })
                        })
                },
                // 获取状态
                getDeviceStatus() {
                        if (this.data.loadPageData.bindType === 3) {
                                this.getStatusByBle().catch(err => {
                                        this.setData({
                                                'deviceStatus.power': 'off',
                                                'loadPageData.onlineStatus': '0'
                                        })
                                })
                        } else {
                                this.luaQuery().then(data => {
                                        this.initPage(data)
                                }).catch(err => {
                                        this.setData({
                                                'deviceStatus.power': 'off',
                                                'loadPageData.onlineStatus': '0'
                                        })
                                })
                        }
                },
                // 设备状态数据装载页面
                initPage(data) {
                        console.log('装载数据', data)
                        return new Promise((resolve, reject) => {
                                let time = data.delay_light_off
                                this.setData({
                                        'deviceStatus.power': data.power,
                                        'deviceStatus.brightness': data.brightness,
                                        'deviceStatus.color_temperature': data.color_temperature,
                                        'functionList[0].desc': time == '0' ? '' : '将在' + time + '分钟后关闭',
                                        'functionList[0].check': time != '0'
                                })
                                setTimeout(() => {
                                        let delay = this.selectComponent("#delay")
                                        try {
                                                delay.makePointAction()
                                        } catch (e) {
                                                console.log('延时按钮动画失效', e)
                                        }
                                }, 800);
                                resolve('ok')
                        })
                },
                // 生成指令并发送指令
                gen2wriOrder(messageType, readyCode, writeType) {
                        return new Promise((resolve, reject) => {
                                let pre = 'aa0f13000000000000' + (messageType.toString().length === 1 ? '0' + messageType.toString() : messageType.toString())
                                let last = this.getcheckCode((pre + readyCode))
                                let orderCode = pre + readyCode + last
                                console.log('原始命令', orderCode)
                                let order = constructionBleOrder(0x02, orderCode, app.globalData.bleSessionSecret).buffer
                                console.log('order', order)
                                wx.getBLEDeviceServices({
                                        deviceId: this.data.deviceInfo.deviceId,
                                        success: service => {
                                                for (let i = 0; i < service.services.length; i++) {
                                                        let serviceType = 'FF' + writeType + '0'
                                                        if (service.services[i].isPrimary && service.services[i].uuid.includes(serviceType)) {
                                                                let serviceId = service.services[i].uuid
                                                                wx.getBLEDeviceCharacteristics({
                                                                        deviceId: this.data.deviceInfo.deviceId,
                                                                        serviceId,
                                                                        success: (character) => {
                                                                                let characterTypeDown = 'FF' + writeType + '1'
                                                                                let characterTypeUp = 'FF' + writeType + '2'
                                                                                console.log('蓝牙服务特征',character)
                                                                                for (let i = 0; i < character.characteristics.length; i++) {
                                                                                        let item = character.characteristics[i]
                                                                                        if (item.properties.write) {
                                                                                                if (item.uuid.includes(characterTypeDown)) { //FF91：直连下发特性
                                                                                                        let characteristicIdDown = item.uuid
                                                                                                        wx.writeBLECharacteristicValue({
                                                                                                                characteristicId: characteristicIdDown,
                                                                                                                deviceId: this.data.deviceInfo.deviceId,
                                                                                                                serviceId: serviceId,
                                                                                                                value: order,
                                                                                                                success: (write) => {
                                                                                                                        console.log('发送成功', write)
                                                                                                                        resolve(true)
                                                                                                                },
                                                                                                                fail: (err) => {
                                                                                                                        console.log('发送失败', err)
                                                                                                                        resolve(false)
                                                                                                                }
                                                                                                        })
                                                                                                }
                                                                                        }
                                                                                        if ((item.properties.notify || item.properties.indicate) && item.uuid.includes(characterTypeUp)) { //FF92：直连上行特性
                                                                                                wx.notifyBLECharacteristicValueChange({
                                                                                                        deviceId: this.data.deviceInfo.deviceId,
                                                                                                        serviceId: serviceId,
                                                                                                        characteristicId: item.uuid,
                                                                                                        state: true,
                                                                                                        success: (res) => {
                                                                                                                console.log('notifyBLECharacteristicValueChange success', res)
                                                                                                        }
                                                                                                })
                                                                                        }
                                                                                }
                                                                        }
                                                                })
                                                        }
                                                }
                                        }
                                })
                        })
                },
                // 生成指令末位校验码
                getcheckCode(code) {
                        let arr = []
                        for (var i = 2; i < code.length;) {
                                arr.push(parseInt(code.substr(i, 2), 16))
                                i = i + 2
                        }
                        let total = arr.reduce((acc, cur) => {
                                return acc + cur
                        }, 0).toString(2)
                        if (total.length < 8) {
                                for (var i = 0; i <= (8 - total.length);) {
                                        total = '0' + total
                                        i = i + 1
                                }
                        }
                        let code2 = ''
                        for (var i = 0; i < total.length;) {
                                if (total.substr(i, 1) === '0') {
                                        code2 = code2 + '1'
                                } else {
                                        code2 = code2 + '0'
                                }
                                i = i + 1
                        }
                        return (parseInt(code2, 2) + 1).toString(16)
                },
                // 开关灯操作
                powerToggle: function (e) {
                        console.log('powerToggle')
                        console.log('当前开关状态', this.data.deviceStatus.power)
                        if (this.data.loadPageData.bindType === 2) {
                                this.luaControl({
                                        "power": this.data.deviceStatus.power === "off" ? "on" : "off"
                                }).then((data) => {
                                        console.log('lua结果', data)
                                        if (data.result === '0' || data.result === '1') {
                                                this.luaQuery().then(data => {
                                                        this.initPage(data)
                                                })
                                                console.log('开关状态已变更', this.data.deviceStatus.power)
                                        }
                                })
                        } else {
                                console.log(this.data.deviceStatus.power)
                                let order = '01'
                                let data1 = this.data.deviceStatus.power === "off" ? "01" : "00"
                                let data2 = '00'
                                let data3 = '00'
                                let data4 = '00'
                                let body = order + data1 + data2 + data3 + data4
                                let type = 0x02
                                this.gen2wriOrder(type, body, '9')
                        }
                },
                // 调节条操作
                sliderChange(e) {
                        if (this.data.loadPageData.bindType === 2) {
                                if (e.detail.title === '亮度') {
                                        if (e.detail.value > 252) {
                                                e.detail.value = 252
                                        }
                                        this.luaControl({
                                                "brightness": 255 - e.detail.value
                                        }).then((data) => {
                                                if (data) {
                                                        this.luaQuery().then(data => {
                                                                this.initPage(data)
                                                        })
                                                }
                                        })
                                } else {
                                        this.luaControl({
                                                "color_temperature": e.detail.value
                                        }).then((data) => {
                                                if (data) {
                                                        this.luaQuery().then(data => {
                                                                this.initPage(data)
                                                        })
                                                }
                                        })
                                }
                        } else {
                                if (e.detail.title === '亮度') {
                                        let order = '04'
                                        if (e.detail.value > 252) {
                                                e.detail.value = 252
                                        }
                                        let data1 = (255 - e.detail.value) < 10 ? ('0' + (255 - e.detail.value).toString(16)) : (255 - e.detail.value).toString(16)
                                        let data2 = '00'
                                        let data3 = '00'
                                        let data4 = '00'
                                        let body = order + data1 + data2 + data3 + data4
                                        let type = 0x02
                                        this.gen2wriOrder(type, body, '9')
                                } else {
                                        let order = '03'
                                        let data1 = e.detail.value < 10 ? ('0' + e.detail.value.toString(16)) : e.detail.value.toString(16)
                                        let data2 = '00'
                                        let data3 = '00'
                                        let data4 = '00'
                                        let body = order + data1 + data2 + data3 + data4
                                        let type = 0x02
                                        this.gen2wriOrder(type, body, '9')
                                }
                        }
                },
                sliderDrag(e) {
                        if (e.detail.title === '亮度') {
                                if (e.detail.value > 252) {
                                        e.detail.value = 252
                                }
                                this.setData({
                                        'deviceStatus.brightness': 255 - e.detail.value
                                })
                        } else {
                                this.setData({
                                        'deviceStatus.color_temperature': e.detail.value
                                })
                        }
                },
                // 场景操作
                toggleSceneLed(e) {
                        console.log('sceneToggle')
                        console.log(e.detail.scene)
                        if (this.data.loadPageData.bindType === 2) {
                                this.luaControl({
                                        "scene_light": e.detail.scene,
                                }).then((data) => {
                                        console.log('lua控制结果', data)
                                        if (data.result) {
                                                this.luaQuery().then(data => {
                                                        this.initPage(data)
                                                })
                                                let scene = this.selectComponent("#scene")
                                                scene.updateChecked(data.scene_light)
                                        }
                                })
                        } else {
                                let order = '02'
                                let data1 = ''
                                switch (e.detail.scene) {
                                        case 'life':
                                                data1 = '02';
                                                break;
                                        case 'read':
                                                data1 = '03';
                                                break;
                                        case 'light':
                                                data1 = '06';
                                                break;
                                        case 'mild':
                                                data1 = '04';
                                                break;
                                        case 'film':
                                                data1 = '05';
                                                break;
                                }
                                let data2 = '01'
                                let data3 = '00'
                                let data4 = '00'
                                let body = order + data1 + data2 + data3 + data4
                                let type = 0x02
                                this.gen2wriOrder(type, body, '9')
                        }
                        let scene = this.selectComponent("#scene")
                        scene.updateChecked(e.detail.scene)
                        wx.showToast({
                                title: e.detail.title + '模式已开启',
                                icon: 'none',
                                duration: 2000
                        })
                },
                // 延时关操作
                toggleDelay(e) {
                        let params = e.detail.time
                        console.log('原始延时参数', params)
                        if (this.data.loadPageData.bindType === 2) {
                                this.luaControl({
                                        delay_light_off: params
                                }).then((data) => {
                                        console.log('lua控制结果', data)
                                        if (data) {
                                                this.luaQuery().then(data => {
                                                        this.initPage(data)
                                                })
                                        }
                                })
                        } else {
                                params = (params < 10) ? '0' + params : params
                                let order = '05'
                                let data1 = params.toString(16)
                                let data2 = '00'
                                let data3 = '00'
                                let data4 = '00'
                                let body = order + data1 + data2 + data3 + data4
                                let type = 0x02
                                this.gen2wriOrder(type, body, '9')
                        }
                },
                // 打开picker
                makePickerAction() {
                        this.setData({
                                showPicker: true
                        })
                        let picker = this.selectComponent("#timePicker")
                        picker.makePickerAction(true)
                },
                // 关闭picker
                pickerBack() {
                        this.setData({
                                showPicker: false
                        })
                },
                // 成功获取蓝牙上报数据
                getStatusSuccess(data) {
                        if (data.substr(0, 2) === 'a4') {
                                let statusBLE = {}
                                statusBLE.brightness = parseInt(data.substr(2, 2), 16)
                                statusBLE.color_temperature = parseInt(data.substr(4, 2), 16)
                                statusBLE.delay_light_off = parseInt(data.substr(8, 2), 16)
                                statusBLE.power = parseInt(data.substr(16, 2), 16) === 0 ? 'off' : 'on'
                                console.log('译出的蓝牙数据', statusBLE)
                                this.setData({
                                        'loadPageData.onlineStatus' : '1',
                                        deviceStatus: statusBLE
                                }, () => {
                                        this.initPage(statusBLE).then(res => {
                                                this.setData({
                                                        isConnecting: false
                                                })
                                        })
                                })
                                console.log('状态查询成功')
                        } else {
                                console.log('非状态查询 || 状态查询失败')
                        }
                },

                // 收到蓝牙上报集中处理
                getBleInfo(data, characteristic) {
                        console.log('注册事件收到的消息------data', data)
                        console.log('注册事件收到的消息------characteristic', characteristic)
                        let decode = paesrBleResponData(data, app.globalData.bleSessionSecret)
                        let getLen = decode.length - 20 - 2
                        let body = decode.substr(20, getLen)
                        console.log('消息体', body)
                        this.powerBLESuccess(body)
                        this.getStatusSuccess(body)
                        this.lightBrightnessSuccess(body)
                        this.lightTemperatureSuccess(body)
                        this.delaySuccess(body)
                        this.sceneSuccess(body)
                },

                // 成功获取开关灯蓝牙上报
                powerBLESuccess(data) {
                        if (data.substr(0, 2) === '81') {
                                console.log('开关控制成功')
                                this.getStatusByBle()
                        } else {
                                console.log('非开关控制 || 开关控制失败')
                        }
                },

                // 成功获取调节色温蓝牙上报
                lightTemperatureSuccess(data) {
                        if (data.substr(0, 2) === '83') {
                                console.log('色温控制成功')
                                this.getStatusByBle()
                        } else {
                                console.log('非色温控制 || 色温控制失败')
                        }
                },

                // 成功获取调节亮度蓝牙上报
                lightBrightnessSuccess(data) {
                        if (data.substr(0, 2) === '84') {
                                console.log('亮度控制成功')
                                this.getStatusByBle()
                        } else {
                                console.log('非亮度控制 || 亮度控制失败')
                        }
                },

                // 成功获取延时关蓝牙上报
                delaySuccess(data) {
                        if (data.substr(0, 2) === '85') {
                                console.log('延时控制成功')
                                this.getStatusByBle()
                        } else {
                                console.log('非延时控制 || 延时控制失败')
                        }
                },

                // 成功获取场景蓝牙上报
                sceneSuccess(data) {
                        if (data.substr(0, 2) === '85') {
                                console.log('场景控制成功')
                                this.getStatusByBle()
                        } else {
                                console.log('非场景控制 || 场景控制失败')
                        }
                },

                // 绑定类型为空时的手动变更
                handleWrongBindType() {
                        if (!this.data.loadPageData.bindType) {
                                this.data.loadPageData.bindType = 2
                        }
                        this.setData({
                                loadPageData: this.data.loadPageData,
                        })
                },

                // 首次进入页面进行默认操作
                defaultOpenPage() {
                        if (this.data.loadPageData.bindType === 2 && this.data.loadPageData.onlineStatus == 1) {
                                console.log('wifi绑定')
                                this.setData({
                                        isNeedBle: false
                                })
                                this.luaQuery().then(data => {
                                        this.initPage(data)
                                })
                        } else {
                                this.setData({
                                        isNeedBle: true
                                })
                                console.log('蓝牙绑定')
                                this.reconnect()
                        }
                },

                // 注册蓝牙回调
                resisterBLEevent() {
                        return new Promise((resolve, reject) => {
                                this.resisterOnBleNegFail((() => {this.connectFail()}))
                                this.resisterOnBlebindFail((() => {this.connectFail()}))
                                this.resisterOnBlebindSuccess((() => {this.afterNegotiation()}))
                                this.registerBLEConnectionStateChange(((res) => {this.connectDisrupt(res)}))
                                this.resisterBleDataChanged(((data, characteristic) => {this.getBleInfo(data, characteristic)}))
                                resolve('注册完成')
                        })
                },

                // 蓝牙连接失败处理
                connectFail() {
                        if (!this.data.connectFailed) {
                                console.log('连接失败')
                                this.setData({
                                        connectFailed: true,
                                        isConnecting: false
                                }, () => {
                                        wx.offBLEConnectionStateChange()
                                        wx.getBluetoothAdapterState({
                                                success: ble => {
                                                        console.log('蓝牙状态获取成功', ble)
                                                        if (ble.available) {
                                                                wx.showModal({
                                                                        title: '连接失败',
                                                                        content: '无法连接到设备，请进行如下操作：\n1. 检查设备是否已经通电\n2.尽量靠近设备，并重新连接',
                                                                        confirmText: '我知道了',
                                                                        cancelText: '重试',
                                                                        success: (res) => {
                                                                                if (res.confirm) {
                                                                                        console.log('用户点击我知道了')
                                                                                        this.setData({
                                                                                                isConnecting: false
                                                                                        })
                                                                                } else if (res.cancel) {
                                                                                        console.log('用户点击重试')
                                                                                        this.reconnect()
                                                                                }
                                                                        }
                                                                })
                                                        }
                                                },
                                                fail: err => {
                                                        console.log('蓝牙状态获取失败', err)
                                                }
                                        })
                                })
                        } else {
                                return
                        }
                },
                // 纯净的蓝牙断开
                connectDisruptClear() {
                        this.setData({
                                'loadPageData.onlineStatus': '0',
                                isEndon: false,
                                progress: 0
                        })
                },
                // 蓝牙断开处理
                connectDisrupt(res) {
                        if (res.connected) {
                                console.log('蓝牙连接打开', res)
                        } else {
                                this.setData({
                                        'loadPageData.onlineStatus': '0',
                                        isEndon: false,
                                        progress: 0
                                }, () => {
                                        wx.offBLEConnectionStateChange()
                                        wx.getBluetoothAdapterState({
                                                success: ble => {
                                                        console.log('蓝牙状态获取成功', ble)
                                                        if (ble.available) {
                                                                wx.showModal({
                                                                        title: '连接失败',
                                                                        content: '无法连接到设备，请进行如下操作：\n1. 检查设备是否已经通电\n2.尽量靠近设备，并重新连接',
                                                                        confirmText: '我知道了',
                                                                        cancelText: '重试',
                                                                        success: (res) => {
                                                                                if (res.confirm) {
                                                                                        console.log('用户点击我知道了')
                                                                                        this.setData({
                                                                                                isConnecting: false
                                                                                        })
                                                                                } else if (res.cancel) {
                                                                                        console.log('用户点击重试')
                                                                                        this.reconnect()
                                                                                }
                                                                        }
                                                                })
                                                        }
                                                },
                                                fail: err => {
                                                        console.log('蓝牙状态获取失败', err)
                                                }
                                        })
                                })
                        }
                },

                // 连接前检查蓝牙是否打开
                checkBLEOnOff() {
                        return new Promise((resolve, reject) => {
                                wx.openBluetoothAdapter({
                                        success: (res) => {
                                                this.setData({
                                                        phoneBle: true
                                                })
                                                resolve(true)
                                        },
                                        fail: (err) => {
                                                this.bleClose()
                                                reject(false)
                                        }
                                })
                        })
                },

                // 蓝牙连接
                bleConnect() {
                        this.checkBLEOnOff().then(data => {
                                console.log('蓝牙已打开，开始连接蓝牙并监听蓝牙状态')
                                console.log('设备信息', this.data.loadPageData)
                                this.setData({
                                        isConnecting: true
                                })
                                this.getNearBleDeviceId(this.data.loadPageData.btMac).then(mac => {
                                        console.log('外层获取的设备Id', mac)
                                        this.setData({
                                                deviceId: mac
                                        })
                                        this.bleNegotiation(mac, true, 1, 3)
                                }).catch(err => {
                                        console.log('获取id失败')
                                        this.connectFail()
                                })
                        }).catch(err => {
                                this.setData({
                                        phoneBle: false
                                })
                                console.log('蓝牙没打开')
                        })
                },

                // 重新连接
                reconnect() {
                        this.setData({
                                connectFailed: false,
                                'loadPageData.onlineStatus': '0',
                                isEndon: false,
                                progress: 0
                        }, () => {
                                this.resisterBLEevent().then(() => {
                                        this.bleConnect()
                                })
                        })
                },

                // 搜索附近设备，匹配蓝牙
                getNearBleDeviceId(mac) {``
                        console.log('开始寻找附近设备id')
                        let self = this
                        mac = self.getMac(mac, 'android')
                        return new Promise((r, j) => {
                                this.checkBLEOnOff().then(res => {
                                        console.log('搜索设备前', res)
                                        if (res) {
                                                wx.startBluetoothDevicesDiscovery({
                                                        allowDuplicatesKey: true,
                                                        success: (res) => {
                                                                //监听发现设备
                                                                clearTimeout(this.data.timer)
                                                                this.setData({
                                                                        timer: null
                                                                }, () => {
                                                                        this.data.timer = setTimeout(() => {
                                                                                console.log('定时器')
                                                                                wx.showModal({
                                                                                        title: '连接失败',
                                                                                        content: '无法连接到设备，请进行如下操作：\n1. 检查设备是否已经通电\n2.尽量靠近设备，并重新连接',
                                                                                        confirmText: '我知道了',
                                                                                        cancelText: '重试',
                                                                                        success: (res) => {
                                                                                                if (res.confirm) {
                                                                                                        console.log('用户点击我知道了')
                                                                                                        this.setData({
                                                                                                                isConnecting: false
                                                                                                        })
                                                                                                } else if (res.cancel) {
                                                                                                        console.log('用户点击重试')
                                                                                                        this.reconnect()
                                                                                                }
                                                                                        }
                                                                                })
                                                                                wx.offBluetoothDeviceFound(res => {
                                                                                        console.log('停止设备发现')
                                                                                })
                                                                        }, 60000);
                                                                })
                                                                wx.onBluetoothDeviceFound((res) => {
                                                                        console.log('需要发现的mac', mac)
                                                                        console.log('发现设备', res)
                                                                        res.devices.forEach(device => {
                                                                                let deviceMac = ''
                                                                                if (this.data.systemInfo.platform === 'ios') {
                                                                                        deviceMac = self.getMac(device.advertisData, 'ios')
                                                                                        console.log('ios下过滤出该发现设备mac', deviceMac)
                                                                                } else {
                                                                                        deviceMac = device.deviceId
                                                                                }
                                                                                if (deviceMac == mac) { //找到对应mac设备
                                                                                        console.log('找到mac设备', device.deviceId)
                                                                                        clearTimeout(this.data.timer)
                                                                                        this.setData({
                                                                                                timer: null
                                                                                        })
                                                                                        wx.offBluetoothDeviceFound(res => {
                                                                                                console.log('停止设备发现')
                                                                                        })
                                                                                        r(device.deviceId)
                                                                                }
                                                                        })
                                                                })
                                                        }
                                                })
                                        }
                                }).catch(err => {
                                        console.log('蓝牙检查失败')
                                })
                        })
                },

                // 获取mac
                getMac(advertisData, platform) {
                        console.log('过滤Mac', advertisData)
                        let a = ''
                        if (platform === 'ios') {
                                advertisData = ab2hex(advertisData)
                                console.log('getIosMacm advdata===', advertisData)
                                a = advertisData.substr(42, 12).toUpperCase();
                        } else {
                                console.log('安卓过滤Mac', advertisData)
                                a = advertisData.toUpperCase();
                        }
                        let b
                        let arr = []
                        for (let i = 0; i < a.length; i += 2) {
                                arr.push(a.substr(i, 2))
                        }
                        if (platform === 'ios') {
                                arr.reverse()
                        }
                        b = arr.join(":")
                        console.log('转码', b)
                        return b
                },

                // 协商成功
                afterNegotiation() {
                        console.log('协商完成')
                        if (this.data.loadPageData.bindType === 2) {
                                this.setData({
                                        isFakeWifi: true
                                })
                        }
                        this.setData({
                                'loadPageData.bindType' : 3
                        })
                        this.clearTimer()
                        this.getStatusByBle()
                },
        },

})
