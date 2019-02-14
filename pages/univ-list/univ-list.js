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

        _seeamt:-1,
        _bsr:-1,

        cb: null,

        cities:['sh','qd','cd','wh','tj','cq','hz','zz'],
        currentCity:'sh',
        //TODO:试用阶段，从后台拉取全量城市列表；商用阶段，从产品账户余额中拉取数据；
        //获客类产品：免费，有价值、高粘性
        //收入类产品：深度适用、按额度时间收费、信息管理
        //传播类产品：分享传播达到限额后，就可获得免费的额度（使用时间或访问额度）
        //提醒客户续费。

        //收费版可以从用户已付的账户中拉取数据
        //TODO:收藏



    },

    bindCityChange:function (e) {
        let that = this;
        console.log('bindCityChange',e);
        that.setData({
            currentCity: that.data.cities[e.detail.value],
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
        }else if (event_type.indexOf('BT_')===0) //修改、查看（动态配置的商品）
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
        }
        else if (option.itemname === 'order') { //查询动态配置商品的订单
            coll = 'rqst';
            let type = option.type;
            sort = {updt: -1};
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

        else if (option.itemname === 'bamboo') {
            coll = 'lj'+that.data.currentCity+'esf_result';
            sort = {bsr: 1,asktime: -1};
            query = {asktime: {$regex: '刚刚发布|天|年', $options: 'i'}}
        }
        else if (option.itemname === 'rentrsr') {
            coll = 'lj'+that.data.currentCity+'_rentrsr';
            sort = {rsr: -1,ruprice:1};
            //todo：根据当前用户已购商品的权限，加载城市列表
            this.getCity();
        }
        else if (option.itemname === 'stockrsr') {
            coll = 'rsr_wind';
            sort = {rsr_now: -1};
        }
        else if (option.itemname === 'bizcatalog') {
            coll = 'bizcatalog';
            sort = {updt: -1};
            query = {}
        }

        //设置cc_list控件的属性
        that.setData({
            '_cond.query': query,
            '_cond.coll': coll,
            '_cond.sort': sort,
            cb: cb,
        });
    },


    getCity:function () {
        let that = this;
        wx.request({
            url: cf.service.cityListUrl,
            data: {
                cond: {aa:'1',bb:2}
            },
            success: function (res) {
                let ret = res.data; //后端返回的是一个数组。
                that.setData({
                    cities:ret
                });

                console.log(ret);


                //如果后台返回的数据为空说明尚未建立用户信息
                // if ("0" === ret) {
                //     ut.debug('后台无数据。');
                // } else {
                //     ut.debug('后台有数据，将应答结果设置到rdata中', res);
                //     that.setData({
                //         'rdata': ret,//渲染表单中各个输入项的数据
                //     });
                //
                //     if(that.data._ccs.address){
                //         that.setData({
                //             'addrHidden': ut.getHiddenAddr(ret.address),
                //             'rdata.location': ret.location,
                //             'slocation': JSON.stringify(ret.location),
                //             'rdata.address': ret.address,
                //         });
                //         that.selectComponent("#cc_mapshow").initCc(app.globalData.location,that.data.rdata.location);
                //         //动态渲染当前地址到客户地址的距离
                //         ut.getTraffic4tx(app.globalData.address.address, ret.address, function (ret) {
                //             that.setData({
                //                 'traffic': ret,
                //             });
                //         });
                //     }
                //
                //     //初始化费用类别选择器CC
                //     that.selectComponent("#cc_charging")._initCharging(ret.biz_type);
                //
                //
                //     //根据DB数据渲染称呼CC
                //     if(that.data._ccs.mobile){
                //         that.setData({
                //             'rdata.mobile': ret.mobile,
                //         });
                //         that.selectComponent("#cc_nametitle").renderSexItem(ret.sex);
                //     }
                //
                //
                //     //商品类业务订单，若状态为get，则准备支付CC的数据，并显示支付按钮
                //     if (that.data.rdata.stat === 'bs_wait') {
                //         //为支付CC准备参数
                //         that.setData({
                //             'cc_rdata_pay.reqId': option.reqId,
                //             'cc_rdata_pay.cost': that.data.rdata.cost,
                //             'cc_rdata_pay.product_id': ret.biz_type,
                //             'cc_rdata_pay.body': cf.hint[ret.biz_type],
                //             'cc_rdata_pay.hide': false,
                //             'cc_rdata_pay.paystat': 'bs_paid',//TODO：无需配送的开关启用时，这里直接传送bs_received_f状态
                //         });
                //     } else {
                //         that.setData({
                //             'cc_rdata_pay.hide': true,
                //         });
                //     }
                //
                //     //设置闪烁提示
                //     that.data.rdata.stat==='start'? ut.showBlink(that):'';
                //
                //
                //     //更新供应商需要的按钮
                //     //console.log(that.data.cf.charging_type[that.data.rdata.biz_type].ownerId,app.globalData.userInfo.openId);
                //     if(that.data.cf.charging_type[that.data.rdata.biz_type].supplier_id.indexOf(app.globalData.userInfo.openId)>=0){
                //         that.setData({_isSupplier:true});
                //     }
                //
                //     //显示分享菜单项。例行功能放在最后。
                //     wx.showShareMenu({
                //         withShareTicket: true,
                //     });
                // }

                //})
            }
        })
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

        //this.data._cond.sort.bsr = 0-this.data._cond.sort.bsr;


        that.setData({
            list:[],
            _bsr: 0-that.data._bsr,
            '_cond.sort': {bsr: that.data._bsr,asktime: -1},

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

        that.setData({
            '_cond.query': {asktime:option.currentTarget.dataset.query},
        });
        this._reQuery();
    },
    _showSeenAmt:function (option) {
        let that = this;
        that.setData({
            _seeamt: 0-that.data._seeamt,
            '_cond.sort': {seeamt:that.data._seeamt},
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