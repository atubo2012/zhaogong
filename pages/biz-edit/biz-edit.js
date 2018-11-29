'use strict';
let ut = require('../../utils/utils.js');
const app = getApp();
const cf = app.globalData.cf;
const innerAudioContext = wx.createInnerAudioContext();


Page({
    data: {
        /**
         * 页面使用的例行参数
         */
        pageInfo: cf.motto['biz-edit'],//
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

            pics_list:[],
            tomato:{pics_list:[],stat:'bs_scratch',sub_types:[]},
        },

        _sub_types:[],//表单中当前编辑的sub_types，在提交前，用其替换rdata.tomato.subtypes


        /**
         * RC(Rending Component)表单控件被初始化渲染时使用的数据。
         */

        list:[],         //当前页的数据
        _item_name:'tomato',//cc_list中列表项的名字

        _crBlink:false,
        _showUploadpic:true,   //默认是只读

        //倒计时按钮相关初始数据
        _buttonDisabled:false,
        _second:10,
        _initSecond:10,
        _buttonDesc:'发送',

        _cond:{},

        //播放音乐功能必须的属性
        _with_music:true, //是否有播放音乐的功能
        _play_music:false, //是否自动播放
    },

    /**
     * 向itemtypes中新增一条记录
     * @param e
     */
    addOneItemType:function (e) {
        let that = this;
        console.log('addOneItemType1',e);
        this.data._sub_types.push({});


        this.setData({
            '_sub_types':that.data._sub_types
        });

        console.log('addOneItemType2',that.data._sub_types)
    },
    /**
     * 点击某条记录时，将数据复制到form中
     * @param e
     */
    processEvent:function (e) {
        let _that = this;
        let item = e.detail.detaildata;
        console.log('processEvent',e,'item',item);

        Object.keys(item).map((key)=>{
            _that.setData({
                ['rdata.tomato.'+key]:item[key]
            });
        });

        this.setFormStat(this.data.rdata.tomato.stat);

        console.log('this.data.rdata',this.data.rdata);
    },

    /**
     * 配合动态表单DF使用，根据id将属性设置到rdata中
     * @param e
     */
    bindInput:function(e){
        //console.log(e.target.id+':'+e.detail.value,e);
        this.setData({
            ['rdata.tomato.'+e.target.id] :e.detail.value
        });
        console.log('data.rdata.tomato',this.data.rdata.tomato);
    },

    /**
     * 用户输入信息的同时，更新this.data中的数组类对象
     * @param e
     */
    bindInputItem:function(e){
        let that = this;
        console.log('bindInputItem1',e);

        let index = e.target.id;
        let value = e.detail.value;
        let name = e.target.dataset.name;

        this.data._sub_types[index][name]=value;

        this.setData({
            'rdata.tomato.sub_types':that.data._sub_types,
        });

        console.log('bindInputItem2',that.data.rdata.tomato)
    },


    //文件上传事件触发，刷新rdata中的数据
    onUploadChangeEvent:function(e){

        this.setData({
            'rdata.tomato.pics_list': e.detail.picsList
        });

        console.log('rdata.tomato.pics_list',this.data.rdata.tomato.pics_list);
    },

    /**
     * 设置表单是否可以修改
     * @param stat :表单中记录的状态
     */
    setFormStat:function(stat){
        if(stat ==='bs_scratch' || stat ==='bs_nopass'){
            this.setData({
                formDisable:false
            });
        }else{
            this.setData({
                formDisable:true
            });
        }

        //业务子类信息刷新
        this.setData({
            _sub_types:this.data.rdata.tomato.sub_types
        });

    },
    onLoad: function (option) {
        let that = this;

        let cclist = this.selectComponent("#cc_list");

        ut.checkSession(null, app, that, () => {

            that.setData({
                preview: false,

                //cc_list的初始参数
                '_cond.query': {'openId': app.globalData.userInfo.openId},
                '_cond.skip': 0,
                '_cond.limit': cf.pageSize,

                itemname:'biz',
                serviceUrl:cf.service.bizListUrl,

                _showUploadpic:false ,//默认是可以上传图片的。

            });

            //启用表单，可编辑
            this.setFormStat(this.data.rdata.tomato.stat);
            console.log('this.data', this.data);



            //加载列表数据
            cclist.onLoad();

            //设置闪烁提示
            //that.data.rdata.stat === 'start' ? ut.showBlink(that) : '';



            //显示分享菜单项。例行功能放在最后。
            wx.showShareMenu({
                withShareTicket: true,
            });

        });
    },

    _timeOutCb:function () {
        console.log('计时结束回调');

        this.setData({
            'rstat.tomato.stat':'bs_summary'
        });

        //点亮屏幕到最亮，并震动10次,停止播放搞音乐。
        wx.setScreenBrightness({
            value: this.data._brightness,
            fail: (res2) => {
                console.log('设置亮度失败1', res2);
            }
        });

        for(let i=0;i<10;i++){
            setTimeout(()=>{
                wx.vibrateLong({});
            },1000);
            console.log(i);
        }

        this.playMusic(true);

    },

    onSubmit: function (e) {

        let that = this;

        //设置订单的状态
        let st = e.detail.target.dataset.submittype;
        ut.debug('form的数据1:', e.detail.value ,'当前状态变为',st);

        //根据选中的记录数更新form中的状态，以便刷新按钮
        this.setData({
            'rdata.tomato.stat': st
        });
        //根据选中记录的状态决定form是否可以编辑
        this.setFormStat(this.data.rdata.tomato.stat);

        //新建草稿时
        this.setData({
            //设置番茄钟对应的用户信息和启动时间
            'rdata.openId': app.globalData.userInfo.openId,
            'rdata.nickName': app.globalData.userInfo.nickName,
            'rdata.tomato.begin_time': ut.getToday('/') + ' ' + ut.getNow(':'),
            '_hasMoreLeftTime': true,//打开计时开关
        });




        this.setData({
            _showUploadpic: true,
        });

        //提交到后台保存
        console.log('将发往后台保存的数据', that.data.rdata.tomato);
        ut.request(cf.service.bizEditUrl, that.data.rdata, true,
            (res) => {
                ut.showToast(res.data);
                //重定向访问当前页，以便cc_list中的内部变量skip能被重置。
                wx.navigateTo({
                    url: './biz-edit'
                })
            }, (res) => {
                ut.showToast(res.data);
            });

    },

    /**
     * 设置pagehead中的播放icon，并开启或关闭音乐。
     */
    toggleMusic:function(){
        let that = this;
        this.setData({
            _play_music:!that.data._play_music
        });
        that.data._play_music?this.playMusic(true):this.playMusic(false)
    },

    /**
     * 播放或关闭音乐
     * @param swch true：播放；false：关闭
     */
    playMusic:function(swch){

        if (swch) {
            innerAudioContext.autoplay = true;
            innerAudioContext.src = 'http://ws.stream.qqmusic.qq.com/M500001VfvsJ21xFqb.mp3?guid=ffffffff82def4af4b12b3cd9337d5e7&uin=346897220&vkey=6292F51E1E384E061FF02C31F716658E5C81F5594D561F2E88B854E81CAAB7806D5E4F103E55D33C16F3FAC506D1AB172DE8600B37E43FAD&fromtag=46'
        } else {
            console.log('stop musice');
            innerAudioContext.stop();
        }

        //设置图标
        this.setData({
            _play_music:swch
        });

        innerAudioContext.onPlay(() => {
            console.log('开始播放')
        });
        innerAudioContext.onStop(() => {
            console.log('停止播放')
        });
        innerAudioContext.onError((res) => {
            console.log(res.errMsg);
            console.log(res.errCode)
        });
    },
    onShow:function (option) {
        //如果希望用户注册后才能创建订单，则调用以下函数
        //app.isNewUser();
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
            console.log('onShareAppMessage', res)
        }
        return {
            title: '',
            path: '/pages/biz-edit/biz-edit',
            success: (res) => {
                console.log(res)
            }
        }
    },



    onReachBottom: function () {
        let cclist = this.selectComponent("#cc_list");
        cclist.onReachBottom();
    },

    onPullDownRefresh: function () {
        let cclist = this.selectComponent("#cc_list");
        cclist.onPullDownRefresh();
    },
});