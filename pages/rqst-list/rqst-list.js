let ut = require('../../utils/utils.js');
const app = getApp();
let cf = app.globalData.cf;

Page({

    /**
     * 页面的初始数据
     */
    data: {
        pageInfo: app.getPageInfo('rqst-list'),
        ut : ut, //如页面需要使用utils的方法，则在这里设置
    },

    /**
     * list页面加载的几种场景
     * 1、全量查询
     * 2、我的
     *
     * 查询类信息的展现无需登录的情况下即可查看，更新类功能和本人信息，则需要登录才可查看。
     * 本模块中，因为rqst-list（需求清单）是公共类信息，无需登录即可查看：
     * 所以不用设置header，也不必用ut.checkSession设置检查应答的结果是否会话过期。
     */
    onLoad: function (params) {
        ut.debug('需求列表入参:', params);
        let that = this;

        let type = params.type;
        let rdata = {};

        //如果用户曾经登录，则根据本页面的入口参数type，设置后端程序的查询条件。
        if (app.globalData.userInfo) {
            let role = app.globalData.userInfo.role;
            let openId = app.globalData.userInfo.openId;

            //根据角色来设置查询条件。如果是my，则表示我提交的订单
            if (type === 'my') {
                if (role === 'CLNT') {
                    rdata['clntInfo.openId'] = openId;
                } else if (role === 'LBOR') {
                    rdata['lborInfo.openId'] = openId;
                }
            }
        }

        //TODO，考虑用ut.request替代，将是否设置session3rdKey，以bool类型的参数。
        wx.request({
            url: cf.service.rqstListUrl,
            data: rdata,

            success: function (res) {

                ut.info("需求信息查询结果如下：", res.data);

                //如果是看全量订单时，会屏蔽；看自己的订单列表时，才会显示具体地址
                if (type !== 'my') {
                    res.data.map(function (item) {
                        item.addr = ut.getHiddenAddr(item.addr);
                    });
                }

                //渲染数据
                that.setData({
                    reqList: res.data
                });


            }
        })


    },

    setParams:function (e) {
        ut.debug('设置全局参数：',e);
    },

});