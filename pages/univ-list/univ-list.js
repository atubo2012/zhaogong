'use strict';
let ut = require('../../utils/utils.js');
const app = getApp();
const cf = app.globalData.cf;
const innerAudioContext = wx.createInnerAudioContext();
let cclist = null;

Page({
    data: {
        /**
         * 页面使用的例行参数
         */
        pageInfo: cf.motto['fdbk-edit'],//
        submitButtonDisabled: false,//提交按钮默认状态，点击提交后设置为true，避免重复提交
        showTips: false,//默认不显示异常信息
        preview: true,  //初始默认为显示，点击修改后，隐藏详情展示信息，只显示编辑表单
        app: app,       //app.js句柄，便于页面调用app.js中的属性
        cf: cf,          //便于业页面中使用配置类信息


        /**
         * RC(Rending Component)表单控件被初始化渲染时使用的数据。
         */
        list: [],         //当前页的数据

        //_crBlink: false,


        _cond: {
            'query': {},
            'skip': 0,
            'limit': 20,
            'sort': {},
        },

        cb: null,

        cities:['sh','qd','cd','wh','tj','cq','hz'],
        currentCity:'sh',


    },

    bindCityChange:function (e) {
        let that = this;
        console.log('bindCityChange',e);
        that.setData({
            //currentCity: that.data.cities[e.detail.value],
            currentCity: e.currentTarget.dataset.city,
            list:[]
        });
        console.log(this.data.currentCity);
        that.onLoad(that.data.option);
    },

    copyUrl:function (e) {
        console.log('copyUrl',e);
        wx.setClipboardData({
            data: e.detail.detaildata,
            success: function (res) {
                wx.showToast({
                    title: '打开浏览器查看'
                });
            }
        });
    },

    /**
     * univ-list中每条记录收到点击事件后的处理函数
     * 根据传来的事件类别(一个记录中不同的信息项可能会触发不同的事件)、处理item数据
     * @param e
     */
    showDetail: function (e) {
        console.log('univ-list.showDetail', e);
        let item = e.detail.detaildata;
        let event_type = e.detail.eventtype;

        /**
         * 笋盘查询请求
         */
        if (event_type === 'bamboourlcopy') {
            wx.setClipboardData({
                data: item.url,
                success: function (res) {
                    wx.getClipboardData({
                        success: function (res) {
                            wx.showToast({
                                title: '请打开浏览器查看'
                            })
                        }
                    })
                }
            });
        }else if (event_type==='rentrsrurlcopy') {
            wx.setClipboardData({
                data: item.url,
                success: function (res) {
                    wx.showToast({
                        title: '请打开浏览器查看'
                    });
                }
            });
        }
        else if (cf.charging_type[event_type]) //修改、查看（ZgConfig中静态配置的商品）
        {
            let biz_type = cf.charging_type[event_type];
            console.log('biz_type:',biz_type);
            wx.navigateTo({
                url: '../'+biz_type.url+'/'+biz_type.url+'?reqId=' + e.detail.detaildata.reqId
            })
        }else if (event_type.indexOf('1C')===0) //修改、查看（动态配置的商品）
        {
            wx.navigateTo({
                url: '../order-edit/order-edit?reqId=' + e.detail.detaildata.reqId
            })
        }else if (event_type === 'onbizclick') {//新增商品（动态配置的商品）
            app.globalData['param'] = e.detail.detaildata;
            wx.navigateTo({
                url: '../order-edit/order-edit?biz_type=' + e.detail.detaildata.id
            })
        }else if (event_type === 'rentrsrurlcopy') {//新增商品（动态配置的商品）
            app.globalData['param'] = e.detail.detaildata;
            wx.navigateTo({
                url: '../order-edit/order-edit?biz_type=' + e.detail.detaildata.id
            })
        }

    },


    /**
     * univ-list的onLoad主要流程
     * 1、根据option.itemname的参数定位后端服务
     * 2、根据option.itemname设置特定的查询条件
     * 3、获取cc_list的句柄
     * 4、执行cc_list.onLoad函数
     * 5、cc_list.onLoad调用回调函数对应答数据进行处理
     * @param option
     */
    onLoad: function (option) {
        let that = this;

        ut.debug('univ-list入参：', option, this.data);


        //根据入参设置后端服务名和详情页面的识别名
        that.setData({
            option:option,
            itemname: option.itemname,
            serviceUrl: cf.service[option.itemname + 'ListUrl']
        });

        //ut.checkSession(null, app, that, () => {

        //设置个性化的
        this._setOtherCondition(option, that);


        cclist = this.selectComponent("#cc_list");


        //加载列表数据，调用对数据的预处理回调函数
        cclist.onLoad(this.data.cb);

        //});
    },

    /**
     * 对应答数据中的状态进行过滤，若已经超时的显示已过期。
     * @param list
     * @private
     */
    _rqstCb: function (list) {
        list.map(function (item) {
            item.address = ut.getHiddenAddr(item.address);
            //若上门时间早于当前时间，则提示已过期
            if (!ut.isLateThanNow(item.osdt + ' ' + item.ostm) && item.stat === 'bs_wait')
                item.stat = 'expired';
        });
        //console.log('回调生效', list);

    },

    /**
     * 根据不同的入口参数，设置查询条件
     * @param option
     * @param that
     * @private
     */
    _setOtherCondition: function (option, that) {

        let role = '';
        let openId = '';

        //获取用户信息
        if (app.globalData.userInfo) {
            openId = app.globalData.userInfo.openId;
            role = app.globalData.userInfo.role;
        }

        //以下变量用于临时保存发给后端的查询条件
        let query = {};
        let sort = {};
        let coll = '';
        let cb = null;


        /**
         * 静态商品订单类查询
         */
        if (option.itemname === 'rqst') {
            coll = 'rqst'; //设置查询条件
            let type = option.type;
            //我的订单
            if (type === 'my') {
                if (role === 'CLNT') {
                    query['clntInfo.openId'] = openId;
                } else if (role === 'LBOR') {
                    query['lborInfo.openId'] = openId;
                }
            } else if (type === 'all') { //全部订单
                cb = this._rqstCb;
            } else if (type === 'myAsSupplier') { //供应商订单
                query['supplier_id'] = openId;
            }

            //该分支只能查询静态商品的信息
            query['biz_type'] = {$in:Object.keys(cf.charging_type)};

        } else if (option.itemname === 'bamboo') {
            //coll = 'ljshesf_result';
            coll = 'lj'+that.data.currentCity+'esf_result';
            sort = {bsr: 1,asktime: -1};
            query = {asktime: {$regex: '刚刚发布|天|年', $options: 'i'}}
        }
        else if (option.itemname === 'rentrsr') {
            coll = 'lj'+that.data.currentCity+'_rentrsr';
            sort = {rsr: -1,ruprice:1};
            //todo：根据当前用户已购商品的权限，加载城市列表
        }
        else if (option.itemname === 'bizcatalog') {
            coll = 'bizcatalog';
            sort = {updt: -1};
            query = {}
        }else if (option.itemname === 'order') { //查询动态配置商品的订单

            coll = 'rqst';
            sort = {updt: -1};

            let type = option.type;
            //我的订单
            if (type === 'my') {
                if (role === 'CLNT') {
                    query['clntInfo.openId'] = openId;
                } else if (role === 'LBOR') {
                    query['lborInfo.openId'] = openId;
                }
            } else if (type === 'all') { //全部订单
                cb = this._rqstCb;
            } else if (type === 'myAsSupplier') { //我作为供应商的订单
                query['supplier_id'] = openId;
            }
            query['biz_type'] = {$nin:Object.keys(cf.charging_type)};

        }

        //设置cc_list控件的属性
        that.setData({
            '_cond.query': query,
            '_cond.coll': coll,
            '_cond.sort': sort,
            cb: cb,
        });
    },

    /**
     * 设置查询条件
     * 触发新的查询请求
     * 功能：
     * 1、被重新设置筛选条件的函数调用，用来将list[]清零，
     * 2、将翻页cclist.paging.pageNum清零
     * 3、触发翻页
     * @private
     */
    _reSetCondition:function(){
        let that = this;

        cclist.data.paging.pageNum = 0;
        cclist.data.paging.hasMore =true;

        this.data._cond.sort.bsr = 0-this.data._cond.sort.bsr;

        that.setData({
            list:[],
            '_cond.sort': that.data._cond.sort,
            '_cond.query': {asktime: {$regex: '刚刚发布|天', $options: 'i'}},
            cb: that.data.cb,
        });


        //加载列表数据，调用对数据的预处理回调函数
        cclist.onLoad(this.data.cb);
    },


    _reSetConditionRsr:function (e) {
        let that = this;
        console.log('_reSetConditionRsr',e);
        let data = {};

        let by  = e.currentTarget.dataset.by;
        if (by === 'ruprice') {
            data = {
                '_cond.sort': {
                    ruprice:0-that.data._cond.sort.ruprice,
                    rsr:that.data._cond.sort.rsr
                },
            };

        } else if (by === 'rsr') {
            data = {
                '_cond.sort': {
                    rsr:0-that.data._cond.sort.rsr,
                    ruprice:that.data._cond.sort.ruprice,
                },
            };
        }else if (by === 'city') {
            let city = that.data.cities[e.detail.value];
            data = {
                currentCity: city,
                '_cond.sort': {
                    rsr:that.data._cond.sort.rsr,
                    ruprice:that.data._cond.sort.ruprice,
                },
                '_cond.coll':'lj'+city+'_rentrsr'
            };
        }


        that.setData(data);


        this._reQuery();
    },

    _showJustNow:function (option) {
        let that = this;
        console.log('_showJustNow',option);

        that.setData({
            '_cond.query': {asktime:option.currentTarget.dataset.query},
        });
        this._reQuery();
    },



    /**
     * 重新发起查询请求。
     * 本函数由条件设置函数所调用。
     * @private
     */
    _reQuery:function(){

        //获得句柄，并将查询组件cc_list的初始
        //let cclist = this.selectComponent("#cc_list");
        cclist.data.paging.pageNum = 0;     //当前页从0开始
        cclist.data.paging.hasMore =true;   //状态设置为还有后续记录，否则会查不出数据
        this.setData({
            list:[],                        //清空之前已经查询到的数据
        });
        cclist.onLoad(this.data.cb);

    },

    onReachBottom: function () {
        //let cclist = this.selectComponent("#cc_list");
        cclist.onReachBottom();
    },

    onPullDownRefresh: function () {
        //let cclist = this.selectComponent("#cc_list");
        cclist.onPullDownRefresh();
    },
});