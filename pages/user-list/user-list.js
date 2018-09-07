let ut = require('../../utils/utils.js');
const app = getApp();
let cf = app.globalData.cf;

Page({

    data: {
        pageInfo: cf.motto['user-list'],
        list: [],
        cf:cf
    },

    onLoad: function () {
        let cclist = this.selectComponent("#cc_list");
        cclist.onLoad();
    },

    onReachBottom: function () {
        let cclist = this.selectComponent("#cc_list");
        cclist.onReachBottom();
    },

    onPullDownRefresh: function () {
        let cclist = this.selectComponent("#cc_list");
        cclist.onPullDownRefresh();
    },

});