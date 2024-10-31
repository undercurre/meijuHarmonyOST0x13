// plugin/T0x13/component/control-cell/control-cell.js
import { imgBaseUrl } from '../../../../../../api'
// import { getReqId, getStamp } from 'm-utilsdk/index'
// import { requestService } from '../../../../utils/requestService'

Component({
    lifetimes: {
        attached: function() {
            if(this.data.OnOff) {
                this.setData({
                    title: '已开灯',
                    'buttonData.mainImg': imgBaseUrl.url + '/plugin/0x13/power_on.png',
                })
              } else {
                this.setData({
                    title: '开灯',
                    'buttonData.mainImg': imgBaseUrl.url + '/plugin/0x13/power_off.png',
                })
            }
        },
      },
    /**
     * 组件的属性列表
     */
    observers: {
        'OnOff': function(OnOff) {
          if(OnOff) {
            this.setData({
                title: '已开灯',
                'buttonData.mainImg': imgBaseUrl.url + '/plugin/0x13/power_on.png',
            })
          } else {
            this.setData({
                title: '开灯',
                'buttonData.mainImg': imgBaseUrl.url + '/plugin/0x13/power_off.png',
            })
          }
        }
    },
    properties: {
      applianceCode: {
        type: String,
        value: ''
      },
      OnOff: {
        type: Boolean,
        value: true
      },
      disabled: {
        type: Boolean,
        value: false
      }
    },

    /**
     * 组件的初始数据
     */
    data: {
        title: '开灯',
        buttonData: {
            mainImg: '/plugin/T0x13/assets/power_on.png',
            triangleImg: ''
        }
    },

    /**
     * 组件的方法列表
     */
    methods: {
      buttonTap() { 
        if (this.data.disabled) {
          return 
        } else {
          this.triggerEvent('buttonTap')
        } 
      } 
    }
})
