// plugin/T0x13/component/scene-list/scene-list.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        list: {
            type: Array,
            value: []
        },
        checked: {
            type: String,
            value: ''
        }
    },

    /**
     * 组件的初始数据
     */
    data: {
    
    },

    /**
     * 组件的方法列表
     */
    methods: {
        changeChecked: function(e) {
            this.triggerEvent('sceneTap', { scene: this.data.list[e.currentTarget.dataset.index].mark, title: this.data.list[e.currentTarget.dataset.index].title })
        },
        updateChecked(mark) {
            this.setData({
                checked: mark
            })
            setTimeout(() => {
                this.setData({
                    checked: ''
                })
            }, 3000)
        }
    }
})
