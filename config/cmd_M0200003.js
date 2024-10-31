let timerList = [
  {name: '定时一', hour: 0, minute: 0, isEnable: false, loop: [1, 1, 1, 1, 1, 1, 1]},
  {name: '定时二', hour: 0, minute: 0, isEnable: false, loop: [1, 1, 1, 1, 1, 1, 1]},
  {name: '定时三', hour: 0, minute: 0, isEnable: false, loop: [1, 1, 1, 1, 1, 1, 1]}
]
let deviceId = ''
let isConnected = false

function setIsConnected(isCon) {
  isConnected = isCon
}

function getIsConnected() {
  return isConnected
}

function setTimerName(index = 0, name = '') {
  if (index < 0 || index > 2) return
  timerList[index].name = name
  try {
    wx.setStorageSync(`MJ0x13${deviceId}T${index}`, name)
  } catch (e) {}
}

function initDeviceTimerLocal(devId) {
  deviceId = devId
  for (let i = 0; i < timerList.length; i++) {
    let value = wx.getStorageSync(`MJ0x13${devId}T${i}`)
    if (value) {
      timerList[i].name = value
    }
  }
}

function setTimerCmd(index = 0, hour = 0, minute = 0, isEnable = false, loop = [0, 0, 0, 0, 0, 0, 0]) {
  if (index < 0 || index > 2) return ''
  timerList[index].hour = hour
  timerList[index].minute = minute
  timerList[index].isEnable = isEnable
  timerList[index].loop = loop

  let messageBody = createMessageBody(18);
  setByte(messageBody, 0, 0x03)
  setByte(messageBody, 1, 0x01)
  ////////////////////////////////////
  setByte(messageBody, 5 + (index * 3), hour & 0xFF)
  setByte(messageBody, 6 + (index * 3), minute & 0xFF)
  
  let temp = 0xFF
  temp = setBit(temp, 0, isEnable ? 1 : 0)
  for (let i = 0; i < loop.length; i++) {
    temp = setBit(temp, i + 1, loop[i])
  }
  setByte(messageBody, 7 + (index * 3), temp & 0xFF)
  ////////////////////////////////////
  let message = createMessage(0x13, 0x02, messageBody);
  let result = convertTo16Str(message)
  console.log('lmn>>>定时命令:' + result)
  return result;
}

function json2bin(json) {
    let messageBody = createMessageBody(18);
    setByte(messageBody, 0, 0x03)
    setByte(messageBody, 1, 0x01)

    ////////////////////////////////
    if (json.light != undefined) {
      if (json.light == 'on') setByte(messageBody, 2, 0x01)
      else if (json.light == 'off') setByte(messageBody, 2, 0x00)
    }
    ////////////////////////////////
    if (json.brightness != undefined) {
      const val = parseInt(json.brightness)
      setByte(messageBody, 3, val & 0xFF)
    }
    ////////////////////////////////
    if (json.timing_light_off != undefined) {
      const val = parseInt(json.timing_light_off)
      setByte(messageBody, 4, val & 0xFF)
    }
    ////////////////////////////////
    let time = parseInt(new Date().valueOf() / 1000)
    setByte(messageBody, 17, time & 0xFF)
    time = parseInt(time / 256)
    setByte(messageBody, 16, time & 0xFF)
    time = parseInt(time / 256)
    setByte(messageBody, 15, time & 0xFF)
    time = parseInt(time / 256)
    setByte(messageBody, 14, time & 0xFF)
    ////////////////////////////////

    let message = createMessage(0x13, 0x02, messageBody);
    let result = convertTo16Str(message)
    console.log('lmn>>>json2bin()::' + result)
    return result;
}

