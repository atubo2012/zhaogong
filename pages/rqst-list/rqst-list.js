let qcurl = require('../../config.js').url;
let common = require('../../common.js');
let cf = require('../../config.js');
let ut = require('../../utils/utils.js');
const app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {
        pageInfo: app.getPageInfo('rqst-list'),
        imgUrls: [
            qcurl + '/uploads/avatar-ba2f1dfa962667b56983c9f459f050f8.jpg',
            qcurl + '/uploads/avatar-bb50cc8ed4b8fb9e4a28d22791a9f4af.png',
            'http://www.wxapp-union.com/template/win8_2_zuk/src/logo.png'
        ],
        imgUrls2: [
            {id: '1', value: qcurl + '/uploads/avatar-ba2f1dfa962667b56983c9f459f050f8.jpg'},
            {id: '2', value: qcurl + '/uploads/avatar-bb50cc8ed4b8fb9e4a28d22791a9f4af.png'},
            {id: '3', value: 'http://www.wxapp-union.com/template/win8_2_zuk/src/logo.png'}
        ]
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (params) {

        let that = this;
        wx.request({
            url: cf.service.rqstListUrl,
            data: {
                //TODO：补充用户信息作为查询参数，后台程序要按照用户筛选订单记录，目前是全量查询
            },
            header: {
                'Content-Type': 'application/json'
            },
            success: function (res) {
                ut.info("需求信息查询结果如下：",res.data);
                that.setData({reqList: res.data});
            }
        })

    },
    setParams:function (e) {
        ut.debug('设置全局参数：',e);

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
})