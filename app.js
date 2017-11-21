
let qcloud = require('./vendor/qcloud-weapp-client-sdk/index');
let cf = require('./config');
let common = require('./common');
let ut = require('utils/utils.js');

App({

    //应用加载时初始化本地存储数据。
    onLaunch: function () {
        //调用API从本地缓存中获取数据，如果本地无数据，则返回空数组
        let logs = wx.getStorageSync('logs') || [];
        logs.unshift(Date.now()); //unshift()：将当前日期对象保存到数组的第一元素
        wx.setStorageSync('logs', logs);

        //common.showMsg(cf.service.loginUrl,'success',5);
        //common.showModal('loginurl',cf.service.loginUrl,console.log,'确认',console.log,'撤销');

        qcloud.setLoginUrl(cf.service.loginUrl);
    },
    getUserInfo: function (cb) {
        let that = this;

        if (this.globalData.userInfo) {
            typeof cb == "function" && cb(this.globalData.userInfo)
        } else {
            //调用登录接口,登录成功后将userInfo设置为全局变量
            wx.login({
                success: function (res) {
                    // console.log('wx.login: code='+res.code);
                    // console.log('wx.login: errMsg='+res.errMsg);

                    wx.getUserInfo({
                        success: function (res) {
                            //console.log('wx.getUserInfo():'+JSON.stringify(res.userInfo));
                            that.globalData.userInfo = res.userInfo;
                            //console.log('that.globalData.userInfo:'+JSON.stringify(that.globalData.userInfo));
                            typeof cb == "function" && cb(that.globalData.userInfo)
                        }
                    })
                },
            })
        }
    },

    /**
     * globalData是保存全局参数的缓存区，页面之间在跳转过程中，
     * 可以在A.js中为globalData.param设置参数值，再从B.js中获取这个参数值这里设置参数值
     */
    globalData: {
        userInfo: null,
        gCount: 1,
        gReqType:'',
        pageInfo:cf.pageInfo
    },

    /**
     * 统一配置各页面中的标题和描述信息
     * @param pageName
     * @returns 页面文件中的标题和说明
     */
    getPageInfo: function (pageName) {
        let ret = {};
        for (let i = 0; i < this.globalData.pageInfo.length; i++) {
            //console.log(pageName);
            if (pageName === this.globalData.pageInfo[i].page) {
                Object.assign(ret, this.globalData.pageInfo[i]);
                //console.log(this.globalData.pageInfo[i].page);
                break;
            }
        }
        return ret;
    }
    ,
    onHide: function () {

    },
    onShow: function () {
        //console.log('onShow() is runing!类好啊')
    },
    goHome:function () {
        ut.debug('goHome 被调用');
        wx.switchTab({
            url:'../../pages/index/index'
        });
    },
});
