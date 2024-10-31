// plugin/T0x13/component/function-list/function-list.js
Component({

    /**
     * 组件的属性列表
     */
    properties: {
        list: {
            type: Array,
            value: []
        },
    },

    /**
     * 组件的初始数据
     */
    data: {
        timeIndex: 0,
        array: Array.from(new Array(60), (item,index) => (index + 1)+'分钟'),
        pickerAnimationData: {}
    },

    /**
     * 组件的方法列表
     */
    methods: {
        changeSwitch: function(e) {
            this.data.list[e.currentTarget.dataset.index].check = !this.data.list[e.currentTarget.dataset.index].check
            if (this.data.list[e.currentTarget.dataset.index].check) {
                this.makePickerAction()
            } else {
                this.triggerEvent('delayTap', { time: 0,index: e.currentTarget.dataset.index })
            }
        },
        makePointAction() {
            var animation = wx.createAnimation({
                duration: 100,
                timingFunction: 'ease',
            })
            if (!this.data.list[0].check) {
                console.log('闭点动画')
                animation.backgroundColor('#a0a0a0').scale(1,1).translateX('0rpx').step()
            } else {
                console.log('开点动画')
                animation.backgroundColor('#ffffff').scale(1.6,1.6).translateX('34rpx').step() 
            }
            this.data.list[0].animationData = animation.export()
            this.setData({
                list: this.data.list
            })
        },
        makePickerAction() {
            console.log('点击横栏')
            this.triggerEvent('pickerOpen')
        }
    }
})
