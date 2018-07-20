let app = getApp();
let cf = app.globalData.cf;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        pageInfo: app.getPageInfo('clnt-main'),

        imgUrls:[],
        grids: [//某个图标点击后->产品list->蒙层显示详情->reqedit工单页(提交提醒)->提交结果(返回我的订单、返回首页)->电话/短信/邮件通知labor->点击接单后发送通知CLT
            {img: 'ar.jpg', url: '../rqst-edit/rqst-edit', desc: '入住保洁'},
            {img: 'ar.jpg', url: '../rqst-accleaning-edit/rqst-accleaning-edit?charging_type=accleaning', desc: '空调清洗'},
            {img: 'ar.jpg', url: '../rqst-accleaning-edit/rqst-accleaning-edit?charging_type=broadband', desc: '宽带安装'},
            {img: 'ar.jpg', url: '../rqst-accleaning-edit/rqst-accleaning-edit?charging_type=changelock', desc: '换锁修锁'},

            // {img: 'ar.jpg', url: 'ar.jpg', desc: '开荒保洁'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '修锁换锁'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '家电清洗'},
            // {img: 'ar.jpg', url: '', desc: '宽带安装'},
            // {img: 'ar.jpg', url: '../rqst-edit/rqst-edit', desc: '鲜花上门'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '问药'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '接机送站'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '家纺清洗'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '编程培训'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '共读社'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '民宿课'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '美居装饰'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '海外生活'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '沙龙活动'},
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '汽车驾驶'},//考虑保安工作的痛点和难点，他们有大量的时间。人脸识别刷卡。
            // {img: 'ar.jpg', url: 'ar.jpg', desc: '更多...'},//->BZCL(业务目录N宫格，点击后展开，搜索框+智能语音助手)
        ],

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (params) {
        console.log(app.globalData.gReqType);
        this.setData({
            imgUrl:[
                cf.url+'/uploads/avatar-ba2f1dfa962667b56983c9f459f050f8.jpg',
                cf.url+'/uploads/avatar-bb50cc8ed4b8fb9e4a28d22791a9f4af.png',
                'http://www.wxapp-union.com/template/win8_2_zuk/src/logo.png'
            ]
        });
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

    },
    goHome:function () {
        wx.switchTab(
            {
                url:'../index/index'
            }
        );
    }
})