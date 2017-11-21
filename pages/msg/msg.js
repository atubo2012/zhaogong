const app = getApp();
let common = require('../../common.js');
let cf = require('../../config.js');
let ut = require('../../utils/utils.js');

Page({

    goHome:function () {
        wx.switchTab({
            url:'../../pages/index/index'
        });
    },
    goMyRqst:function () {
        wx.redirectTo({
            url:'../../pages/rqst-list/rqst-list?nickName'+app.globalData.userInfo.nickName
        });
    },

    //加载该页面时，获取要显示的内容。
    onLoad(){
        this.setData({
            result:app.globalData.result
        });
    }
});