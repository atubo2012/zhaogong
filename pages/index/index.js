let app = getApp();
let common = require('../../common.js');
let cf = require('../../config.js');
let ut = require('../../utils/utils.js');


Page({
    data: {
        pageInfo: app.getPageInfo('index'),
        motto: '',
        userInfo: {},

    },

    //设置用户角色为LBOR
    setRoleLbor: function () {
        app.globalData.gReqType = 'aaa';//验证app.globalData作为全局参数交换区的例子
        wx.switchTab({
            url: '../lbor-main/lbor-main'
        })
    },
    //设置用户角色为CLNT
    setRoleClnt: function () {
        app.globalData.gReqType = 'bbb';
        wx.switchTab({
            url: '../clnt-main/clnt-main'
        })
    },

    onLoad: function () {

        ut.debug('hahaha',this.data,'haha1','haha2','haha3');

        let that = this;
        //调用应用实例的方法获取全局数据
        app.getUserInfo(function (userInfo) {

            //将当前用户信息设置为全局变量。在page的js中可以使用app.globalData.userInfo获取
            that.setData({
                userInfo: userInfo
            });


            //检查是否是新用户
            wx.request({
                url: cf.service.userCheckUrl,
                data: {
                    userInfo: app.globalData.userInfo
                },
                header: {
                    'Content-Type': 'application/json'
                },
                success: function (res) {

                    let ret = JSON.stringify(res.data);


                    //如果后台返回的数据为空说明尚未建立用户信息
                    if ("0" === ret) {
                        ut.debug('新用户，展现角色选择的view,res.data:',res.data);
                        that.setData({
                            newUser: true
                        });
                    } else {
                        ut.debug('老用户');
                        ut.info(res.data);
                        that.setData({
                            newUser: false
                        });
                    }
                }
            })

        });


        /**
         * TODO:
         * 1、识别是否为新用户
         * 2-1、如果是新用户，则将页面导航到Role（找帮手/找工作）
         * 3-1、选定角色后导航到reqList看需求单或svcType选择服务种类
         * 4-1、LB点击需求列表进入reqDetl，选择上单时，提示填写个人信息和档期。录入完后进入该需求单。
         * 4-2、HI选择svcType进入reqEdit，录入需求信息，提交后提醒已发给n个供应商，接单后短信提醒。
         *
         * 2-2、如果是老用户，则根据角色进入到reqList或svcType
         */


    },
    onShow: function () {
        let app = getApp();
        app.globalData.gCount++;
    },
    goHome:function () {
        wx.switchTab(
            {
                url:'../index/index'
            }
        );
    }
});