function bin2json(bin) {
    let message = binStr2Array(bin)
    let result = {}
    let messageType = getByte(message, 9);
    if(messageType == 0x02 || messageType == 0x03 || messageType == 0x04) {
        let body = message.slice(10, message.length - 1);
        const type = getByte(body, 1)
        if (type == 0xFE || type == 0xFD) {
          let isNew = body.length > 15
          ///////////////////////////////////
          const lightVal = getByte(body, 2)
          if (lightVal == 0) {
            result['light'] = 'off'
          } else if (lightVal == 1) {
            result['light'] = 'on'
          }
          ///////////////////////////////////
          const briVal = getByte(body, 3)
          if (briVal >= 0 && briVal <= 100) {
            result['brightness'] = briVal
          }
          ///////////////////////////////////
          const timeOffVal = getByte(body, 4)
          if (timeOffVal != 0xFF) {
            result['timing_light_off'] = timeOffVal
          }
          ///////////////////////////////////
          if (isNew) {
            for (let i = 0; i < timerList.length; i++) {
              let hour = getByte(body, 5 + (i * 3))
              if (hour >= 0 && hour <= 23) timerList[i].hour = hour
              let minute = getByte(body, 6 + (i * 3))
              if (minute >= 0 && minute <= 59) timerList[i].minute = minute
              let temp = getByte(body, 7 + (i * 3))
              timerList[i].isEnable = getBit(temp, 0) == 1
              for (let j = 0; j < timerList[i].loop.length; j++) {
                timerList[i].loop[j] = getBit(temp, j + 1)
              }
            }
            console.log('lmn>>>定时列表:', JSON.stringify(timerList))
          }
          ///////////////////////////////////
          const low = getByte(body, isNew ? 14 : 7)
          if (low == 1) {
            result['battery_level_low'] = 'alarm'
          } else if (low == 0) {
            result['battery_level_low'] = 'normal'
          }
          ///////////////////////////////////
          const versionX = getByte(body, isNew ? 15 : 8)
          const versionY = getByte(body, isNew ? 16 : 9)
          const versionZ = getByte(body, isNew ? 17 : 10)
          if (versionX != 0xFF && versionY != 0xFF && versionZ != 0xFF) {
            result['software_version'] = '' + versionX + '.' + versionY + '.' + versionZ
          }
          ///////////////////////////////////
          result['report_command'] = 'report_state_data'
        } else if (type == 0xFC) {
          let historical_data = {}
          ///////////////////////////////////
          const seq = getByte(body, 2)
          historical_data['historicalDataSeq'] = seq
          ///////////////////////////////////
          const hisType = getByte(body, 3)
          historical_data['historicalDataType'] = hisType
          ///////////////////////////////////
          const hisStartTime = getByte(body, 4) * 256 * 256 * 256 + getByte(body, 5) * 256 * 256 + getByte(body, 6) * 256 + getByte(body, 7)
          const hisEndTime = getByte(body, 8) * 256 * 256 * 256 + getByte(body, 9) * 256 * 256 + getByte(body, 10) * 256 + getByte(body, 11)
          historical_data['historicalDataStartTime'] = hisStartTime
          historical_data['historicalDataEndTime'] = hisEndTime
          ///////////////////////////////////
          result['report_command'] = 'ack_synchronization_historical_data'
          result['historical_data'] = historical_data
        }
    }
    console.log('lmn>>>bin2json()::' + JSON.stringify(result))
    return result
}
function queryCMD() {
    let messageBody = [0x03, 0x03];
    let message = createMessage(0x13, 0x03, messageBody);
    let result = convertTo16Str(message)
    console.log('lmn>>>queryCMD()::' + result)
    return result;
}
function historyReqCMD() {
  let messageBody = [0x03, 0x02, 0x00];
  let message = createMessage(0x13, 0x02, messageBody);
  let result = convertTo16Str(message)
  console.log('lmn>>>historyReqCMD()::' + result)
  return result;
}
function historyACKSuccessCMD() {
  let messageBody = [0x03, 0x02, 0x01];
  let message = createMessage(0x13, 0x02, messageBody);
  let result = convertTo16Str(message)
  console.log('lmn>>>historyACKSuccessCMD()::' + result)
  return result;
}
function historyACKFailCMD() {
  let messageBody = [0x03, 0x02, 0x02];
  let message = createMessage(0x13, 0x02, messageBody);
  let result = convertTo16Str(message)
  console.log('lmn>>>historyACKFailCMD()::' + result)
  return result;
}
function binStr2Array(str16) {
  let byteArray = new Array();
  if (str16 == undefined) return byteArray
  let data = str16;
  for (let i=0; i<data.length; i++) {
      if (i%2 == 0) {
          byteArray[i/2] = parseInt(data.substring(i, i+2), 16);
      }
  }
  return byteArray
}
function convertTo16Str(byteArray) {
    let str16 = new Array();
    if(byteArray == undefined) return str16.join('')
    for (let i = 0; i < byteArray.length; i++) {
        if (byteArray[i].toString(16).length == 1) {
            str16.push("0" + byteArray[i].toString(16).toLowerCase());
        } else {
            str16.push(byteArray[i].toString(16).toLowerCase());
        }
    }
    return str16.join('')
}
function setByte(byteArr, index, value) {
    byteArr[index] = value & 0xFF;
    return byteArr;
}
function getByte(byteArr, index) {
    if (index > byteArr.length - 1) return 0xFF
    return byteArr[index] & 0xFF;
}
function setBit(byte, index, value) {
  if (value == 0) {
    let mask = 0xFEFF >> (7 - index + 1)
    return byte & mask & 0xFF
  } else if (value == 1) {
    let mask = 0x100 >> (7 - index + 1)
    return (byte | mask) & 0xFF
  }
}
function getBit(byte, index) {
  return (byte >> index) & 0x01
}
function initBytes(byteArr, value) {
    for(let i=0; i < byteArr.length; i++){
        byteArr[i] = value & 0xFF;
    }
    return byteArr;
}
function createMessageBody(len) {
    let body = new Array(len);
    return initBytes(body, 0xFF);
}
function createMessage(applianceType, messageType, messageBody, applianceProtocolVersion) {
    let applianceId = [0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
    if (applianceProtocolVersion != undefined) {
        applianceId[5] = applianceProtocolVersion & 0xFF;
    }
    let bytesMessage = new Array();
    bytesMessage.push(0xAA);
    if (messageBody == undefined || messageBody.length == 0) {
        bytesMessage.push(0x0A);
    } else {
        bytesMessage.push(0x0A + messageBody.length);
    }
    bytesMessage.push(applianceType);
    bytesMessage = bytesMessage.concat(applianceId);
    bytesMessage.push(messageType);
    if (messageBody == undefined || messageBody.length == 0) {
    } else {
        bytesMessage = bytesMessage.concat(messageBody);
    }
    let sumContent = 0x00;
    if (messageBody == undefined || messageBody.length == 0) {
    } else {
        for (let i=0; i<messageBody.length; i++) {
            sumContent = sumContent + messageBody[i];
        }
    }
    bytesMessage.push( (~(bytesMessage[1] + bytesMessage[2] + bytesMessage[3] + bytesMessage[4] + bytesMessage[5] 
        + bytesMessage[7] + bytesMessage[8] + bytesMessage[9] + sumContent) + 1) & 0xFF);
    return bytesMessage;
}

function getTimerList() {
  return timerList
}

export default {
    json2bin,
    bin2json,
    queryCMD,
    historyReqCMD,
    historyACKSuccessCMD,
    historyACKFailCMD,
    getTimerList,
    setTimerName,
    initDeviceTimerLocal,
    setTimerCmd,
    setIsConnected,
    getIsConnected
}