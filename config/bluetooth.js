function ab2hex(buffer) {
  var hexArr = Array.prototype.map.call(
      new Uint8Array(buffer),
      function (bit) {
          return ('00' + bit.toString(16)).slice(-2)
      }
  )
  return hexArr.join('');
}

function getIOSMac(advertisData) {
  let a = ''
  advertisData = ab2hex(advertisData)
  a = advertisData.substr(42, 12).toLowerCase();
  let arr = []
  for (let i = 0; i < a.length; i += 2) {
    arr.push(a.substr(i, 2))
  }
  arr.reverse()
  return arr.join("")
}

let platform = 'iso';
let targetMac = '';
let findedCallBack = null;
let timeOutTimer = null;

const bluetooth = {
  // 初始化蓝牙模块
  open() {
    wx.getSystemInfo({
      success (res) {
        platform = res.platform
      }
    })
    return new Promise((resolve, reject) => {
      wx.openBluetoothAdapter({
        success: (res) => {
          console.log('lmn>>> 初始化蓝牙模块成功');
          resolve(res)
        },
        fail: (err) => {
          console.log('lmn>>> 初始化蓝牙模块失败');
          reject(err);
        }
      })
    })
  },
  resisterFindedTargetDevice(mac, callback) {
    let temp  = '' + mac
    targetMac = temp.toLowerCase()
    findedCallBack = callback
  },
  getBluetoothDevice() {
    wx.getBluetoothDevices({
      success: (res) => {
        if (res.devices != undefined) {
          //console.log('lmn>>> getBluetoothDevices::devices=' + JSON.stringify(res.devices));
          for(let i=0; i<res.devices.length; i++) {
            if (platform == 'ios') {
              if (res.devices[i].advertisData != undefined) {
                //console.log('lmn>>> UUID=' + res.devices[i].deviceId + '/mac=' + getIOSMac(res.devices[i].advertisData));
                let macStr = getIOSMac(res.devices[i].advertisData)
                if (macStr == targetMac) {
                  if (timeOutTimer != null) {
                    clearTimeout(timeOutTimer)
                    timeOutTimer = null
                  }
                  if (findedCallBack != null) findedCallBack({deviceId: res.devices[i].deviceId, errCode: 0})
                  else {
                    console.log('lmn>>> no callback');
                  }
                  this.stopDiscovery()
                  break
                }
              }
            } else {
              //console.log('lmn>>> mac=' + res.devices[i].deviceId);
              let macStr = res.devices[i].deviceId.replaceAll(':', '').toLowerCase()
              if (macStr == targetMac) {
                if (timeOutTimer != null) {
                  clearTimeout(timeOutTimer)
                  timeOutTimer = null
                }
                if (findedCallBack != null) findedCallBack({deviceId: res.devices[i].deviceId, errCode: 0})
                else {
                  console.log('lmn>>> no callback');
                }
                this.stopDiscovery()
                break
              }
            }
          }
        }
      }
    })
  },
  discoveryDevice() {
    let that = this;
    return new Promise((resolve, reject) => {
      wx.startBluetoothDevicesDiscovery({
        allowDuplicatesKey: false,
        success: (res) => {
          console.log('lmn>>> 开始搜索设备')
          if (timeOutTimer != null) {
            clearTimeout(timeOutTimer)
            timeOutTimer = null
          }
          timeOutTimer = setTimeout(function() {
            timeOutTimer = null
            that.stopDiscovery()
            if (findedCallBack != null) findedCallBack({deviceId: null, errCode: 0})
            else {
              console.log('lmn>>> no callback');
            }
          }, 10000)

          this.getBluetoothDevice();
          wx.onBluetoothDeviceFound((res) => {
            let devices = res.devices;
            if (platform == 'ios') {
              if (devices[0].advertisData != undefined) {
                //console.log('lmn>>> UUID=' + devices[0].deviceId + '/mac=' + getIOSMac(devices[0].advertisData));
                let macStr = getIOSMac(devices[0].advertisData)
                if (macStr == targetMac) {
                  if (timeOutTimer != null) {
                    clearTimeout(timeOutTimer)
                    timeOutTimer = null
                  }
                  if (findedCallBack != null) findedCallBack({deviceId: devices[0].deviceId, errCode: 0})
                  else {
                    console.log('lmn>>> no callback');
                  }
                  this.stopDiscovery()
                }
              }
            } else {
              //console.log('lmn>>> 新设备mac=' + devices[0].deviceId);
              let macStr = devices[0].deviceId.replaceAll(':', '').toLowerCase()
              if (macStr == targetMac) {
                if (timeOutTimer != null) {
                  clearTimeout(timeOutTimer)
                  timeOutTimer = null
                }
                if (findedCallBack != null) findedCallBack({deviceId: devices[0].deviceId, errCode: 0})
                else {
                  console.log('lmn>>> no callback');
                }
                this.stopDiscovery()
              }
            }
          })
          resolve(0);
        },
        fail: (res) => {
          console.log('lmn>>> 搜索失败：' + JSON.stringify(res));
          if (findedCallBack != null) findedCallBack({deviceId: null, errCode: res.errCode})
          reject(undefined);
        }
      })
    })
  },
  stopDiscovery() {
    wx.stopBluetoothDevicesDiscovery({
      complete: (res) => {
        console.log('lmn>>> 已停止蓝牙搜索')
      },
    })
    wx.offBluetoothDeviceFound((res) => {})
  },
  close() {
    // 关闭蓝牙模块
    wx.closeBluetoothAdapter({
      complete: (res) => {
        console.log('lmn>>> 关闭蓝牙模块')
        console.log(res)
      },
    })
  }
}

export default bluetooth;