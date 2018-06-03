const app = getApp();

Page({

    goHome:function () {
        wx.switchTab({
            url:'../../pages/index/index'
        });
    },
    goMyRqst:function () {
        wx.redirectTo({
            url:'../../pages/rqst-list/rqst-list?type=my'
        });
    },

    //加载该页面时，获取要显示的内容。
    onLoad(){
        this.setData({
            result:app.globalData.result
        });
    }
});