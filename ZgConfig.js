/**
 * 根据编译时参数，初始化配置信息
 * @param runtime 编译时设置的参数集合
 */
function ZgConfig(runtime) {

    this.runMode = runtime.runmode;

    //默认的语言为中文，
    if (!runtime.sysinfo || !runtime.sysinfo.language || runtime.sysinfo.language === '') {
        this.language = 'zh';
        console.warn('语言环境为中文：zh')
    } else {
        this.language = runtime.sysinfo.language;
        console.warn('语言环境为中文：',this.language)
    }



    /**
     * 域名命名规范：
     * zgreq.qstarxcx.com
     * zg   :应用名简称
     * req  :url类别，req:https请求|ulf:上传文件|dlf:下载文件|ws:websocket请求|
     * qstar:公司名简称
     * xcx  :程序类别，xcx:小程序|qyh:企业号|qywx:企业微信
     *
     * 因为腾讯云申请的数字证书是一串数字开头的二级域名，所以MP只能给该二级域名发送请求。
     */
    this.runtimeConfig = {
        'dev': {
            url: 'http://zgreq.qstarxcx.com', //在开发人员本地的host中，将该域名指向127.0.0.1
            wsurl: "ws://zgreq.qstarxcx.com:8080",
            sendSms: false,          //是否真正发送短信
            countDownSecond: 10,   //倒计时
            payDisct: 0.01,
            tomatoTime: 0.1,
            getOutTradeNo: function (tradeNo) {
                return tradeNo;
                //return 'dev_'+new Date().getTime();   //开发环境中使用临时生成的交易编号，不必每次都生成新的订单来测试，提升效率
            },

        },
        'test': {    //提交体验用户试用时以此方式
            url: 'https://86316533.qstarxcx.com',
            wsurl: "ws://86316533.qstarxcx.com",
            sendSms: true,
            countDownSecond: 30,
            payDisct: 0.01,
            tomatoTime: 0.1,
            getOutTradeNo: function (tradeNo) {
                return tradeNo;
                //return 'test_'+new Date().getTime();
            },

        },
        'prod': {    //体验体验用户验证后，使用此种编译模式编译后发布
            url: 'https://86316533.qstarxcx.com',
            wsurl: "ws://86316533.qstarxcx.com",
            sendSms: true,
            countDownSecond: 60,
            payDisct: 1,
            tomatoTime: 25,
            getOutTradeNo: function (tradeNo) {
                return tradeNo;
                //return tradeNo+'_'+new Date().getTime();
            },

        }
    }[this.runMode];

    /**
     * 特权用户白名单
     * TODO:可以在运行时从后台获取。
     */
    this.whiteList = ['13917153958', '18616257890', '17701826978'];

    //根据传入的运行模式参数，生效对应的参数
    this.url = this.runtimeConfig.url;
    let url = this.url; //此处定义的url局部变量，是供service引用

    this.service = {

        //bizMgmtUrl
        bizEditUrl: `${url}/biz-edit`,
        bizListUrl: `${url}/biz-list`,
        bizcatalogListUrl: `${url}/bizcatalog-list`,
        bizQueryUrl: `${url}/biz-query`,
        orderListUrl:`${url}/order-list`,


        //生成二维码
        genQrCodeUrl: `${url}/gen-qrcode`,

        // 订单状态推送
        statPushUrl: `${url}/stat-push`,

        // 微信支付
        wxpayUrl: `${url}/wxpay`,

        wxpayQueryUrl: `${url}/wxpayquery`,


        // wafer1登录模式，用于建立会话。后台收到该请求后，调用server端由腾讯提供的sdk(login-service)
        loginUrl: `${url}/login`,

        // 自定义登录模式
        loginUrl2: `${url}/login2`,

        // 测试的请求地址，用于测试会话
        requestUrl: `${url}/user`,

        // 信道服务地址
        tunnelUrl: `https://64649188.ws.qcloud.la/tunnel`,

        // 文件上传接口
        uploadUrl: `${url}/upload`,

        //文件删除接口
        uploadRmUrl: `${url}/uploadrm`,

        // 需求单查询接口
        rqstListUrl: `${url}/rqst-list`,

        // LB个人信息查询接口
        lborDetlUrl: `${url}/lbor-detl`,

        // LB个人信息修改接口
        lborEditUrl: `${url}/lbor-edit`,

        // LB个人信息修改接口
        lborListUrl: `${url}/lbor-list`,

        // 用户个人信息修改接口
        userEditUrl: `${url}/user-edit`,

        //用户列表查询
        userListUrl: `${url}/user-list`,

        //检查用户状态
        userCheckUrl: `${url}/user-chck`,

        //检查手机号唯一性
        mobileCheckUrl: `${url}/user-mbck`,

        //请求短信动态码（SMS CODE)
        mobileSCUrl: `${url}/user-mbsc`,

        //检查常用地址
        userAddrUrl: `${url}/addrs2`,

        //获取用户地址
        addrsUrl: `${url}/addrs`,

        //保洁需求创建、修改接口
        rqstEditUrl: `${url}/rqst-edit`,

        //评论创建、修改接口
        cmmtEditUrl: `${url}/cmmt-edit`,

        //评论查询接口，用户印象接口
        cmmtListUrl: `${url}/cmmt-list`,

        tomatoEditUrl   :`${url}/tomato-edit`,
        tomatoListUrl   :`${url}/tomato-list`,

        bambooListUrl   :`${url}/bamboo-list`,
        rentrsrListUrl  :`${url}/bamboo-list`,
        cityListUrl     :`${url}/city-list`,

    };

    //视图展现有关的配置参数，在这里统一定义，便于参数化管理。
    this.vc = {
        swiperItvl: 5000, //每张图片展现的时间。
        swiperDurt: 2000,  //切换一张图片的过程所需要的时间
        ToastShowDurt: 1500,  //提交后的面包提示框展现持续时间
        PAGE_REFRESH_INTERVAL: 3000,//页面多次刷新之间的最短时间间隔
    };

    /**
     * 各页面中的标题信息和描述信息，在这里统一配置，以便wxml文件实现模板化
     * titile是行动建议，desc是行动的原因
     * 上述内容应该站在当前角色的视角，体现出产品的理念。
     * 面向消费者的话语可以包含些英文的词
     * 面向服务商的文字使用中文，正面、激励
     */
    // this.pageInfo = [
    //     {page: 'index', title: '一切皆有可能', desc: '相信美好的事情即将发生！'},
    //     {page: 'clnt-main', title: '找个好帮手', desc: '把时间浪费在美好的事情上！'},
    //     {page: 'rqst-edit', title: '找个好帮手', desc: '把时间浪费在美好的事情上！'},
    //     {page: 'fdbk-edit', title: '刻意练习', desc: '塑造自己的长板！'},
    //     {page: 'lbor-main', title: '成就自己', desc: '靠谱、专业！'},
    //     {page: 'rqst-list', title: '成就自己', desc: '靠谱、专业！'},
    //     {page: 'lbor-edit', title: '耐心', desc: '是一切聪明才智的基础！'},
    //     {page: 'me', title: '耐心', desc: '是一切聪明才智的基础！'},
    //     {page: 'addr-list', title: '一切皆有可能', desc: '相信美好的事情即将到来'},
    //     {page: 'addr-edit', title: '一切皆有可能', desc: '相信美好的事情即将到来'},
    //     {page: 'about', title: '成就自己', desc: '影响他人'},
    //     {page: '', title: '靠谱比聪明更重要', desc: '《靠谱》，大石哲之'},
    //     {page: '', title: '容忍比自由更重要', desc: '《容忍与自由》，胡适'},
    //     {page: '', title: '向内求', desc: '成就自己'},
    //     {page: '', title: '以终为始', desc: ''},
    //     {page: '', title: '', desc: ''},
    //     {page: '', title: '', desc: ''},
    // ];

    /**
     * motto用来取代pageInfo
     */
    this.motto = {
        'biz-edit':{title: '一切皆有可能', desc: '相信美好的事情即将发生！'},
        index: {title: '一切皆有可能', desc: '相信美好的事情即将发生！'},
        'clnt-main': {title: '找个好帮手', desc: '把时间浪费在美好的事情上！'},
        'rqst-edit': {title: '找个好帮手', desc: '把时间浪费在美好的事情上！'},
        'fdbk-edit': {title: '刻意练习', desc: '塑造长板！'},
        'lbor-main': {title: '成就自己', desc: '靠谱、专业！'},
        'rqst-list': {title: '成就自己', desc: '靠谱、专业！'},
        'lbor-edit': {title: '耐心', desc: '是一切聪明才智的基础，苏格拉底'},
        'me': {itle: '耐心', desc: '是一切聪明才智的基础，苏格拉底'},
        'addr-list': {title: '一切皆有可能', desc: '相信美好的事情即将到来'},
        'addr-edit': {title: '一切皆有可能', desc: '相信美好的事情即将到来'},
        'about': {title: '成就自己', desc: '影响他人'},
        '1': {title: '靠谱比聪明更重要', desc: '大石哲之'},
        '2': {title: '容忍比自由更重要', desc: '胡适'},
        '3': {title: '向内求', desc: '成就自己'},
        '4': {title: '以终为始', desc: ''}
    };

    this.pageSize = 20;//每次查询返回的记录数

    /**
     * 异常信息常量定义
     * key:顺序排列的数字
     * value: desc:异常描述；sust:行动建议
     *
     * 使用方式，在catch或fail中，以key作为参数，显示异常信息或
     */
    this.ec = {
        //业务类异常
        EB_0001: {desc: '技术类异常描述', sugt: '给用户的下一步行动建议'},

        //技术类异常
        ET_0001: {desc: '显示给用户的异常描述', sugt: '给用户的下一步行动建议'},

        //第三方类异常
        OT_0001: {desc: '显示给用户的异常描述', sugt: '给用户的下一步行动建议'},
    };


    const lang_zh = {
        'H_LOADING': '加载中',
        'H_LOADED': '加载完成',
        'H_NOMORE': '没有数据了',
        'H_SUCCESS': '成功',
        'H_SUBMITING': '处理中',


        //服务类业务状态：
        'wait': '等待接单',//通知LBOR群
        'get': '已接单',  //通知CLNT
        'start': '已开工',//通知CLNT
        'finish': '已完工',//通知CLNT
        'paid': '已支付',//通知LBOR
        'close': '客户关闭',
        'expired': '已过期',
        'delete': '已作废',
        'lbor-cancel': '非客户取消',//通知CLNT
        'clnt-cancel': '客户取消',  //通知LBOR

        //商品类业务的状态：
        bs_wait         :'待支付',               //买家显示【支付】，后续状态：完成(无需发货)/已支付待发货

        bs_paid         :'已付款，待卖家发货',  //买家【取消】，点后状态变为：完成(买家配送前取消)；卖家显示【发货】，输入快递单号。(如商品属性需发货)
        bs_cancel_f     :'已关闭(买家配送前取消)', //买家无按钮。卖家显示无按钮。
        bs_delivered    :'卖家已发货',           //买家【确认收货】，点后状态为：完成（买家已收货）；卖家显示无按钮；商家发货后的状态
        bs_received_f   :'完成(买家已收货)',      //买家【退货】(5天内)，输入退货快递单号为：买家退货中；卖家显示无按钮。

        bs_returning    :'买家退货中',           //买家无按钮。卖家显示【收到退货】：点后状态：买家收到退货、已退款
        bs_returned     :'卖家收到退货',         //买家无按钮。卖家显示【退款】，点后状态为：完成(卖家已退款)
        bs_unpaid_f     :'已关闭(卖家已退款)',    //卖家无按钮。买家无按钮。显示已退款。


        //业务种类:对应biz_type
        hscleaning  : '临时保洁',
        accleaning  : '空调清洗',
        accryogen   : '空调充氟',
        oilsmoke_cleaning: '油烟机',
        house_cleaning: '找保洁',
        changelock  : '换修锁',
        pipeline    : '通管道',
        broadband   :'装宽带',
        decodesign  :'装修设计',
        corpregist  :'公司注册',
        program     :'编程私教',
        shoepad :'米萌智暖',
        photo   :'子平摄影',

    };
    //提示类的信息
    this.hint = {
        'zh': lang_zh,
        'zh_CN':lang_zh

    }[this.language];


    /**
     * 特定业务模块的流程状态机定义
     * 状态迁移、按钮显示、按钮风格等可在此定义
     */
    this.statRules={

        //商品发布审核
        bizFlow:{
            bs_scratch: {
                desc: '草稿',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '提交审核', nextStat: 'bs_waitprv',type:'primary'},
                            {buttonDesc: '存为草稿', nextStat: 'bs_scratch'}
                        ]
                    },
                }
            },
            bs_waitprv: {
                desc: '待审核',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '审核通过', nextStat: 'bs_pass',type:'primary'},
                            {buttonDesc: '审核不通过', nextStat: 'bs_nopass',type:'warn'},
                        ]
                    },
                }
            },
            bs_pass: {
                desc: '审核通过',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '上架', nextStat: 'bs_publish',type:'primary'},
                            {buttonDesc: '存为草稿', nextStat: 'bs_scratch'},
                        ]
                    },
                }
            },
            bs_nopass: {
                desc: '审核不通过',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '提交审核', nextStat: 'bs_waitprv',type:'primary'},
                            {buttonDesc: '存为草稿', nextStat: 'bs_scratch'},
                        ]
                    },
                }
            },
            bs_publish: {
                desc: '已上架',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '下架', nextStat: 'bs_unpublish',type:'primary'},
                            {buttonDesc: '存为草稿', nextStat: 'bs_scratch'}
                        ]
                    },
                }
            },
            bs_unpublish: {
                desc: '下架',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '上架', nextStat: 'bs_publish',type:'primary'},
                            {buttonDesc: '存为草稿', nextStat: 'bs_scratch',type:'primary'},
                            {buttonDesc: '删除', nextStat: 'bs_delete',type:'warn'},
                        ]
                    },
                }
            }
        },

        //番茄闹钟的业务状态机
        tomatoFlow:{
            bs_wait: {
                desc: '未开始',
                role: {
                    'ANY': {buttons: [{buttonDesc: '开始', nextStat: 'bs_ongoing',type:'primary'}]
                    },
                }
            },
            bs_ongoing: {
                desc: '进行中',
                role: {
                    'ANY': {
                        buttons: [
                            // {buttonDesc: '暂停', nextStat: 'bs_pause'},
                            {buttonDesc: '终止', nextStat: 'bs_summary',type:'warn'},
                    ]
                    },
                }
            },
            bs_pause: {
                desc: '暂停',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '继续', nextStat: 'bs_resume'},
                            {buttonDesc: '终止', nextStat: 'bs_summary',type:'warn'},
                        ]
                    },
                }
            },
            bs_resume: {
                desc: '恢复',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '暂停', nextStat: 'bs_pause'},
                            {buttonDesc: '终止', nextStat: 'bs_summary',type:'warn'},
                        ]
                    },
                }
            },
            // bs_over: {
            //     desc: '终止',
            //     role: {
            //         'ANY': {
            //             buttons: [
            //                 {buttonDesc: '小结', nextStat: 'bs_summary',bindtap:'summary'}
            //             ]
            //         },
            //     }
            // },
            bs_summary: {
                desc: '写小结',
                role: {
                    'ANY': {
                        buttons: [
                            {buttonDesc: '保存', nextStat: 'bs_finish',type:'primary'}
                        ]
                    },
                }
            },
            // bs_finish: {
            //     desc: '结束',
            //     role: {
            //         'ANY': {
            //             buttons: [
            //                 {buttonDesc: '修改小结', nextStat: 'bs_summary',type:'primary'}
            //             ]
            //         },
            //     }
            // },
        },

        //商品类业务的状态机，通过rqst-comd-edit动态实现
        comdFlow: {
            bs_returned: {
                desc: '卖家收到退货',
                role: {
                    'CLNT': {buttons: []},
                    'LBOR': {buttons: [{buttonDesc: '退款', nextStat: 'bs_unpaid_f'}]
                    },
                }
            },
            bs_returning: {
                desc: '买家退货中',
                role: {
                    'CLNT': {buttons: []},
                    'LBOR': {buttons: [{buttonDesc: '收到退货', nextStat: 'bs_returned'}]},
                }
            },
            bs_received_f: {
                desc: '完成(买家已收货)',
                role: {
                    'CLNT': {buttons: [{buttonDesc: '申请退货', nextStat: 'bs_returning'}]
                    },
                    'LBOR': {
                        buttons: []
                    },
                }
            },

            bs_delivered: {
                desc: '卖家已发货',
                role: {
                    'CLNT': {
                        buttons: [   //当前角色可访问的按钮
                            {buttonDesc: '确认收货', nextStat: 'bs_received_f'}
                        ]
                    },
                    'LBOR': {
                        buttons: [
                            // {buttionDesc: '发货', nextStat: 'bs_delivered'}
                        ]
                    },
                }
            },
            bs_paid: {
                desc: '已付款，待卖家发货',
                role: {
                    'CLNT': {
                        buttons: [   //当前角色可访问的按钮
                            {buttonDesc: '取消', nextStat: 'bs_cancel_f'}
                        ]
                    },
                    'LBOR': {
                        buttons: [
                            {buttonDesc: '发货', nextStat: 'bs_delivered'}
                        ]
                    },
                }
            },
            bs_wait: {
                desc: '待支付',//订单状态
                role: {        //各种角色
                    'CLNT': {
                        buttons: [   //当前角色可访问的按钮
                            //{buttonDesc: '修改', nextStat: 'edit',notSubmit:true}
                        ]
                    },
                    'LBOR': {
                        buttons: []
                    },
                }
            },
        },

        //服务类业务的状态机，未在此定义是因为已通过rqst-accleaning-rqst硬编码实现
        servFlow:{},

    };

    /**
     * 业务种类     *
     */
    this.charging_type = {
        photo: {
            url:'rqst-comd-edit',//对应的详情页面
            ccs: {uploadpic: true, mobile: true, address: true, osdt: false, map: true, nametitle: true},
            supplier_id: ['oCun05dg82cWSz-SiwiJnrAwX7Hs'],
            subtypes: [
                {'type': '室内摄影(1房)', 'uprice': 500, 'unit': '次'},
                {'type': '室内摄影(2房)', 'uprice': 650, 'unit': '次'},
                {'type': '室内摄影(3房)', 'uprice': 800, 'unit': '次'},
                {'type': '室内摄影(4房)', 'uprice': 900, 'unit': '次'},
                {'type': '活动跟拍', 'uprice': 700, 'unit': '次'},
            ],
            pics: ['biz_program.png'],
            //TODO:以下三种特性待实现
            can_be_canceled_by_clnt: true,//不能取消，bs_paid下隐藏【取消】按钮。button4flow_comd中增加判断条件
            can_be_returned_by_clnt: true,//不能退货，bs_received_f下隐藏【退货】按钮。button4flow_comd中增加判断条件
            need_delivery: false,         //无需配送，付款后状态直接更新为bs_received_f，不显示【确认收货】。onSubmit()方法中支付前传送bs_received_f状态
        },
        shoepad: {
            url:'rqst-comd-edit',//对应的详情页面
            ccs: {uploadpic: false, mobile: true, address: true, osdt: false, map: true, nametitle: true},
            supplier_id: ['oCun05dg82cWSz-SiwiJnrAwX7Hs'],
            subtypes: [
                {'type': '无线调温版', 'uprice': 550, 'unit': '双'},
                {'type': '有线调温版', 'uprice': 250, 'unit': '双'},
                {'type': '有线恒温版', 'uprice': 150, 'unit': '双'}
            ],
            pics:['shoepad3.png'],//商品图片，第一张为海报图片
            postTitle:'天气再凉，冷却不了我对您的思念重重，距离再远，相隔不断我对您的关心重重。重阳节快到了，马上扫码登录，送一份温暖给最爱的亲人！',

            //TODO:以下三种特性待实现
            can_be_canceled_by_clnt: true,//不能取消，bs_paid下隐藏【取消】按钮。button4flow_comd中增加判断条件
            can_be_returned_by_clnt: true,//不能退货，bs_received_f下隐藏【退货】按钮。button4flow_comd中增加判断条件
            need_delivery: false,         //无需配送，付款后状态直接更新为bs_received_f，不显示【确认收货】。onSubmit()方法中支付前传送bs_received_f状态
        },
        program: {
            url:'rqst-comd-edit',//对应的详情页面
            ccs: {uploadpic: false, mobile: true, address: true, osdt: false, map: true, nametitle: false},
            supplier_id: ['oCun05dg82cWSz-SiwiJnrAwX7Hs'],
            subtypes: [
                {'type': '第一课', 'uprice': 300, 'unit': '次'},
                {'type': '初级(编程语言)', 'uprice': 1999, 'unit': '每期'},
                {'type': '中级(功能开发)', 'uprice': 3999, 'unit': '每期'},
                {'type': '高级(框架设计)', 'uprice': 7999, 'unit': '每期'},
            ],
            pics:['biz_program.png'],
            postTitle:'尤瓦尔.赫拉利在《未来简史》中指出：人类正在从人文主义，迈向数据主义！万事万物皆由数据和算法构成，马上扫码登录，开启个人数字化转型之旅！',


            //TODO:以下三种特性待实现
            can_be_canceled_by_clnt: true,//不能取消，bs_paid下隐藏【取消】按钮。button4flow_comd中增加判断条件
            can_be_returned_by_clnt: true,//不能退货，bs_received_f下隐藏【退货】按钮。button4flow_comd中增加判断条件
            need_delivery: false,         //无需配送，付款后状态直接更新为bs_received_f，不显示【确认收货】。onSubmit()方法中支付前传送bs_received_f状态
        },
        decodesign: {
            url:'rqst-comd-edit',//对应的详情页面
            ccs: {mobile: true, address: true, osdt: false, map: true, nametitle: false},
            supplier_id: ['oCun05dg82cWSz-SiwiJnrAwX7Hs'],
            subtypes: [
                {'type': '设计咨询', 'uprice': 300, 'unit': '次'},
                {'type': '设计装修', 'uprice': 300, 'unit': '平米'},
            ],
            pics:['biz_program.png'],

        },
        corpregist: {
            url:'rqst-comd-edit',//对应的详情页面
            ccs: {mobile: true, address: true, osdt: false, map: true, nametitle: false},
            supplier_id: ['oCun05dg82cWSz-SiwiJnrAwX7Hs'],
            subtypes: [
                {'type': '公司注册', 'uprice': 250, 'unit': '次'},
                {'type': '代理记账(季度)', 'uprice': 1500, 'unit': '季度'},
                {'type': '代理记账(年度)', 'uprice': 5000, 'unit': '年'},
            ],
            pics:['biz_program.png'],

        },
        accleaning: {
            url: 'rqst-accleaning-edit',//对应的详情页面
            subtypes: [
                {'type': '壁挂式', 'uprice': 80, 'unit': '台'},
                {'type': '立柜式', 'uprice': 100, 'unit': '台'},
                {'type': '中央式', 'uprice': 120, 'unit': '台'},
            ], pics: ['biz_program.png'],
        },
        accryogen: {
            url:'rqst-accleaning-edit',
            subtypes:[
            {'type': '  1P功率', 'uprice': 120, 'unit': '台'},
            {'type': '1.5P功率', 'uprice': 180, 'unit': '台'},
            {'type': '2.0P功率', 'uprice': 200, 'unit': '台'},
        ], pics: ['biz_program.png'],
        },
        oilsmoke_cleaning: {
            url:'rqst-accleaning-edit',
            subtypes:[
            {'type': '一般型', 'uprice': 280, 'unit': '台'},
            {'type': '特殊型', 'uprice': 300, 'unit': '台', desc: '拆、洗、装'}
        ], pics: ['biz_program.png'],},
        changelock: {
            url:'rqst-accleaning-edit',
            subtypes:[
            {'type': 'A级锁芯', 'uprice': 120, 'unit': '把', desc: '含6把钥匙'},
            {'type': 'B级锁芯', 'uprice': 280, 'unit': '把'},
            {'type': 'C级锁芯', 'uprice': 380, 'unit': '把'},
        ], pics: ['biz_program.png'],},
        broadband: {
            url:'rqst-accleaning-edit',
            subtypes:[
            {'type': ' 50M长宽', 'uprice': 580, 'unit': '1年', desc: ''},
            {'type': '100M长宽', 'uprice': 780, 'unit': '1年', desc: ''},
            {'type': '100M电信', 'uprice': 1200, 'unit': '1年', desc: 'C50'},
            {'type': '200M电信', 'uprice': 1548, 'unit': '3年', desc: 'C50'},
            {'type': '300M电信', 'uprice': 2028, 'unit': '1年', desc: 'C60'}
        ], pics: ['biz_program.png'],},
        pipeline: {
            url:'rqst-accleaning-edit',
            subtypes:[
            {'type': '疏通', 'uprice': 100, 'unit': '1次', desc: ''},
        ], pics: ['biz_program.png'],},
        hscleaning: {
            url:'rqst-edit',
            subtypes:[
                {'type': '新租保洁', 'uprice': 40, 'unit': '小时', desc: '在约定时间内完成全面保洁，根据客户对洁净度的要求可补时服务'},
                {'type': '代购工具', 'uprice': 65, 'unit': '套', desc: '平拖1、毛巾4(厨卫客备)、清洁球2(厨卫)、扫把、簸箕'},
                {'type': '清洁剂', 'uprice': 30, 'unit': '套', desc: '洁厕灵1、威猛去油1'},
                {'type': '开荒保洁', 'uprice': 30, 'unit': '平米', desc: '擦玻璃、地面涂料污渍、全面除尘(扫、吸、擦)'},
            ], pics: ['biz_program.png'],},
    };
    this.default_ccs={uploadpic: false, mobile: true, address: true, osdt: false, map: true, nametitle: true};


    /**
     * 理念是给todo分配固定的时间，符合“虚实篇”，把重要的是做实，做成长板。而工时系统是事后登记。
     *
     * 1、每个todo归属于一个target
     * 2、一个todo可以与多个tomato关联
     * 3、启动tomato时，在tomatos中创建追加番茄钟对象，将关联的tdid以数组方式作为对象属性，便于日后根据todo汇总工时
     * 4、每个番茄钟只关联一个todo
     * 5、番茄钟可提前完成，完成后写小结，可拍照
     * 6、可根据todo展示所有番茄钟，可以按时间顺序展示所有番茄钟
     * 7、
     * @type {{targets: {targetName1: {meta: {cdate: string, desc: string, dl: string}, todos: [null,null]}}, tomatos: {tdid: Array}, ideas: {}}}
     */
    this.small_target={
        targets:{
            'targetName1':{
                meta:{cdate:'创建日期',desc:'描述',dl:'截止日期',group:'目标组',
                    q:[{target_q:'',now_q:''}]//量化目标和目前的量化值
                },
                todos:[//
                    {
                        tdid:'自动生成',
                        tdct:'todo的内容',
                    },
                    {}
                ]
            }
        },
        tomatos:[
            {
                tdid:'todos的tdid',//yyyymmdd-hhmmss-8位随机数
                tomato_id:'自动生成',tmct:'描述',start_time:'开始时间',end_time:'',
                summary:{'心得':'','get技能':'','成果':'','规范':'',}
            },
            {}
        ],
    };

    /**
     * 动态表单DF配置属性
     * 根据业务模块名字识别，通过再此预先配置，动态生成用户需要填写的表单
     * @type {{tomato: {inputs: [null]}}}
     */
    this.fc={
        tomato:{
            inputs:[
                {
                    title:'番茄钟',
                    fields:[
                        {name:'task',placeholder:'任务',type:'textarea'},
                        {name:'achievement',placeholder:'成果',type:'textarea'},
                        {name:'skill',placeholder:'新技能',type:'textarea',height:6.8},
                        {name:'experience',type:'textarea',placeholder:'写下你的心得',autoheight:true},
                        {name:'pics_list',type:'uploadpic'},
                        //{name:'f2',value:'asfsdfsaf2',type:'input',bindinput:'bindinput',image:true,image_url:'/image/map.png',bindtap:'sdf'},
                    ]
                },

            ]
        },
        bizmgmt:{
            inputs:[
                {
                    title:'商品管理',
                    fields:[
                        {name:'biz_name',placeholder:'商品名称'},
                        {name:'biz_desc',placeholder:'商品描述'},
                        {name:'post_title',placeholder:'海报标题',type:'textarea'},
                        {name:'biz_subtype',type:'array',show:'selector',
                            item_types:[
                                {name:'type',placeholder:'类别'},
                                {name:'desc',placeholder:'描述'},
                                {name:'unit',placeholder:'单位'},
                                {name:'price',placeholder:'单价'},
                                {name:'inventory',placeholder:'库存'},
                                {name:'roc4a',placeholder:'代理佣率'},
                                {name:'roc4p',placeholder:'平台费率'},
                            ]
                        },//todo:itemtype在.js中定义
                        {name:'pics_list',type:'uploadpic'},

                        //{name:'f2',value:'asfsdfsaf2',type:'input',bindinput:'bindinput',image:true,image_url:'/image/map.png',bindtap:'sdf'},
                    ]
                },

            ]
        },
    }


}

module.exports = ZgConfig;