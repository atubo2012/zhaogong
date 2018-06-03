let ut = require('../../utils/utils.js');
const app = getApp();
let cf = app.globalData.cf;

/**
 * 查看TA发出和收到的评价。
 * 从cmmt表中根据openId查询
 */
Page({

    /**
     * 页面的初始数据
     */
    data: {
        pageInfo: app.getPageInfo('cmmt-list'),
        app:app,
        ut : ut,


        //订单列表
        reqList:[],

        tabInfo:[],

        myTabInfo:[
            {mode:'tome',desc:'我收到',isActive:false},
            {mode:'isend',desc:'我发出',isActive:false}
        ],
        taTabInfo:[
            {mode:'tota',desc:'他收到',isActive:false},
            {mode:'tasend',desc:'他发出',isActive:false},
        ],


        mode:'',            //看是用户收到的还是用户发出的
        type:''             //是看自己的还是看别人的。
    },

    onTabClick:function (e) {
        that = this;
        ut.debug(e);
        this.onLoad({
            mode:e.target.dataset.mode,
            openId:that.data.openId,
            type:that.data.type
        });
    },

    renderTab:function (tabName) {
        let that = this;
        //遍历页签过程中，使指定的页签生效、其他页签失效
        for(let i=0;i< this.data.tabInfo.length;i++){
            if(tabName === this.data.tabInfo[i].mode){
                this.data.tabInfo[i].isActive = true;
            }else{
                this.data.tabInfo[i].isActive = false;
            }
        }
        //渲染页面
        this.setData({
            tabInfo:that.data.tabInfo,
        });
    },
    /**
     * 本功能类似rqst-list功能
     */
    onLoad: function (params) {
        let that =this;
        ut.debug(params);
        let type =params.type;



            //场景模式：看他人有关的评价：从订单中点击雇主的名字查看雇主的
            if (type === 'lookta') {
                this.setData({
                    tabInfo: that.data.taTabInfo,
                    openId: params.openId,
                    mode : params.mode,
                    type:params.type
                });
            }
            //看自己相关的评价：我的->我的评价
            else if (type === 'lookme') {
                this.setData({
                    tabInfo: that.data.myTabInfo,
                    openId: app.globalData.userInfo.openId,
                    mode : params.mode,
                    type:params.type
                });
            }

        //渲染tab标签
        this.renderTab(this.data.mode);

        /**
         * 准备后台的参数
         */
        let rdata = {};
        let mode = this.data.mode;
        rdata['mode'] = mode;
        if (mode === 'tome' || mode === 'tota') {
            rdata['assesseeOpenId'] = this.data.openId;
        } else if (mode === 'isend' || mode === 'tasend') {
            rdata['observerOpenId'] = this.data.openId;
        }
        ut.debug(rdata);
        wx.request({
            url: cf.service.cmmtListUrl,
            data: rdata,
            success: function (res) {
                    ut.info("需求信息查询结果如下：",res.data);
                    that.setData({
                        reqList: res.data,
                        mode : that.data.mode
                    });
            }
        })

    },
    setParams:function (e) {
        ut.debug('设置全局参数：',e);
    },

})