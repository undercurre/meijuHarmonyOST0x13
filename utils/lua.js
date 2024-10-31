import {
  getReqId,
  getStamp,
} from 'm-utilsdk'

import {
  requestService
} from '../../../../../utils/requestService'

export function luaControl(param, applianceCode) {
  return new Promise(async (resolve, reject) => {
    try {
      wx.showNavigationBarLoading();
      
      const reqData = {
        reqId: getReqId(),
        stamp: getStamp(),
        applianceCode,
        command: {
          control: param,
        },
      };

      const resp = await requestService.request("luaControl", reqData);
      wx.hideNavigationBarLoading();

      if (resp.data.code === '0') {
        resolve(resp.data.data.status || {});
      } else {
        reject(resp);
      }
    } catch (error) {
      wx.hideNavigationBarLoading();
      wx.showToast({
        title: '设备未响应，请稍后尝试刷新',
        icon: 'none',
        duration: 2000,
      });
      console.error(error);
      reject(error);
    }
  });
}

export async function luaQuery(applianceCode) {
  wx.showNavigationBarLoading();
  
  const reqData = {
    reqId: getReqId(),
    stamp: getStamp(),
    applianceCode,
    command: {}
  };

  try {
    const resp = await requestService.request("luaGet", reqData);
    wx.hideNavigationBarLoading();

    if (resp.data.code === '0') {
      return resp.data.data || {};
    } else {
      throw resp;
    }
  } catch (error) {
    wx.hideNavigationBarLoading();
    console.error(error);
    throw error;
  }
}
