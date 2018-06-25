let ut = require('../../utils/utils.js');
const app = getApp();
const cf = app.globalData.cf;
Page({

    /**
     * 页面的初始数据
     */
    data: {
        pageInfo: app.getPageInfo('me'),
        app: app,
        role: '',//默认的角色
        userInfo: app.globalData.userInfo,

        items: [
            {name: 'CLNT', value: '找帮手'},
            {name: 'COMM', value: '普通', checked: true},
            {name: 'LBOR', value: '找工作'},
        ],

        newMsgAmt:8,                //新消息数量，TODO:从本地缓存获取，后台发来通知后。
        /**
         * “我的”页面中典型的功能列表清单，按照本数组中的顺序，依次展现。
         * 菜单的顺序应该按照先个性化、后通用化的方式排列
         * TODO:以下信息在ZgConfig中定义
         */
        lists: [

            {
                title: '我的信息',
                role: 'LBOR',

                items: [
                {label: '我的档期', url: '../lbor-edit/lbor-edit', desc: ''},
                {label: '我的证书', url: '../cert-list/cert-list', desc: ''},
                {label: '工作简历', url: '../cert-list/cert-list', desc: ''},
                ]
            },
            {
                title: '我的信息',
                role: 'CLNT',

                items: [
                {label: '我的订单', url: '../rqst-list/rqst-list?type=my', desc: '说明'},//日期、业务种类、状态、服务人员、给予评价
            ]
            },
            {
                title: '通用',
                role: 'COMM',

                items: [
                    {label: '我的订单', url: '../rqst-list/rqst-list?type=my', desc: '查看、修改',},
                    {label: '我的评价', url: '../cmmt-list/cmmt-list?type=lookme&&mode=tome', desc: '查看'},
                    {label: '个人信息', url: '../user-edit/user-edit', desc: '查看、修改'},
                    {label: '关于'   ,url:'../about/about'        ,desc:'查看'},


                    {label: '用户信息', url: '../user-list/user-list', desc: '查看',forAdmin:true},



                    // {label: '常用地址', url: '../addr-edit/addr-edit', desc: ''},//参考京东的地址管理风格，可以在该页中增加培训的内容
                    // {label: '常用联系人', url: '../addr-list/addr-list', desc: ''},
                /**
                 {label:'收藏'   ,url:'../clct-list/clct-list',desc:'',num:'你好',hasNum:true},
                 {label:'关注'   ,url:'../fcus-list/clct-list',desc:''},
                 {label:'分享有礼',url:'../share/share'        ,desc:''},
                 {label:'浏览记录',url:'../brws-list/brws-list',desc:'',hasDot:true},

                 */
            ]
            },
        ],
    },


    goUserEdit:function (e) {
        wx.navigateTo({
            url:'../user-edit/user-edit'
        })
    },
    roleChange: function (e) {

        this.setData({
            'role': e.detail.value,
        });
        app.globalData.userInfo.role = e.detail.value;
        ut.debug('app.globalData.userInfo.role:',app.globalData.userInfo.role);
    },


    onLoad: function () {
        ut.checkSession(null,app,this,()=>{
            if(''===app.globalData.userInfo.role){
                //ut.debug('默认角色尚未设置');
                this.openConfirm();
            }else{
                this.renderData();
            }
        });
    },
    onShow: function () {
        this.onLoad();
    },

    renderData:function () {
        let that = this;
        this.setData({
            role: app.globalData.userInfo.role,
            items:ut.getRa(app.globalData.userInfo.role,that.data.items),
            userInfo:app.globalData.userInfo
        });
        ut.debug('渲染结果',this.data.items,app.globalData);
    },

    openConfirm: function () {
        let that = this;
        ut.showModal('温馨提示', '用户信息补全后就可以下单或接单了，马上补全？',
            () => {
                wx.navigateTo({
                    url: '../user-edit/user-edit'
                });
            }, () => {
                console.log('选择不补充服务人员信息，应停留在本页，不继续提交');
            });
    },


    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
});