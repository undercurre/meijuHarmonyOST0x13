
const pluginMixin = require('../../../../../utils/plugin-mixin')
import {
    imgBaseUrl
} from '../../../../../api'
import { luaQuery, luaControl } from '../utils/lua'

Component({
    options: {
        pureDataPattern: /^_/ // 指定所有 _ 开头的数据字段为纯数据字段
    },
    pageLifetimes: {
        show: function () {
            // 页面被展示
            if (this.data.isConnecting) {
                this.clearTimer()
                this.clearFakerMessagePusher();
                wx.closeBluetoothAdapter()
                this.reconnect()
            }
        },
        hide: function () {
            try {
                // 在组件实例被从页面节点树移除时执行
                this.clearTimer()
                this.clearFakerMessagePusher()
            } catch (e) {
                console.log(e)
            }
            // 页面被隐藏
        },
        resize: function (size) {
            // 页面尺寸变化
        }
    },
    lifetimes: {
        attached: function () {
            // 在组件实例进入页面节点树时执行
        },
        ready: function () {
            console.log('传到组件的数据', this.properties)
            console.log('此时的数据', this.data)
            // 在组件在视图层布局完成后执行
            this.fakerMessagePushTimer = setInterval(() => {
                luaQuery(this.data.loadPageData.applianceCode).then(data => {
                    this.data._deviceResDetail.power = data.power;
                    this.data._deviceResDetail.brightness = data.brightness;
                    this.data._deviceResDetail.color_temperature = data.color_temperature;
                    this.data._deviceResDetail.delay_light_off = data.delay_light_off;
                    this.initPage(data)
                })
            }, 60000)
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
            // 首次进入默认操作
            this.defaultOpenPage()
        },
        detached: function () {
            try {
                // 在组件实例被从页面节点树移除时执行
                this.clearTimer()
                this.clearFakerMessagePusher()
            } catch (e) {
                console.log(e)
            }
        },
    },
    behaviors: [pluginMixin],
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
        },
    },


    /**
     * 组件的初始数据
     */
    data: {
        imgUrl: imgBaseUrl.url + '/plugin/0x13/',
        deviceStatus: {
            power: 'off'
        }, // 设备状态
        _deviceResDetail: {
            power: "off",
            brightness: "255",
            color_temperature: "255",
            delay_light_off: "0"
        },
        netTitle: '未连接网络', // 连接类型标题
        statusTitle: '', // 设备状态标题
        timer: {}, // 计时器
        fakerMessagePushTimer: {},
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
            }
        },
    },

    /**
     * 组件的方法列表
     */
    methods: {
        // 清除计时器
        clearTimer() {
            clearTimeout(this.data.timer)
            this.setData({
                timer: null
            })
        },
        clearFakerMessagePusher() {
            clearInterval(this.data.fakerMessagePushTimer)
            this.setData({
                fakerMessagePushTimer: null
            })
        },
        // 设备状态数据装载页面
        initPage(data) {
            console.log('装载数据', data.brightness)
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
            }, 300);
        },
        // 开关灯操作
        powerToggle: function (e) {
            if (this.data.deviceStatus.power === "off") {
                luaControl({
                    "power": "on"
                }, this.data.loadPageData.applianceCode).then((data) => {
                    console.log('lua结果', data)
                    if (data.result === '0' || data.result === '1') {
                        luaQuery(this.data.loadPageData.applianceCode).then(data => {
                            this.data._deviceResDetail.power = data.power;
                            this.data._deviceResDetail.brightness = data.brightness;
                            this.data._deviceResDetail.color_temperature = data.color_temperature;
                            this.data._deviceResDetail.delay_light_off = data.delay_light_off;
                            this.initPage(data)
                        })
                    }
                })
            } else {
                this.data._deviceResDetail.power = "off"
                this.initPage(this.data._deviceResDetail)
                luaControl({
                    "power": "off"
                }, this.data.loadPageData.applianceCode)
            }
        },
        // 调节条操作
        sliderChange(e) {
            if (e.detail.title === '亮度') {
                this.data._deviceResDetail.brightness = 255 - e.detail.value
                this.initPage(this.data._deviceResDetail)
                if (e.detail.value > 252) {
                    e.detail.value = 252
                }
                luaControl({
                    "brightness": Math.floor((255 - e.detail.value) / 255 * 100)
                }, this.data.loadPageData.applianceCode)
            } else {
                this.data._deviceResDetail.color_temperature = e.detail.value
                this.initPage(this.data._deviceResDetail)
                luaControl({
                    "color_temperature": Math.floor((e.detail.value) / 255 * 100)
                }, this.data.loadPageData.applianceCode)
            }
        },
        sliderDrag(e) {
            if (e.detail.title === '亮度') {
                if (e.detail.value > 252) {
                    e.detail.value = 252
                }
                this.data._deviceResDetail.brightness = 255 - e.detail.value
                this.setData({
                    'deviceStatus.brightness': 255 - e.detail.value
                })
            } else {
                this.data._deviceResDetail.color_temperature = e.detail.value
                this.setData({
                    'deviceStatus.color_temperature': e.detail.value
                })
            }
        },
        // 场景操作
        toggleSceneLed(e) {
            luaControl({
                "scene_light": e.detail.scene,
            }, this.data.loadPageData.applianceCode).then((data) => {
                console.log('lua控制结果', data)
                if (data.result) {
                    luaQuery(this.data.loadPageData.applianceCode).then(data => {
                        this.initPage(data)
                    })
                    let scene = this.selectComponent("#scene")
                    scene.updateChecked(data.scene_light)
                }
            })

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
            this.data._deviceResDetail.delay_light_off = e.detail.time
            this.initPage(this.data._deviceResDetail);
            luaControl({
                delay_light_off: params
            }, this.data.loadPageData.applianceCode)
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

        // 首次进入页面进行默认操作 
        defaultOpenPage() {
            this.initPage(this.data._deviceResDetail);
            luaQuery(this.data.loadPageData.applianceCode).then(data => {
                this.data._deviceResDetail.power = data.power;
                this.data._deviceResDetail.brightness = data.brightness;
                this.data._deviceResDetail.color_temperature = data.color_temperature;
                this.data._deviceResDetail.delay_light_off = data.delay_light_off;
                this.initPage(data)
            })
        },
    },
})
