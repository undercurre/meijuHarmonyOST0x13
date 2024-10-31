import { getReqId, getStamp, getUID } from 'm-utilsdk/index'

const app = getApp()
const requestService = app.getGlobalConfig().requestService

let deviceId = ''
let userId = ''
let userList = []
let localUserId = ''

function setMSInfo(devId, uId) {
  deviceId = devId
  userId = uId
  let value = wx.getStorageSync(`MJ0x13${deviceId}`)
  if (value) {
    localUserId = value
  }
  console.log('lmn>>>', 'did=' + deviceId + '//uid=' + userId)
}

function getLocalUserList() {
  return userList
}

function getUserById(id) {
  for (let i = 0; i < userList.length; i++) {
    if (id == userList[i].lightUserId) return userList[i]
  }
  return null
}

function getCurUserID() {
  if (userList.length == 0) return 0
  if (localUserId == '') {
    try {
      wx.setStorageSync(`MJ0x13${deviceId}`, userList[0].lightUserId)
    } catch (e) {}
    return userList[0].lightUserId
  } else {
    for (let i = 0; i < userList.length; i++) {
      if (userList[i].lightUserId == localUserId) {
        return localUserId
      }
    }
    try {
      wx.setStorageSync(`MJ0x13${deviceId}`, userList[0].lightUserId)
    } catch (e) {}
    return userList[0].lightUserId
  }
}

function setCurUserID(id) {
  try {
    localUserId = id
    wx.setStorageSync(`MJ0x13${deviceId}`, id)
  } catch (e) {}
}

function queryUserList() {
  return new Promise((resolve, reject) => {
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'queryLightUserList',
      },
      data: {
        deviceId: deviceId,
        reqId: getReqId()
      }
    }
    requestService.request("MzTransmit", params).then((res) => {
      // console.log('lmn>>>queryUserList res=', res)
      if (res.data.code == 0) {
        const data = JSON.parse(res.data.data.returnData) || {}
        userList = data.result.lightUserList
        if (userList.length > 0) userList.reverse()
        console.log('lmn>>>queryUserList list=', JSON.stringify(userList))
        resolve(data)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>queryUserList err=',err)
      reject(err)
    })
  })
}

function addUser(name = '', sex = '0', birthday = '', imageUrl = '') {
  return new Promise((resolve, reject) => {
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'addLightUser',
      },
      data: {
        reqId: getReqId(),
        deviceId: deviceId,
        userId: userId,
        username: name,
        sex: sex,
        birthday: birthday,
        headImageUrl: imageUrl
      }
    }
    requestService.request("MzTransmit", params).then((res) => {
      // console.log('lmn>>>addUser res=', res)
      if (res.data.code == 0) {
        const data = JSON.parse(res.data.data.returnData) || {}
        resolve(data)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>addUser err=',err)
      reject(err)
    })
  })
}

function updateUser(babyUserId, name = '', sex = '0', birthday = '', imageUrl = '') {
  return new Promise((resolve, reject) => {
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'uptLightUser',
      },
      data: {
        reqId: getReqId(),
        lightUserId: babyUserId,
        userId: userId,
        username: name,
        sex: sex,
        birthday: birthday,
        headImageUrl: imageUrl
      }
    }
    requestService.request("MzTransmit", params).then((res) => {
      // console.log('lmn>>>updateUser res=', res)
      if (res.data.code == 0) {
        const data = JSON.parse(res.data.data.returnData) || {}
        resolve(data)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>updateUser err=',err)
      reject(err)
    })
  })
}

function deleteUsers(ids) { // ['12333322']
  return new Promise((resolve, reject) => {
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'batchDelLightUser',
      },
      data: {
        reqId: getReqId(),
        lightUserIds: ids
      }
    }
    requestService.request("MzTransmit", params).then((res) => {
      // console.log('lmn>>>deleteUsers res=', res)
      if (res.data.code == 0) {
        const data = JSON.parse(res.data.data.returnData) || {}
        resolve(data)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>deleteUsers err=',err)
      reject(err)
    })
  })
}

function queryHistory(dateStr = '', cnt = 0) { // YYYY-MM-dd
  return new Promise((resolve, reject) => {
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'queryLightFeedHistoryList',
      },
      data: {
        reqId: getReqId(),
        deviceId: deviceId
      }
    }
    if (dateStr) Object.assign(params.data, { queryTime: dateStr })
    if (cnt) Object.assign(params.data, { count: cnt })
    const curBabyId = getCurUserID()
    if(curBabyId != 0) Object.assign(params.data, { lightUserId: curBabyId })
    // console.log('lmn>>>queryHistory params=', JSON.stringify(params))
    requestService.request("MzTransmit", params).then((res) => {
      // console.log('lmn>>>queryHistory res=', JSON.stringify(res))
      if (res.data.code == 0) {
        const data = JSON.parse(res.data.data.returnData) || {}
        // console.log('lmn>>>queryHistory data=', JSON.stringify(data))
        resolve(data)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>queryHistory err=',err)
      reject(err)
    })
  })
}

function uploadHistory(hisData, userId = null) {
  return new Promise((resolve, reject) => {
    if(getCurUserID() === 0 && userId == null) {
      reject('no cur user id')
    }
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'saveLightFeedHistory',
      },
      data: {
        reqId: getReqId(),
        deviceId: deviceId,
        lightUserId: userId || getCurUserID(),
        ...hisData
      }
    }
    // console.log('lmn>>>uploadHistory params=', JSON.stringify(params))
    requestService.request("MzTransmit", params).then((res) => {
      // console.log('lmn>>>uploadHistory res=', res)
      if (res.data.code == 0) {
        const data = JSON.parse(res.data.data.returnData) || {}
        resolve(data)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>uploadHistory err=',err)
      reject(err)
    })
  })
}

function updateHistory(hisId, updateData) {
  return new Promise((resolve, reject) => {
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'uptLightFeedHistory',
      },
      data: {
        reqId: getReqId(),
        historyId: hisId,
        ...updateData
      }
    }
    // console.log('lmn>>>updateHistory params=', JSON.stringify(params))
    requestService.request("MzTransmit", params).then((res) => {
      // console.log('lmn>>>uploadHistory res=', res)
      if (res.data.code == 0) {
        const data = JSON.parse(res.data.data.returnData) || {}
        resolve(data)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>updateHistory err=',err)
      reject(err)
    })
  })
}

function deleteHistory(ids = []) {
  return new Promise((resolve, reject) => {
    let params = {
      proType: '0x13',
      stamp: getStamp(),
      uid: getUID(),
      reqId: getReqId(),
      param: {
        handleType: 'batchDelLightFeedHistory',
      },
      data: {
        reqId: getReqId(),
        historyIds: ids
      }
    }
    requestService.request("MzTransmit", params).then((res) => {
      if (res.data.code == 0) {
        resolve(res)
      } else {
        reject(res)
      }
    }, (err) => {
      console.error('lmn>>>deleteHistory err=',err)
      reject(err)
    })
  })
}

export default {
  setMSInfo,
  queryUserList,
  getLocalUserList,
  getUserById,
  addUser,
  updateUser,
  deleteUsers,
  queryHistory,
  uploadHistory,
  getCurUserID,
  setCurUserID,
  updateHistory,
  deleteHistory
}