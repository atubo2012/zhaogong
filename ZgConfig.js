/**
 * 根据编译时参数，初始化配置信息
 * @param runtime 编译时设置的参数集合
 */
function ZgConfig(runtime) {

    this.runMode = runtime.runmode;

    this.language = '';
    if (!runtime.sysinfo || !runtime.sysinfo.language || runtime.sysinfo.language === '') {
        this.language = 'zh_CN';
    } else {
        this.language = runtime.sysinfo.language;
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
    };

    //视图展现有关的配置参数，在这里统一定义，便于参数化管理。
    this.vc = {
        swiperItvl: 5000, //每张图片展现的时间。
        swiperDurt: 2000,  //切换一张图片的过程所需要的时间
        ToastShowDurt: 3000,  //提交后的面包提示框展现持续时间
        PAGE_REFRESH_INTERVAL: 3000,//页面多次刷新之间的最短时间间隔
    };

    /**
     * 各页面中的标题信息和描述信息，在这里统一配置，以便wxml文件实现模板化
     * titile是行动建议，desc是行动的原因
     * 上述内容应该站在当前角色的视角，体现出产品的理念。
     * 面向消费者的话语可以包含些英文的词
     * 面向服务商的文字使用中文，正面、激励
     */
    this.pageInfo = [
        {page: 'index', title: '一切皆有可能', desc: '相信美好的事情即将发生！'},
        {page: 'clnt-main', title: '找个好帮手', desc: '把时间浪费在美好的事情上！'},
        {page: 'rqst-edit', title: '找个好帮手', desc: '把时间浪费在美好的事情上！'},
        {page: 'lbor-main', title: '成就自己', desc: '靠谱、专业、真诚！'},
        {page: 'rqst-list', title: '成就自己', desc: '靠谱、专业、真诚！'},
        {page: 'lbor-edit', title: '耐心', desc: '是一切聪明才智的基础！'},
        {page: 'me', title: '耐心', desc: '是一切聪明才智的基础！'},
        {page: 'addr-list', title: '一切皆有可能', desc: '相信美好的事情即将到来'},
        {page: 'addr-edit', title: '一切皆有可能', desc: '相信美好的事情即将到来'},
        {page: 'about', title: '成就自己', desc: '影响他人'},
        {page: '', title: '靠谱比聪明更重要', desc: '《靠谱》，大石哲之'},
        {page: '', title: '容忍比自由更重要', desc: '《容忍与自由》，胡适'},
        {page: '', title: '向内求', desc: '成就自己'},
        {page: '', title: '以终为始', desc: ''},
        {page: '', title: '', desc: ''},
        {page: '', title: '', desc: ''},
    ];

    this.pageSize = 10;//每次查询返回的记录数

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

    //提示类的信息
    this.hint = {
        'zh_CN': {
            'H_LOADING': '加载中',
            'H_LOADED': '加载完成',
            'H_NOMORE': '没有数据了',
            'H_SUCCESS': '成功',
            'H_SUBMITING': '处理中',

            //业务种类:BT
            'accleaning': '空调清洗',
            'accryogen': '空调充氟',
            'oilsmoke_cleaning': '油烟机',
            'changelock': '换修锁',
            'house_cleaning': '找保洁',
            pipeline: '通管道',
            broadband:'装宽带',
            '': '找工-临时保洁',


            //业务状态:BS
            'wait': '等待接单',
            'get': '已接单',
            'start': '已开工',
            'finish': '已完工',
            'paid': '已支付',
            'close': '客户关闭',
            'expired': '已过期',
            'lbor-cancel': '非客户取消',
            'clnt-cancel': '客户取消',

        }

    }[this.language];

    //地址业务品类选择器CC自定义组件使用的内容
    this.charging_type = {
        'accleaning': [
            {'type': '壁挂式', 'uprice': 80, 'unit': '台'},
            {'type': '立柜式', 'uprice': 100, 'unit': '台'},
            {'type': '中央式', 'uprice': 120, 'unit': '台'},
        ],
        'accryogen': [
            {'type': '  1P功率', 'uprice': 120, 'unit': '台'},
            {'type': '1.5P功率', 'uprice': 180, 'unit': '台'},
            {'type': '2.0P功率', 'uprice': 200, 'unit': '台'},
        ],
        'oilsmoke_cleaning': [
            {'type': '一般型', 'uprice': 280, 'unit': '台'},
            {'type': '特殊型', 'uprice': 300, 'unit': '台', desc: '拆、洗、装'}
        ],
        'house_cleaning': [
            {'type': '新租保洁', 'uprice': 40, 'unit': '小时', desc: '在约定时间内完成全面保洁，根据客户对洁净度的要求可补时服务'},
            {'type': '代购工具', 'uprice': 65, 'unit': '套', desc: '平拖1、毛巾4(厨卫客备)、清洁球2(厨卫)、扫把、簸箕'},
            {'type': '清洁剂', 'uprice': 30, 'unit': '套', desc: '洁厕灵1、威猛去油1'},
            {'type': '开荒保洁', 'uprice': 30, 'unit': '平米', desc: '擦玻璃、地面涂料污渍、全面除尘(扫、吸、擦)'},
        ],
        'changelock': [
            {'type': '一级', 'uprice': 120, 'unit': '把', desc: '含6把钥匙'},
            {'type': '二级', 'uprice': 280, 'unit': '把'},
            {'type': '三级', 'uprice': 380, 'unit': '把'},
        ],
        'broadband': [
            {'type': '50M长宽', 'uprice': 300, 'unit': '1年', desc: ''},
            {'type': '100M长宽', 'uprice': 380, 'unit': '3年', desc: ''}
        ],
        pipeline: [
            {'type': '疏通', 'uprice': 100, 'unit': '1次', desc: ''},
        ]
    };


    //场景：客户呼叫服务，工人上门干活，完工时工人根据实际工作内容增加购物篮内容，更新计费并向客户发送订单。客户支付。鼓励工人自己营销。
    //工人的路费也应根据规则在goods中生成一个收费项目
    //


}

module.exports = ZgConfig;