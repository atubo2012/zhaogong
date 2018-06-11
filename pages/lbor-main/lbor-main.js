let ut = require('../../utils/utils.js');
const app = getApp();
let cf = app.globalData.cf;

Page({

    /**
     * 页面的初始数据
     */
    data: {

        pageInfo: app.getPageInfo('lbor-main'),

        imgUrls: [],
        imgUrls2: [],
        cf: cf //每个页面的js文件都将config.js文件放到data中，以便wxml文件能方便的使用参数。
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (params) {
        this.setData({
            imgUrls: [
                'http://pic.597.com/com/2016/04/28/16042802190195192.jpg',
                'http://top.shang360.com/upload/article/20161125/39759338671480058904.jpg',
                'https://86316533.qstarxcx.com/upload/avatar-1d2705c60f054b82aa0f5e2cfd1574ac.jpg'
            ],

            imgUrls2: [
                {id: '1', value: cf.url + '/uploads/avatar-ba2f1dfa962667b56983c9f459f050f8.jpg'},
                {id: '2', value: cf.url + '/uploads/avatar-bb50cc8ed4b8fb9e4a28d22791a9f4af.png'},
                {id: '3', value: 'http://www.wxapp-union.com/template/win8_2_zuk/src/logo.png'}
            ],

        })
    },

});