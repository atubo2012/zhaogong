
let cf = require('../../config.js');
let qcurl = cf.url;
let app = getApp();
let common = require('../../common.js');
let ut = require('../../utils/utils.js');
Page({

    /**
     * 页面的初始数据
     */
    data: {

        pageInfo: app.getPageInfo('lbor-main'),

        imgUrls: [
            qcurl + '/uploads/avatar-ba2f1dfa962667b56983c9f459f050f8.jpg',
            qcurl + '/uploads/avatar-bb50cc8ed4b8fb9e4a28d22791a9f4af.png',
            'http://www.wxapp-union.com/template/win8_2_zuk/src/logo.png'
        ],
        imgUrls2: [
            {id: '1', value: qcurl + '/uploads/avatar-ba2f1dfa962667b56983c9f459f050f8.jpg'},
            {id: '2', value: qcurl + '/uploads/avatar-bb50cc8ed4b8fb9e4a28d22791a9f4af.png'},
            {id: '3', value: 'http://www.wxapp-union.com/template/win8_2_zuk/src/logo.png'}
        ],
        cf: cf //每个页面的js文件都将config.js文件放到data中，以便wxml文件能方便的使用参数。
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (params) {
        //console.log(app.globalData.gReqType);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
});