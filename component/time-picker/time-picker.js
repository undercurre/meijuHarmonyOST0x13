// plugin/T0x13/component/time-picker/time-picker.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        timeIndex: {
            type: Number,
            value: 0
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        array: Array.from(new Array(60), (item,index) => (index + 1)+'分钟'),
        pickerAnimationData: {}
    },

    /**
     * 组件的方法列表
     */
    methods: {
        pickerChange: function (e) {
            this.setData({
                'list[0].desc': '将在' + e.detail.value + '后关闭',
                'list[0].check': true
            })
            this.triggerEvent('delayTap', { time: e.detail.index + 1 })
            this.makePickerAction(false)
        },
        makePickerAction(action) {
            console.log('触发picker动画')
            var animation = wx.createAnimation({
                duration: 800,
                timingFunction: 'ease',
            })
            if (action) {
                animation.height('50vh').step()
            } else {
                animation.height('0rpx').step()
            }
            this.setData({
                pickerAnimationData: animation.export()
            })
            if (!action) {
                setTimeout(() => {
                    this.triggerEvent('pickerGone')
                }, 800)
            }
        },
        onCancel() {
            this.makePickerAction(false)
        }
    }
})
