const app = getApp();

Page({

    goHome:function () {
        wx.switchTab({
            url:'../../pages/index/index'
        });
    },
    goMyRqst:function () {
        wx.redirectTo({
            url:'../../pages/univ-list/univ-list?type=my&itemname=rqst'
        });
    },

    //加载该页面时，获取要显示的内容。
    onLoad(){
        this.setData({
            result:app.globalData.result
        });
    }
});