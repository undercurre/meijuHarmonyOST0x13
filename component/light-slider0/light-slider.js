
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        title: {
            type: String,
            value: '色温'
        },
        percentage: {
            type: Number,
            value: 50
        },
        topColor: {
            type: String,
            value: '#FFAA10'
        },
        bottomColor: {
            type: String,
            value: '#5CCCFF'
        },
        max: {
          type: Number,
          value: 100,
        },
        min: {
          type: Number,
          value: 0
        },
        reverse: {
          type: Boolean,
          value: false
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
        animationData: {},
        start: '',
    },

    /**
     * 组件的方法列表
     */
    methods: {
        onChange(event) {
            console.log('dragchange', event.detail)
            let num = event.detail
            this.triggerEvent('sliderTap', { value: num, title: this.data.title })
        },
        onDrag(event) {
            console.log('drag', event.detail)
            let num = event.detail.value
            this.triggerEvent('sliderDrag', { value: num, title: this.data.title })
        },
        updatePercentage() {
            console.log(this.data.title, this.data.percentage)
            this.setData({
                percentage: this.data.percentage
            })
        }
    }
})
