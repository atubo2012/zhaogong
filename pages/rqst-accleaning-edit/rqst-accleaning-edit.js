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
        pageInfo: app.getPageInfo('rqst-edit'),//
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
            stat: 'wait',
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

        _crBlink:false
    },

    /**
     * v0.2地图路径规划功能的相关函数
     * TODO:封装到独立的CC中
     */
    goToCar2: function (e) {
        this.setData({
            trafficType: 'driving'
        });
        this.activeTab('driving');
        this.onLoad({reqId: this.data.reqId});
    },
    goToBus2: function (e) {
        this.setData({
            trafficType: 'transit'
        });
        this.activeTab('transit');
        this.onLoad({reqId: this.data.reqId});
    },
    goToRide2: function (e) {
        this.setData({
            trafficType: 'ridding'
        });
        this.activeTab('ridding');
        this.onLoad({reqId: this.data.reqId});
    },
    goToWalk2: function (e) {
        this.setData({
            trafficType: 'walking'
        });
        this.activeTab('walking');
        this.onLoad({reqId: this.data.reqId});
    },
    activeTab: function (tabName) {
        //遍历页签过程中，使指定的页签生效、其他页签失效
        for (let i = 0; i < this.data.tabInfo.length; i++) {
            if (tabName === this.data.tabInfo[i].mode) {
                this.data.tabInfo[i].isActive = true;
            } else {
                this.data.tabInfo[i].isActive = false;
            }
        }
        //渲染页面
        this.setData({
            tabInfo: this.data.tabInfo,
        });
    },

    // bindPickerChangeUprice: function (e) {
    //     let that = this;
    //
    //     this.setData({
    //         'rdata.uprice': Number(that.data.upriceList[e.detail.value]),
    //     });
    //
    //     console.log('typeof(uprice)=', typeof(that.data.rdata.uprice), that.data.rdata.uprice);
    // },
    // bindPickerChangeDuration: function (e) {
    //     ut.debug(e);
    //     let that = this;
    //     this.setData({
    //         'rdata.dura': Number(that.data.durationList[e.detail.value]),
    //     })
    // },



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
        //console.log(e.detail.location, e.detail.address, this.data.slocation);
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
        this.setData({'rdata.stat':'paid'});

    },
    // onUpriceChange: function (e) {
    //     console.log('onUpriceChange', e);
    //     this.setData({
    //         'rdata.uprice': e.detail
    //     });
    // },
    // onDuraChange: function (e) {
    //     console.log('onDuraChange', e);
    //     this.setData({
    //         'rdata.dura': e.detail
    //     });
    // },
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

        //获得CC的句柄，以备后用（新增模式下、修改模式下）
        let cc_charging = this.selectComponent("#cc_charging");
        let cc_nametitle = this.selectComponent("#nametitle");
        let cc_mapshow = this.selectComponent("#cc_mapshow");

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

                            'rdata.location': ret.location,
                            'slocation': JSON.stringify(ret.location),
                            'rdata.address': ret.address,
                            'rdata.osdt': ret.osdt,
                            'rdata.ostm': ret.ostm,
                            'rdata.cc_rdata': {'date': ret.osdt, 'time': ret.ostm},
                            'rdata.mobile': ret.mobile,

                            'rdata.cart':ret.cart,
                            'rdata.pics_list':ret.pics_list,
                            'rdata.clntInfo': ret.clntInfo,
                            'rdata.lborInfo': (ret.lborInfo ? ret.lborInfo : {}),
                            'addrHidden': ut.getHiddenAddr(ret.address),
                            'rdata.cost': ret.cost,
                            'charging_type':ret.biz_type,//不雅：库里的biz_type就是cc中的charging_type
                            'rdata.c2LBOR':ret.c2LBOR,
                            'rdata.c2CLNT':ret.c2CLNT,

                            'isLateThanNow' :ut.isLateThanNow(ret.osdt+' '+ret.ostm),
                        });

                        //初始化费用类别选择器CC
                        cc_charging._initCharging(ret.biz_type);
                        //根据DB数据渲染称呼CC
                        cc_nametitle.renderSexItem(ret.sex);

                        cc_mapshow.initCc(app.globalData.location,that.data.rdata.location);

                        //若订单状态为finish，则准备支付CC的数据，并显示支付按钮
                        if (that.data.rdata.stat === 'finish') {
                            //为支付CC准备参数
                            that.setData({
                                'cc_rdata_pay.reqId': option.reqId,
                                'cc_rdata_pay.cost': that.data.rdata.cost,
                                'cc_rdata_pay.product_id': ret.biz_type,
                                'cc_rdata_pay.body': cf.hint[ret.biz_type],
                                'cc_rdata_pay.hide': false,
                                'cc_rdata_pay.paystat': 'paid',
                            });
                        } else {
                            that.setData({
                                'cc_rdata_pay.hide': true,
                            });
                        }

                        //动态渲染当前地址到客户地址的距离
                        ut.getTraffic4tx(app.globalData.address.address, ret.address, function (ret) {
                            that.setData({
                                'traffic': ret,
                            });
                        });
                        /**
                         * 展示地图 //TODO:将敏感数据放到ZgConfig.js中
                         */
                        let myAmapFun = new amapFile.AMapWX({key: '2d15ece70392d0afd89dae800f78f94d'});
                        let to = '';
                        let from = '';
                        wx.getLocation({
                            success: function (res) {

                                //ut.debug('99999999999999', res, that.data.rdata.location);
                                //1、如果是带参数加载，则将初始参数记录在data对象中
                                if (typeof(option) !== 'undefined') {

                                    //1-1准备起止点的坐标参数
                                    from = res.longitude + ',' + res.latitude;
                                    let fromObj = {'latitude': res.latitude, 'longitude': res.longitude};
                                    //ut.debug('getLocation', from, fromObj);

                                    let location = that.data.rdata.location;
                                    to = location.longitude + ',' + location.latitude;
                                    let toObj = {
                                        'latitude': location.latitude,
                                        'longitude': location.longitude
                                    };
                                    //ut.debug('toObj', toObj);

                                    //1-2准备起止点的标记风格参数
                                    let markerFrom = {
                                        iconPath: "../../image/navi_start.png",
                                        id: 0,
                                        width: 23,
                                        height: 33
                                    };
                                    let markerTo = {
                                        iconPath: "../../image/navi_stop.png",
                                        id: 0,
                                        width: 23,
                                        height: 33
                                    };
                                    let markers = [
                                        (Object.assign(markerFrom, fromObj)),
                                        (Object.assign(markerTo, toObj))
                                    ];
                                    ut.debug('markers', markers);

                                    //1-3根据起止点的坐标，得出将显示的地图中央坐标
                                    let mapCenter = {
                                        longitude: (res.longitude + location.longitude) / 2,
                                        latitude: (res.latitude + location.latitude) / 2
                                    };
                                    ut.debug('mapCenter', mapCenter);

                                    //1-4将上述参数保存在data对象中便于生成地图使用
                                    that.setData({
                                        to: to,
                                        from: from,
                                        mapCenter: mapCenter,
                                        markers: markers
                                    })

                                } else {
                                    to = that.data.to;
                                    from = that.data.from;
                                }


                                //2准备路径规划参数
                                //2-1非公交类交通工具使用的参数对象
                                let params = {
                                    origin: from,
                                    destination: to,
                                    success: function (data) {
                                        let points = [];
                                        if (data.paths && data.paths[0] && data.paths[0].steps) {
                                            let steps = data.paths[0].steps;
                                            for (let i = 0; i < steps.length; i++) {
                                                let poLen = steps[i].polyline.split(';');
                                                for (let j = 0; j < poLen.length; j++) {
                                                    points.push({
                                                        longitude: parseFloat(poLen[j].split(',')[0]),
                                                        latitude: parseFloat(poLen[j].split(',')[1])
                                                    })
                                                }
                                            }
                                        }

                                        that.setData({
                                            polyline: [{
                                                points: points,
                                                color: "#0091ff",
                                                width: 6,
                                                arrowLine: true
                                            }],

                                            steps: data.paths[0].steps
                                        });
                                        if (data.paths[0] && data.paths[0].distance) {
                                            that.setData({
                                                distance: data.paths[0].distance + '米'
                                            });
                                        }
                                        if (data.paths[0] && data.paths[0].duration) {
                                            that.setData({
                                                durationGd: '(' + parseInt(data.paths[0].duration / 60) + '分钟' + ')'
                                            });
                                        }
                                        if (data.taxi_cost) {
                                            that.setData({
                                                cost: '打车约' + parseInt(data.taxi_cost) + '元'
                                            });
                                        }
                                    },
                                    fail: function (info) {
                                        ut.error('OAERROR:非公交类路径规划服务调用失败', info)
                                    }
                                };

                                //2-2公交交通使用的参数对象
                                let paramsTransit = {
                                    origin: from,
                                    destination: to,
                                    city: '上海',
                                    success: function (data) {
                                        console.log('1111111111111111111', data);
                                        let transits = [];
                                        if (data && data.transits) {
                                            transits = data.transits;
                                            for (let i = 0; i < transits.length; i++) {
                                                let segments = transits[i].segments;
                                                transits[i].transport = [];
                                                for (let j = 0; j < segments.length; j++) {
                                                    if (segments[j].bus && segments[j].bus.buslines && segments[j].bus.buslines[0] && segments[j].bus.buslines[0].name) {
                                                        let name = segments[j].bus.buslines[0].name;
                                                        name = name + '\n\n  [' + segments[j].bus.buslines[0].departure_stop.name + '站上，' + segments[j].bus.buslines[0].arrival_stop.name + '站下]'
                                                        if (j !== 0) {
                                                            name = '--' + name;
                                                        }
                                                        transits[i].transport.push(name);
                                                    }
                                                }
                                            }

                                            ut.debug('公交路线', transits);
                                        }
                                        that.setData({
                                            transits: transits
                                        });

                                    },
                                    fail: function (info) {
                                        console.log('000000000000000000000000', info);
                                    }
                                };

                                //3根据不同的交通方式调用对应的api生成地图
                                if (that.data.trafficType === 'driving') {
                                    myAmapFun.getDrivingRoute(params);
                                } else if (that.data.trafficType === 'ridding') {
                                    myAmapFun.getRidingRoute(params);
                                } else if (that.data.trafficType === 'walking') {
                                    myAmapFun.getWalkingRoute(params);
                                } else if (that.data.trafficType === 'transit') {
                                    myAmapFun.getTransitRoute(paramsTransit)
                                }
                            }
                        });



                        //设置闪烁提示
                        that.data.rdata.stat==='start'? ut.showBlink(that):'';

                        //显示分享菜单项。例行功能放在最后。
                        wx.showShareMenu({
                            withShareTicket: true,
                            // success: function (e) {
                            //     console.log('in wx.showShareMenu1',e)
                            // }
                            // ,fail: function (e) {
                            //     console.log('in wx.showShareMenu2',e)
                            // }
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
                });
                cc_charging._initCharging(option.charging_type);
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


        //防止重复提交
        ut.disableButton(this);


        //检查输入内容合法性
        //若坐标为空，则提示选择地图
        if(!that.data.rdata.location || !that.data.rdata.address ){
            ut.alert('请填入正确的地址','loading');
            let ccmap = this.selectComponent("#ccmap");
            ccmap._chooseAddress();
            ut.enableButton(this);
            return;
        }
        if(!ut.isPoneAvailable(that.data.rdata.mobile)){
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
        rdata.cost = Number(rdata.cost);    //数值类数据要转换


        //设置订单的状态
        let st = e.detail.target.dataset.submittype;
        if (st === 'delete') {        //客户删除
            rdata.stat = 'delete';
            rdata.rdst = '0';
        } else if (st === 'close') {   //客户关闭
            rdata.stat = 'close';
        } else if (st === 'clnt-cancel') { //客户取消
            rdata.stat = 'clnt-cancel';
        } else if (st === 'start') {       //阿姨开工
            rdata.stat = 'start';
            rdata.begin_time = new Date();  //开始计时
        } else if (st === 'lbor-cancel') {  //阿姨取消后，订单回复为待接单
            rdata.stat = 'wait';
            rdata.lborInfo = {};
        } else if (st === 'get') {      //阿姨上单，将当前用户的信息作为lbor信息发送到后台
            //刷新用户的信息，以便工人身份被审核后可以立即接单。
            app.checkUser((res1) => {
                    ut.debug('从后端pull最新的用户信息 ', res1);
                    app.globalData.userInfo = res1.data;
                }
            );
            rdata.stat = 'get';
            rdata.lborInfo = app.globalData.userInfo;//上单用户的信息

            /**
             * 校验用户的角色，如果不是LBOR角色，则提示是否进行认证，如同意，则跳转到用户信息管理界面
             * LBOR录入专有信息提交（服务类别、居住地址、服务范围、身份证），短信通知审核人请审核。
             * 审核通过后，通知LBOR审核已通过。
             * 登录后默认进入LBOR对应类别的单子列表。 TODO:以下的IF else可以尝试在wxml中根据用户角色和审核状态来控制是否显示按钮，用文字描述+链接的方式给用户提示
             */
            // if ('LBOR' !== app.globalData.userInfo.role) {
            //     goOne = false;
            //     ut.showModal('温馨提示', '亲！请补充服务人员相关信息，10分钟内通过审核后就可以接单了，马上去？', () => {
            //         wx.navigateTo({
            //             url: '../user-edit/user-edit?type=LBOR&reqId=' + that.data.reqId
            //         });
            //     }, () => {
            //         console.log('选择不补充服务人员信息，应停留在本页，不继续提交');
            //     });
            //     return;
            // } else if ('LBOR' === app.globalData.userInfo.role && !app.globalData.userInfo.rolecfm) {
            //     ut.showModal('温馨提示', '角色尚未审核通过，请稍后再试。再看看别的单子？', () => {
            //         wx.navigateTo({
            //             url: '../rqst-list/rqst-list'
            //         });
            //     }, () => {
            //         console.log('呆在这不动');
            //     });
            //     return;
            // }
        }  else if (st === 'finish') {      //阿姨完工
            rdata.stat = 'finish';


            rdata.cost = rdata.cart.total_cost; //商品总金额
            rdata.end_time = new Date();        //结束计时
            //按开始时间和结束时间计算耗时
            rdata.time_cost = ((new Date(rdata.end_time) - new Date(rdata.begin_time)) / 1000 / 60).toFixed(0);//分钟

            //必要时可在此追加计算工时费
            console.log(
                '耗时：' + rdata.time_cost + '分钟',
                '费用：' + rdata.cost
            );
        }
        else {//新建单子
            ut.debug('submitType未被设置，表明是新建订单，则补充客户信息', rdata);

            rdata.clntInfo = app.globalData.userInfo;
            //todo：根据字段配置信息，执行校验规则.再此校验数据的的规则：必填项、数字格式
            rdata.cost = 0;
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
                            title: retMsg.indexOf('REQ') ? cf.hint.H_SUCCESS : retMsg,
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
                                }, 2000) //延迟时间


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
                'rdata.stat': 'wait'
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