'use strict';
let ut = require('../../utils/utils.js');
let amapFile = require('../../vendor/amap-wx.js');
const app = getApp();
const cf = app.globalData.cf;

Page({
    data: {
        /**
         * 页面使用的例行参数
         */
        pageInfo: cf.motto['rqst-edit'],//
        submitButtonDisabled: false,//提交按钮默认状态，点击提交后设置为true，避免重复提交
        showTips: false,//默认不显示异常信息
        preview: true,  //初始默认为显示，点击修改后，隐藏详情展示信息，只显示编辑表单
        app: app,       //app.js句柄，便于页面调用app.js中的属性
        cf:cf,          //便于业页面中使用配置类信息

        /**
         * RD(Remote data)将发往后台保存入库的业务数据，其中包括特殊组件的实际取值
         */
        rdata: {
            //默认的标配初始数据，在这里显式设置，开发体验更好，可以第一时间了解模块
            rdst: '1',      //记录状态：0无效，1有效，2过期，3关闭
            osdt: ut.getToday('-'),
            ostm: ut.getNow(':'),
            stat: 'bs_wait',
            save_userinfo:false,//后台根据此条件判断是否将订单中的手机号自动存入用户信息表中
        },

        /**
         * RC(Rending Component)表单控件被初始化渲染时使用的数据。
         */
        start_time: ut.getNow(':'),

        cc_rdata: {},//cc_time_picker的properties对象

        /**
         * 地图控件相关的属性
         */
        addressList: [],     //地址选择器关联的数组
        traffic: {},         //距离
        tabInfo: [           //地图上方的页签控件
            {mode: 'walking', desc: '步行', method: 'goToWalk2', isActive: true},
            {mode: 'ridding', desc: '骑车', method: 'goToRide2', isActive: false},
            {mode: 'transit', desc: '公交', method: 'goToBus2', isActive: false},
            //{mode: 'driving', desc: 'car', method: 'goToCar2', isActive: false},
        ],
        addrHidden: '',          //用来保存被屏蔽后的地址
        trafficType: 'walking',  //页面加载时默认选中的交通方式

        _crBlink:false,
        _isSupplier:false           //默认不显示供应商
    },

    /**
     * 自定义控件CC触发的事件处理函数，主要用来设置主调页面js文件中的rdata。
     * @param e
     */
    //在CC地图中选择地址按下确定时触发，将地址坐标对象、地址文字保存在rdata中，地址字符串设置到
    onChooseAddressEvent: function (e) {
        this.setData({
            'rdata.address': e.detail.address,
            'rdata.location': e.detail.location,
            'slocation': JSON.stringify(e.detail.location)
        });

    },
    //在CC中选中输入手机号时，设置到rdata.mobile中
    onCheckMobileEvent: function (e) {
        //console.log('onCheckMobileEvent:',e);
        this.setData({
            'rdata.mobile': e.detail.mobile
        });

    },
    onDateChange: function (e) {
        //console.log('onDateChange', e);
        this.setData({
            'rdata.osdt': e.detail.cc_rdata.date
        });
    },
    onTimeChange: function (e) {
        //console.log('onTimeChange', e);
        this.setData({
            'rdata.ostm': e.detail.cc_rdata.time
        });
    },
    onNameTitleChangeEvent:function (e) {
        //console.log('onNameTitleChangeEvent',e);
        this.setData({
            'rdata.clfn':e.detail.name,
            'rdata.sex': e.detail.sex
        });

    },
    onPaySuccess: function (e) {
        //console.log('onPaySuccess',e.detail);
        this.setData({'rdata.stat':'bs_paid'});
    },

    //文件上传事件触发，刷新rdata中的数据
    onUploadChangeEvent:function(e){
        this.setData({
            'rdata.pics_list': e.detail.picsList
        });
    },
    //cart数据重新渲染
    onCartChange:function (e) {
        //console.log(e);
        this.setData({
            'rdata.cart':e.detail.cart
        })
    },
    onCall:function (e) {
        console.log(e);
        wx.makePhoneCall({
            phoneNumber:e.currentTarget.dataset.mobile
        })
    },


    /**
     * 功能：页面内容加载
     * 流程：
     * 1、准备CC句柄
     * 2、ut.checkSession(),校验会话有效性。启用该功能后体验不佳，禁用该功能后，可以将订单中的用户信息存入当前用户信息中
     * 3、更新模式下：
     *  （1）显示加载中提示，发起请求获取后台数据。todo，在ut.request()中内置显示loading和hideLoding的函数
     *  （2）向that.data.rdata中更新数据。todo：使用utils根据应答结果中的数据遍历keys并设置rdata的值
     *  （3）根据显示的需要对应答数据进行处理，便于展现。如隐藏地址门牌号ut.getHiddenAddr、slocation等。
     *  （4）通过CC句柄调用_initCc()，完成cc初始化和渲染。
     *  （5）根据订单状态、业务要素来初始化支付参数，以备支付
     *  （6）调用例行函数，显示分享按钮、启用提交按钮，隐藏loading提示
     * 4、新增模式下：
     *  （1）ut.checkSession()，校验会话有效性
     *  （2）初始化数据：手机号、用户名、上门时间、业务类别
     *  （3）通过CC句柄调用_initCc()，完成cc初始化和渲染。
     *
     * @param option 页面参数
     */
    onLoad: function (option) {
        let that = this;

        //ut.checkSession(app, that, function (params2) {
        //I：如果id字段不为空，则进入编辑模式，从后台获取数据，然后用setData(rdata:res.data[0])，渲染页面数据。
        if (typeof(option.reqId) !== "undefined") {
            ut.debug('进入编辑模式.....加载业务数据');

            //便于地图行程切换时使用参数
            that.setData({
                reqId: option.reqId
            });

            //从后台获取数据
            wx.request({
                url: cf.service.rqstListUrl,
                data: {
                    reqId: option.reqId
                },
                success: function (res) {
                    let ret = res.data[0]; //后端返回的是一个数组。
                    //如果后台返回的数据为空说明尚未建立用户信息
                    if ("0" === ret) {
                        ut.debug('后台无数据。');
                    } else {
                        ut.debug('后台有数据，将应答结果设置到rdata中', res);
                        that.setData({
                            'rdata': ret,//渲染表单中各个输入项的数据

                            'rdata.osdt': ret.osdt,
                            'rdata.ostm': ret.ostm,
                            'rdata.cc_rdata': {'date': ret.osdt, 'time': ret.ostm},

                            'rdata.cart':ret.cart,
                            'rdata.pics_list':ret.pics_list,
                            'rdata.clntInfo': ret.clntInfo,
                            'rdata.lborInfo': (ret.lborInfo ? ret.lborInfo : {}),
                            'rdata.cost': ret.cost,
                            'charging_type':ret.biz_type,//不雅：库里的biz_type就是cc中的charging_type
                            '_ccs': cf.charging_type[ret.biz_type].ccs,//页面使用_ccs来显示或隐藏CC，让页面代码更加简洁

                            'rdata.c2LBOR':ret.c2LBOR,
                            'rdata.c2CLNT':ret.c2CLNT,

                            'rdata.supplier_id':ret.supplier_id,

                            'isLateThanNow' :ut.isLateThanNow(ret.osdt+' '+ret.ostm),
                        });

                        if(that.data._ccs.address){
                            that.setData({
                                'addrHidden': ut.getHiddenAddr(ret.address),
                                'rdata.location': ret.location,
                                'slocation': JSON.stringify(ret.location),
                                'rdata.address': ret.address,
                            });
                            that.selectComponent("#cc_mapshow").initCc(app.globalData.location,that.data.rdata.location);
                            //动态渲染当前地址到客户地址的距离
                            ut.getTraffic4tx(app.globalData.address.address, ret.address, function (ret) {
                                that.setData({
                                    'traffic': ret,
                                });
                            });
                        }

                        //初始化费用类别选择器CC
                        that.selectComponent("#cc_charging")._initCharging(ret.biz_type);


                        //根据DB数据渲染称呼CC
                        if(that.data._ccs.mobile){
                            that.setData({
                                'rdata.mobile': ret.mobile,
                            });
                            that.selectComponent("#cc_nametitle").renderSexItem(ret.sex);
                        }


                        //商品类业务订单，若状态为get，则准备支付CC的数据，并显示支付按钮
                        if (that.data.rdata.stat === 'bs_wait') {
                            //为支付CC准备参数
                            that.setData({
                                'cc_rdata_pay.reqId': option.reqId,
                                'cc_rdata_pay.cost': that.data.rdata.cost,
                                'cc_rdata_pay.product_id': ret.biz_type,
                                'cc_rdata_pay.body': cf.hint[ret.biz_type],
                                'cc_rdata_pay.hide': false,
                                'cc_rdata_pay.paystat': 'bs_paid',//TODO：无需配送的开关启用时，这里直接传送bs_received_f状态
                            });
                        } else {
                            that.setData({
                                'cc_rdata_pay.hide': true,
                            });
                        }

                        //设置闪烁提示
                        that.data.rdata.stat==='start'? ut.showBlink(that):'';


                        //更新供应商需要的按钮
                        //console.log(that.data.cf.charging_type[that.data.rdata.biz_type].ownerId,app.globalData.userInfo.openId);
                        if(that.data.cf.charging_type[that.data.rdata.biz_type].supplier_id.indexOf(app.globalData.userInfo.openId)>=0){
                            that.setData({_isSupplier:true});
                        }

                        //显示分享菜单项。例行功能放在最后。
                        wx.showShareMenu({
                            withShareTicket: true,
                        });
                    }

                    //})
                }
            })

        } else {


            ut.debug('进入新增模式，隐藏详情页面', location);
            let dt = ut.getLater(2,false);
            ut.checkSession(null, app, that, () => {
                that.setData({
                    preview: false,
                    'rdata.mobile': app.globalData.userInfo.mobile,
                    'rdata.save_userinfo': app.globalData.userInfo.mobile==='', //若当前用户的手机号尚未设置，则告知后台将手机号自动保存到用户信息表中
                    'rdata.clfn': app.globalData.userInfo.name ? app.globalData.userInfo.name:app.globalData.userInfo.nickName, //若用户尚未注册，则默认填写

                    'rdata.cc_rdata': ut.getLater(2,false),
                    'rdata.osdt': dt.date,
                    'rdata.ostm': dt.time,
                    'charging_type': option.charging_type,
                    'rdata.pics_list': [],
                    '_ccs': cf.charging_type[option.charging_type].ccs,
                    'rdata.supplier_id':cf.charging_type[option.charging_type].supplier_id
                });
                console.log('_ccs',that.data._ccs);
                that.selectComponent("#cc_charging")._initCharging(option.charging_type);

                if(app.globalData.userInfo.role==='LBOR'){
                    ut.alertThenCall('请切换角色',()=>{
                        ut.disableButton(that);
                    });
                }
            });

        }




    },
    onShow:function (option) {
        //如果希望用户注册后才能创建订单，则调用以下函数
        //app.isNewUser();
    },

    /**
     * 功能：提交数据到后台
     * 流程：
     * 1、例行句柄准备：准备that、CC句柄、输出事件detail
     * 2、禁用提交按钮
     * 3、检查输入内容：
     *  （1）必输项、输入内容的合规性、不同输入项之间的逻辑关系。
     *  （2）校验失败的显示topTips(自动禁用按钮)，直接return。TODO：对常用字段的合法性调用公函校验，让业务代码更加简洁
     * 4、准备提交到后台的数据that.data.rdata。
     * 5、根据提交按钮绑定的参数，补充rdata数据，如订单状态，开工时的开始时间
     *  （1）校验特定状态下，当前用户是否有权限操作。如只有审核过的lbor才可以接单
     *
     * 2、ut.checkSession(),校验会话有效性。启用该功能后体验不佳，禁用该功能后，可以将订单中的用户信息存入当前用户信息中
     * 3、更新模式下：
     *  （1）显示加载中提示，发起请求获取后台数据。todo，在ut.request()中内置显示loading和hideLoding的函数
     *  （2）向that.data.rdata中更新数据。todo：使用utils根据应答结果中的数据遍历keys并设置rdata的值
     *  （3）根据显示的需要对应答数据进行处理，便于展现。如隐藏地址门牌号ut.getHiddenAddr、slocation等。
     *  （4）通过CC句柄调用_initCc()，完成cc初始化和渲染。
     *  （5）根据订单状态、业务要素来初始化支付参数，以备支付
     *  （6）调用例行函数，显示分享按钮、启用提交按钮，隐藏loading提示
     * 4、新增模式下：
     *  （1）ut.checkSession()，校验会话有效性
     *  （2）初始化数据：手机号、用户名、上门时间、业务类别
     *  （3）通过CC句柄调用_initCc()，完成cc初始化和渲染。
     *
     * @param e
     */
    onSubmit: function (e) {
        let goOne = true;
        let that = this;
        let rdata = e.detail.value;//获取本类业务表单中非CC组件输入的数据
        ut.debug('form的数据1:', rdata,that.data,'formId='+e.detail.formId);

        let _ccs = this.data._ccs;

        //防止重复提交
        ut.disableButton(this);


        //检查输入内容合法性
        //若坐标为空，则提示选择地图
        if((!that.data.rdata.location || !that.data.rdata.address) && _ccs.address ){
            ut.alert('请填入正确的地址','loading');
            this.selectComponent("#ccmap")._chooseAddress();
            ut.enableButton(this);
            return;
        }
        if(!ut.isPoneAvailable(that.data.rdata.mobile) && _ccs.mobile){
            ut.showTopTips(that,'输入正确的手机号','focusMobile',cf);
            return;
        }
        if(!that.data.rdata.cart || that.data.rdata.cart.goods.length<1 ){
            ut.showTopTips(that,'请添加服务类别','bizTypeFocus',cf);
            return;
        }


        //准备将提交到后台的数据 TODO：以下这段代码可以优化为直接从this.data.rdata中获取，避免重复性的变量设置
        rdata.location = that.data.rdata.location;
        rdata.address = that.data.rdata.address;
        rdata.mobile = that.data.rdata.mobile;
        rdata.osdt = that.data.rdata.osdt;
        rdata.ostm = that.data.rdata.ostm;
        rdata.cart = that.data.rdata.cart;
        rdata.sex = that.data.rdata.sex;
        rdata.clfn = that.data.rdata.clfn;
        rdata.pics_list = that.data.rdata.pics_list;
        rdata.save_userinfo = that.data.rdata.save_userinfo;
        rdata.clntInfo = that.data.rdata.clntInfo;
        rdata.cost = Number(that.data.rdata.cost);    //数值类数据要转换
        rdata.supplier_id = that.data.rdata.supplier_id;


        //设置订单的状态
        let st = e.detail.target.dataset.submittype;
        if (st === 'delete') {        //客户删除
            rdata.stat = 'delete';
            rdata.rdst = '0';
        } else if (st === 'close') {   //客户关闭
            rdata.stat = 'close';
        } else if (st === 'bs_cancel_f') { //客户取消
            rdata.stat = 'bs_cancel_f';
        } else if (st === 'bs_delivered') { //阿姨开工
            rdata.stat = 'bs_delivered';
            rdata.lborInfo = app.globalData.userInfo;//登记当前发货人
            //rdata.begin_time = new Date();  //开始计时
        }else if (st === 'bs_received_f') { //买家收到货
            rdata.stat = 'bs_received_f';
        }else if (st === 'bs_returning') { //买家发起退货
            rdata.stat = 'bs_returning';
        }else if (st === 'bs_returned') { //卖家收到退货
            rdata.stat = 'bs_returned';
        }else if (st === 'bs_unpaid_f') { //卖家点击退款
            rdata.stat = 'bs_unpaid_f';
        }

        // else if (st === 'lbor-cancel') {  //阿姨取消后，订单回复为待接单
        //     rdata.stat = 'bs_wait';
        //     rdata.lborInfo = {};
        // }else if (st === 'get') {      //阿姨上单，将当前用户的信息作为lbor信息发送到后台
        //     //刷新用户的信息，以便工人身份被审核后可以立即接单。
        //     app.checkUser((res1) => {
        //             ut.debug('从后端pull最新的用户信息 ', res1);
        //             app.globalData.userInfo = res1.data;
        //         }
        //     );
        //     rdata.stat = 'get';
        //     rdata.lborInfo = app.globalData.userInfo;//上单用户的信息
        //
        // }  else if (st === 'finish') {      //阿姨完工
        //     rdata.stat = 'finish';
        //     rdata.cost = rdata.cart.total_cost; //商品总金额
        //     rdata.end_time = new Date();        //结束计时
        //     //按开始时间和结束时间计算耗时
        //     rdata.time_cost = ((new Date(rdata.end_time) - new Date(rdata.begin_time)) / 1000 / 60).toFixed(0);//分钟
        //     //必要时可在此追加计算工时费
        //     console.log(
        //         '耗时：' + rdata.time_cost + '分钟',
        //         '费用：' + rdata.cost
        //     );
        // }
        else {//新建单子
            ut.debug('submitType未被设置，表明是新建订单，则补充客户信息', rdata);

            rdata.clntInfo = app.globalData.userInfo;
            //todo：根据字段配置信息，执行校验规则.再此校验数据的的规则：必填项、数字格式
            rdata.cost = rdata.cart.total_cost;
            rdata.stat='bs_wait';
        }



        if (goOne) {
            //console.log('rdata', rdata);
            wx.request({
                url: cf.service.rqstEditUrl,
                data: {
                    /**
                     *前端的参数通过rdata封装，不用在data中按输入域设置参数值，以减少前端代码量。
                     *后端程序通过let p = JSON.parse(req.query.rdata)，获得rdata对象，
                     * 用p.name方式获取前端页面上输入的参数值
                     */
                    rdata: rdata
                },
                header: {
                    'session3rdKey': wx.getStorageSync('session3rdKey'),
                },
                success: function (res) {
                    ut.checkSession(res, app, that, function (option) {
                        let retMsg = res.data;

                        wx.showToast({
                            title: retMsg.indexOf('REQ')>=0 ? cf.hint.H_SUCCESS : retMsg,
                            icon: 'success',
                            duration: cf.vc.ToastShowDurt,
                            success: function () {
                                //准备msg文件中所需要的内容TODO:将链接也作为参数传到下一页，或将下面的代码封装成一个函数。
                                app.globalData['result'] = {rtype: 'success', rdesc: '操作成功', ndesc: '查看我的订单'};

                                setTimeout(function () {
                                    //要延时执行的代码
                                    wx.redirectTo({
                                        url: '../../pages/msg/msg'
                                    });
                                }, 2000); //延迟时间


                                that._pushMessage(e.detail.formId, rdata, retMsg, 'sTbJan_nyuRbP5CNHezzTpISFn5b0U8QJBaKQz2X0ac', 'pages/index/index');
                            }
                        });
                    });
                },
                complete: function (res) {
                    ut.info("下单完成");
                }
            });
        }
    },

    /**
     * 根据消息模板发送消息给用户 TODO:目前尚不支持向非提交表单用户发送通知消息。各类通知功能应被统一封装后发送。
     * @param formID
     * @param p
     * @param reqId
     * @param template_id
     * @param pageurl
     */
    _pushMessage: function (formID, p, reqId, template_id, pageurl) {
        let that = this;

        console.log('in pushMessage:',p);
        let openId = '';
        let os = p.stat;
        if (os === 'get' || os === 'start' || os === 'finish' || os === 'lbor-cancel') {
            openId = p.clntInfo.openId;
        } else if (os === 'paid' || os === 'clnt-cancel') {
            openId = p.lborInfo.openId;
        }
        let stat = {
            touser: openId,//openId
            template_id: template_id,//模板消息id，
            page: pageurl,//'pages/index/index',//点击详情时跳转的主页
            form_id: formID,//formID

            data: {//下面的keyword*是设置的模板消息的关键词变量 TODO:考虑用配置方式将数据动态生成
                "keyword1": {
                    "value": cf.hint[that.data.charging_type],
                    "color": "#4a4a4a"
                },
                "keyword2": {
                    "value": that.data.rdata.ostm,
                    "color": "#4a4a4a"
                },
                "keyword3": {
                    "value": that.data.rdata.clfn,
                    "color": "#4a4a4a"
                },
                "keyword4": {
                    "value": that.data.rdata.cart.total_cost,
                    "color": "#4a4a4a"
                },
                "keyword5": {
                    "value": that.data.rdata.address,
                    "color": "#4a4a4a"
                },
                "keyword6": {
                    "value": cf.hint[that.data.rdata.stat],
                    "color": "#4a4a4a"
                },
                "keyword7": {
                    "value": reqId,
                    "color": "#4a4a4a"
                },
            },
            color: 'red',//颜色
            emphasis_keyword: 'keyword1.DATA'//需要着重显示的关键词
        };
        wx.request({
            url: cf.service.statPushUrl,
            data: {'stat': stat},
            method: 'POST',
            success: function (res) {
                console.log("push msg res", res);
            },
            fail: function (err) {
                console.log("push err", err);
            }
        });
    },



    /**
     * 流程环节按钮处理事件
     */
    //去注册
    goRegist: function () {
        wx.navigateTo({
            url: '../user-edit/user-edit'
        })
    },
    //去登录
    goLogin: function () {
        wx.switchTab({
            url: '../index/index'
        })
    },
    //调转到评价界面
    goComment: function (e) {
        //ut.debug(e);
        let assesseeOpenId = '';

        //如果当前角色是客户，则被评价对象是阿姨，应传递阿姨的id
        if (app.globalData.userInfo.role === 'CLNT') {
            assesseeOpenId = this.data.rdata.lborInfo.openId;
        } else {
            assesseeOpenId = this.data.rdata.clntInfo.openId;
        }

        //根据角色不同，设置被评价人的名字
        wx.navigateTo({
            url: '../cmmt-edit/cmmt-edit?reqId=' + this.data.reqId +
            '&assesseeOpenId=' + assesseeOpenId +
            '&role=' + app.globalData.userInfo.role
        })
    },
    //点击【修改】或【再来一单】时显示form隐藏详情
    changePreview: function (e) {
        let that = this;
        this.setData({
            preview: !this.data.preview,
        });

        let st = e.target.dataset.submittype;

        if (st === 'onemore') {
            ut.debug('再来一单,清空reqId');

            let address = this.data.rdata.address;
            let location = this.data.rdata.location;
            //console.log(address);
            //清理表单中的各种数据
            that.setData({
                'rdata': {},
            });

            //加载表单中的新单必要信息 TODO:尝试可否先清空rdata，然后再通过onload(options)方法创建新订单。注意时间
            this.setData({
                'rdata.reqId': '',
                'rdata.mobile': app.globalData.userInfo.mobile, //默认取自当前用户的手机号
                'rdata.address': address,
                'rdata.location': location,
                'rdata.cc_rdata': {'date': ut.getToday('-'), 'time':ut.getNow(':') },
                'rdata.stat': 'bs_wait'
            });
        }
    },


    /**
     * 页面常用功能的函数
     */
    //分享
    onShareAppMessage: function (res) {
        if (res.from === 'button') {
            // 来自页面内转发按钮
            //console.log('onShareAppMessage', res)
        }
        return {
            title: '',
            path: '/pages/rqst-accleaning-edit/rqst-accleaning-edit?reqId=' + this.data.rdata.reqId,
            success: (res) => {
                //console.log(res);
                // wx.getShareInfo({
                //     shareTicket: res.shareTickets[0],
                //     success: function (res) {
                //         console.log('encryptedData', res.encryptedData)
                //         console.log('iv:', res.iv)
                //     }
                // });
            }
        }
    },
});