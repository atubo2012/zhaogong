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
        preview: true,  //初始默认为显示，点击修改后，进入编辑模式。
        app: app,        //app.js句柄，便于页面调用app.js中的方法


        /**
         * 将发往后台保存入库的业务数据，其中包括特殊组件的实际取值
         */
        rdata: {
            //默认的标配初始数据，在这里显式设置，开发体验更好，可以第一时间了解模块
            rdst: '1',      //记录状态：0无效，1有效，2过期，3关闭

            osdt: ut.getToday('-'),
            ostm: ut.getNow(':'),      //TODO:将时间改为整点小时和30分钟，参考滴滴出行
            stat: 'wait',

        },
        start_time: ut.getNow(':'),


        //TODO:可将以下码表类的信息统一放在config.js中（静态保存，或从后端动态下载），便于管理。

        /**
         * 页面组件中使用的默认参数
         */
        toolList: [
            {name: '有工具', value: '有工具'},
            {name: '阿姨带', value: '阿姨带', checked: true},
            {name: '代我买', value: '帮我买'}
        ],
        items: [
            {name: 'Y', value: '有宠物'},
            {name: 'N', value: '无', checked: true},
        ],
        sexItems: [
            {name: '先生', value: '先生', checked: true},
            {name: '女士', value: '女士'},
        ],
        upriceList: [35, 40],     //保洁常用的单价报价
        durationList: [2, 3, 4],   //保洁常用的工时


        hideSC: true,//默认不显示动态密码和发送按钮
        buttonDesc: '发送',//验证码发送按钮


        smsCode: '',//短信认证码
        second: cf.runtimeConfig.countDownSecond, //再次发送验证码按钮前需等待的时间
        oldMobile: '',//当前用户的手机号，加载本页时初始化。
        newMobile: '',//mobile字段中输入的值，只要不与oldMobile相同，则显示“验证码区域”，第11位输入完成后，比较是否与oldMobile不同，如不同则显示在验证完认证码后，该值被设置到rdata.mobile中；如该值与oldMobile相等，则隐藏验证码输入框

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


    },

    /**
     *
     * @param res
     * @returns {{title: string, path: string}}
     */
    onShareAppMessage: function (res) {
        if (res.from === 'button') {
            // 来自页面内转发按钮
            console.log('onShareAppMessage',res)
        }
        return {
            title: '临时保洁',
            path: '/pages/rqst-edit/rqst-edit?reqId=' + this.data.rdata.reqId,
            success:(res)=> {
                wx.getShareInfo({
                    shareTicket: res.shareTickets[0],
                    success: function (res) {
                        console.log('encryptedData',res.encryptedData)
                        console.log('iv:',res.iv)
                    }
                });
            }
        }
    },


    /**
     * 订单支付按下后的处理
     */
    payTap: function () {
        let that = this;


        let out_trade_no = cf.runtimeConfig.getOutTradeNo(that.data.rdata.reqId);           //开发环境中使用临时生成的交易编号
        let total_fee = (that.data.rdata.cost * 100 * cf.runtimeConfig.payDisct).toFixed(0);  //开发环境中对实际金额降低100倍支付
        console.log('统一下单RP', out_trade_no, total_fee);


        wx.request({
            url: cf.service.wxpayUrl,
            data: {
                /**
                 * 商户支付的订单号由商户自定义生成，微信支付要求商户订单号保持唯一性（建议根据当前系统时间加随机序列来生成订单号）。
                 * 重新发起一笔支付要使用原订单号，避免重复支付；
                 * 已支付过或已调用关单、撤销（请见后文的API列表）的订单号不能重新发起支付。
                 */
                out_trade_no: out_trade_no,
                total_fee: total_fee,
                openid: app.globalData.userInfo.openId,

                //商品类别丰富后，即可再次扩展，也可从订单信息中获得。TODO:在订单中记录商品类别(body)和商品编号(product_id)。
                body: '家政-临时保洁',//body是两级商品类别的描述信息，两级描述之间用减号分割
                product_id: 'gt_temp_clean',//product_id是特定商品类别项下的商品编号。
            },
            header: {
                'session3rdKey': wx.getStorageSync('session3rdKey'),
            },
            success: function (res) {
                ut.checkSession(res, app, that, function (option) {
                    let payModel = res.data;
                    console.log('统一下单RD=', payModel, res);

                    if (res.data.status === '100') {
                        wx.requestPayment({
                            'timeStamp': payModel.timestamp,
                            'nonceStr': payModel.nonceStr,
                            'package': payModel.package,
                            'signType': 'MD5',
                            'paySign': payModel.paySign,
                            'success': function (res1) {
                                console.log('支付成功，结果=', res1);

                                if (res1.errMsg === 'requestPayment:ok') {
                                    //TODO可以显示倒计时，订单生成中。
                                    wx.request({
                                        url: cf.service.wxpayQueryUrl,
                                        data: {
                                            out_trade_no: out_trade_no,
                                        },
                                        success: function (res3) {
                                            console.log(res3);
                                            wx.showToast({
                                                title: '支付成功',
                                                icon: 'success',
                                                duration: cf.vc.ToastShowDurt
                                            });
                                            that.setData({'rdata.stat': 'paid'});
                                        }
                                    })
                                }
                            },
                            'fail': function (res2) {
                                console.log('支付失败，结果:', res2);
                            }
                        })
                    }
                });
            },
            fail: function (res) {
                console.log('后端支付服务异常:', res);
            }
        })
    },

    /**
     * 用户录入手机号时，检查是否需要发送短信认证码
     * @param e
     */
    setMobile: function (e) {
        this.setData({
            newMobile: e.detail.value
        });

        //录入内容不是当前用户的默认手机号，显示发送短信认证码功能。否则隐藏发送短信认证码功能。
        if (e.detail.value !== app.globalData.userInfo.mobile) {
            this.setData({
                hideSC: false
            })
        } else if (e.detail.value === app.globalData.userInfo.mobile) {
            this.setData({
                'rdata.mobile': e.detail.value,
                hideSC: true
            })
        }
    },

    /**
     * 功能：发送验证码
     * 算法：
     * 1、禁用发送按钮，防止重复点击
     * 2、如格式不正确，则恢复发送按钮，并提示格式错误
     * 3、如格式正确，生成动态码，光标移到动态码栏位
     * 4、发送短信指令：动态码、发送开关、手机号、openId
     * @param e
     */
    checkMobile: function (e) {
        let _that = this;

        //按钮禁用，防止重复提交
        this.setData({
            buttonDisabled: true
        });

        if (!ut.isPoneAvailable(this.data.newMobile)) { //如格式错误，提示用户修改手机号
            ut.showToast("手机号格式错误！");
            this.setData({
                focusMobile: true, //光标移动到手机号输入栏位
                buttonDisabled: false //按钮恢复到可点击状态
            });

        } else {
            //校验通过，则显示动态输入框，并开始倒计时。
            this.setData({
                focusSC: true,              //光标移动到短信认证码输入栏位
                smsCode: ut.getSmsCode()    //在前端生成随机码，以便传送到后台发送给手机端
            });

            //向后端查询校验手机号是否被占用
            let rdata = {
                'openId': app.globalData.userInfo.openId,
                'mobile': this.data.newMobile,
                'smsCode': this.data.smsCode,
                'sendSms': cf.runtimeConfig.sendSms
            };
            ut.request(cf.service.mobileSCUrl, rdata, false,
                (res) => {
                    ut.debug('短信发送应答', res.data);
                    //未被占用
                    if (res.data.code === '0') {
                        ut.showToast(res.data.msg);
                        //开始倒计时
                        _that.countDown(_that);
                    } else if (res.data.code === '1') {
                        ut.showToast(res.data.msg);
                        //按钮恢复
                        this.setData({
                            buttonDisabled: false
                        });
                    }
                },
                (res) => {
                    ut.debug('error', res.data)
                }
            )
        }
    },
    /**
     * 发送短信验证码按钮的倒计时刷新功能，在向后台发送请求后调用
     * @param that
     */
    countDown: function (that) {
        let second = that.data.second;
        if (second === 0) {
            that.setData({
                second: 10,
                buttonDesc: '发送',
                buttonDisabled: false
            });
            return;
        }
        setTimeout(() => {
                that.setData({
                    second: second - 1,
                    buttonDesc: that.data.second + '秒后可重发'
                });
                that.countDown(that);
            }
            , 1000)
    },


    /**
     * 功能：验证码光标离开时校验验证码的正确性
     * 算法：
     * 1、若输入的验证码不是''且与生成的验证码匹配则通过
     * 2、若新输入的手机号与原手机号相同，则不校验验证码，直接返回
     */
    checkSC: function (e) {
        let _that = this;
        //录入内容不是当前用户的默认手机号，显示发送短信认证码功能。否则隐藏发送短信认证码功能。
        if (e.detail.value === this.data.smsCode) {
            this.setData({
                hideSC: true,
                'rdata.mobile': _that.data.newMobile
            });
            ut.showToast('验证码正确');

        } else {
            console.log('验证码内容为' + e.detail.value);
        }
    },

    /**
     * 调转到评价界面
     * @param e
     */
    goComment: function (e) {
        ut.debug(e);

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

    goRegist: function () {
        wx.switchTab({
            url: '../index/index'
        })
    },

    /**
     * v0.2地图路径规划功能的相关函数
     * @param e
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

    bindPickerChangeUprice: function (e) {
        let that = this;

        this.setData({
            'rdata.uprice': Number(that.data.upriceList[e.detail.value]),
        });

        console.log('typeof(uprice)=', typeof(that.data.rdata.uprice), that.data.rdata.uprice);
    },
    bindPickerChangeDuration: function (e) {
        ut.debug(e);
        let that = this;
        this.setData({
            'rdata.dura': Number(that.data.durationList[e.detail.value]),
        })
    },

    /**
     * 选地址列表中某条地址后将选中的内容设置到属性中，并清空列表
     * @param e
     */
    itemtap: function (e) {

        let location = {'longitude': e.target.dataset.location.lng, 'latitude': e.target.dataset.location.lat}; //下拉列表中的经纬度构造成对象。
        this.setData({
            'rdata.addr': e.target.dataset.address,
            'rdata.location': JSON.stringify(location),//将对象以字符串的方式
            addressList: []
        })
    },


    /**
     * 选地址列表中某条地址后将选中的内容设置到属性中，并清空列表
     * @param e
     */
    bindKeyInput: function (e) {
        ut.debug('输入内容', e);
        ut.setAddress(e, 'addr', 'addressList', this);
    },


    onLoad: function (option) {

        let that = this;
        ut.debug('rqst-edit', option);
        ut.debug('globalData', app.globalData);
        app.globalData['bizParameters'] = '全局参数在这里传递';


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

                        //用DB保存的值渲染单选框中的数据
                        let items = ut.getRa(ret.pet, that.data.items);
                        let sexItems = ut.getRa(ret.sex, that.data.sexItems);

                        //动态渲染当前地址到客户地址的距离
                        ut.getTraffic4tx(app.globalData.address.address, ret.addr, function (ret) {
                            that.setData({
                                'traffic': ret,
                            });
                        });

                        that.setData({
                            'rdata': ret,//渲染表单中各个输入项的数据
                            'rdata.location': JSON.stringify(ret.location),
                            'rdata.clntInfo': ret.clntInfo,
                            'rdata.lborInfo': (ret.lborInfo ? ret.lborInfo : {}),
                            'addrHidden': ut.getHiddenAddr(ret.addr),
                            'items': items,
                            'sexItems': sexItems,
                            'toolList': ret.toolList, //不建议将特殊组件的数据结构保存到数据库，此处仅为一个示例。其他模块中不必设置这个字段
                        });

                        console.log('加载页面后的rdata', that.data.rdata);


                        wx.showShareMenu({
                            withShareTicket: true,
                            // success: function (e) {
                            //     console.log('in wx.showShareMenu1',e)
                            // }
                            // ,fail: function (e) {
                            //     console.log('in wx.showShareMenu2',e)
                            // }
                        });

                        /**
                         * 展示地图 //TODO:将敏感数据放到ZgConfig.js中
                         */
                        let myAmapFun = new amapFile.AMapWX({key: '2d15ece70392d0afd89dae800f78f94d'});
                        let to = '';
                        let from = '';
                        wx.getLocation({
                            success: function (res) {

                                ut.debug('99999999999999', res, that.data.rdata.location);
                                //1、如果是带参数加载，则将初始参数记录在data对象中
                                if (typeof(option) !== 'undefined') {

                                    //1-1准备起止点的坐标参数
                                    from = res.longitude + ',' + res.latitude;
                                    let fromObj = {'latitude': res.latitude, 'longitude': res.longitude};
                                    ut.debug('getLocation', from, fromObj);

                                    let location = JSON.parse(that.data.rdata.location);
                                    to = location.longitude + ',' + location.latitude;
                                    let toObj = {
                                        'latitude': location.latitude,
                                        'longitude': location.longitude
                                    };
                                    ut.debug('toObj', toObj);

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

                    }
                    //})
                }
            })

        } else {
            ut.debug('进入新增模式，隐藏详情页面');
            //以新增模式进入本页，检查userInfo是否有效，若无效则提示重新登录
            ut.checkSession(null, app, that, () => {
                that.setData({
                    preview: false,
                    'rdata.mobile': app.globalData.userInfo.mobile, //默认取自当前用户的手机号
                    'rdata.uprice': that.data.upriceList[0],
                    'rdata.dura': that.data.durationList[0],
                    'rdata.clfn': app.globalData.userInfo.name,
                });
            })
        }

    },

    onCpeMobileReady: function (e) {
        //校验验证码是否正确，如正确，则将输入的手机号作为表单的内容提交到后台
        console.log('onMyEvent', e.detail); // 自定义组件触发事件时提供的detail对象
    },
    onSubmit: function (e) {


        let goOne = true;
        let that = this;
        //防止重复提交
        this.setData({
            submitButtonDisabled: true
        });

        ut.debug('form的数据1:', e.detail.value);
        let rdata = e.detail.value;
        //从自定义组件中获取mobile手机号数据，追加到rdata中


        rdata.location = JSON.parse(rdata.location);

        let st = e.detail.target.dataset.submittype;
        //当提交类型是删除时
        if (st === 'delete') {        //客户删除
            rdata.stat = 'delete';
            rdata.rdst = '0';
        } else if (st === 'close') {   //客户关闭
            rdata.stat = 'close';
        } else if (st === 'clnt-cancel') { //客户取消
            rdata.stat = 'clnt-cancel';
            //rdata.lborInfo={};        //此处不必清空lbor信息，系统仍然会保存被取消订单中的阿姨信息。
        } else if (st === 'get') {      //阿姨上单，将当前用户的信息作为lbor信息发送到后台

            //刷新用户的信息，以便工人身份被审核后可以立即接单。
            app.checkUser((res1) => {
                    ut.debug('从后端pull最新的用户信息 ', res1);
                    app.globalData.userInfo = res1.data;
                }
            );

            rdata.stat = 'get';
            rdata.lborInfo = app.globalData.userInfo;//上单用户的信息
            console.log('拟上单用户信息，请关注其角色', rdata.lborInfo);
            /**
             * 校验用户的角色，如果不是LBOR角色，则提示是否进行认证，如同意，则跳转到用户信息管理界面
             * LBOR录入专有信息提交（服务类别、居住地址、服务范围、身份证），短信通知审核人请审核。
             * 审核通过后，通知LBOR审核已通过。
             * 登录后默认进入LBOR对应类别的单子列表。
             */
            if ('LBOR' !== app.globalData.userInfo.role) {
                goOne = false;
                ut.showModal('温馨提示', '亲！请补充服务人员相关信息，10分钟内通过审核后就可以接单了，马上去？', () => {
                    wx.navigateTo({
                        url: '../user-edit/user-edit?type=LBOR&reqId=' + that.data.reqId
                    });
                }, () => {
                    console.log('选择不补充服务人员信息，应停留在本页，不继续提交');
                });
                return;
            } else if ('LBOR' === app.globalData.userInfo.role && !app.globalData.userInfo.rolecfm) {
                ut.showModal('温馨提示', '角色尚未审核通过，请稍后再试。再看看别的单子？', () => {
                    wx.navigateTo({
                        url: '../rqst-list/rqst-list'
                    });
                }, () => {
                    console.log('呆在这不动');
                });
                return;
            }
        } else if (st === 'start') {       //阿姨开工
            rdata.stat = 'start';
            //rdata.lborInfo=app.globalData.userInfo;//上单用户的信息
            //rdata.clntInfo=this.data.rdata.clntInfo;
            rdata.begin_time = new Date();
        } else if (st === 'lbor-cancel') { //阿姨取消
            rdata.stat = 'wait';
            rdata.lborInfo = {};
        } else if (st === 'finish') {      //阿姨完工
            rdata.stat = 'finish';

            rdata.end_time = new Date();
            rdata.time_cost = ((new Date(rdata.end_time) - new Date(rdata.begin_time)) / 1000 / 60).toFixed(0);//分钟
            rdata.cost = ((rdata.time_cost / 60) * rdata.uprice).toFixed(0);

            console.log(
                '耗时：' + rdata.time_cost + '分钟',
                '单价：' + rdata.uprice,
                '费用：' + rdata.cost
            );


            //TODO:计算结束时间与开始时间之差
        }
        else {                          //新建单子
            ut.debug('submitType未被设置，表明是新建订单，则补充客户信息', rdata);
            rdata.clntInfo = app.globalData.userInfo;

            //再此校验数据的的规则：必填项、数字格式
            //todo：根据字段配置信息，执行校验规则

            console.log('rdata.uprice before submit', rdata.uprice);
            rdata.cost = 0;

        }
        rdata.uprice = Number(rdata.uprice);
        rdata.cost = Number(rdata.cost);

        if (goOne) {

            //组装发送保存的数据
            Object.assign(
                rdata,
                {toolList: this.data.toolList},
            );


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
                            title: retMsg,
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
                            }
                        });


                    })
                },
                complete: function (res) {
                    ut.info("下单完成");
                }
            });
        }
    },

    /**
     * 渲染指定属性名的radiobox
     * 算法：
     * 遍历data中radiobox的初始数据(数组)
     *  将数据库中的值与数组中每个元素name比较，如果匹配则将check的属性设置为true
     *
     * @param propName 属性名字
     */
    renderPet: function (propName) {

        ut.debug('data.items被更前为', this.data.items);
        let items = this.data.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === propName) {
                items[i].checked = true;
                console.log(items[i].name + '被设置为true');
            }
            else {
                delete items[i].checked;
            }
        }

        //用DB保存的值填充到默认数组之后，渲染界面
        this.setData({
            items: items
        });

        ut.debug('data.items被更新后为', this.data.items);
    },

    /**
     * 用数据库中保存的值来渲染data中默认的checkbox数组
     * @param propName 数据库中保存的值
     * @param rbArray data对象中默认的数组（items），如this.data.items
     * @returns {*} 被渲染后的数组。
     */
    getRa: function (propName, rbArray) {
        let items = rbArray;
        for (let i = 0; i < items.length; i++) {
            if (items[i].name === propName) {
                items[i].checked = true;
                console.log(items[i].name + '被设置为true');
            } else {
                delete items[i].checked;
            }
        }
        return items;
    },

    renderPet2: function (propName, rbArray) {
        this.setData({
            items: getRa(propName, rbArray)
        });
    },


    toolChange: function (e) {

        let toolList = this.data.toolList;
        for (let i = 0; i < toolList.length; ++i) {
            toolList[i].checked = toolList[i].value === e.detail.value;
        }

        /**
         * 若希望将radiobox的数组全量存入db，则需要在这里将this.data中的数据刷新，并要在发送后台前将数组数据添加到rdata中
         */
        this.setData({
            toolList: toolList,
            hasTool: e.detail.value
        });

        ut.debug('刷新后的data.hasTool:', this.data.hasTool);
    },


    bindDateChange: function (e) {


        let newDate = new Date(e.detail.value).getTime();
        let todayDate = new Date(this.data.rdata.osdt).getTime();
        console.log('选中的日期', newDate, todayDate);

        if (newDate === todayDate) {
            this.setData({
                'start_time': ut.getNow(':'),
            });
        } else {
            this.setData({
                'start_time': '00:00',
            });
        }

        this.setData({
            'rdata.osdt': e.detail.value,
        });
    },
    bindTimeChange: function (e) {
        this.setData({
            'rdata.ostm': e.detail.value,
        })
    },
    changePreview: function (e) {
        let that = this;
        this.setData({
            preview: !this.data.preview,
        });

        let st = e.target.dataset.submittype;

        if (st === 'onemore') {
            ut.debug('再来一单,清空reqId');

            let address = this.data.rdata.addr;
            let location = this.data.rdata.location;
            console.log(address);
            //清理表单中的各种数据
            that.setData({
                'rdata': {},
            });

            //加载表单中的新单必要信息
            this.setData({
                'rdata.reqId': '',
                'rdata.mobile': app.globalData.userInfo.mobile, //默认取自当前用户的手机号
                'rdata.uprice': that.data.upriceList[0],
                'rdata.addr': address,
                'rdata.location': location,
                'rdata.dura': that.data.durationList[0],
                'rdata.clfn': app.globalData.userInfo.name,
                'rdata.stat': 'wait'
            });


        }

    },

    delete: function (e) {
        ut.debug('删除按钮被点击');
        ut.debug(e);
    },


});