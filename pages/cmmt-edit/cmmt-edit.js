'use strict';
let amapFile = require('../../vendor/amap-wx.js');
let ut = require('../../utils/utils.js');
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

            comment: '',     //默认的评价描述
            starAmt: 0,      //星级数量
            impression: [],  //默认的印象
            reqId: '',       //前一个页面跳转到本页面时传递的参数
        },

        /**
         * 页面组件中使用的默认参数
         */
        starItems: [        //默认为5颗星都未为被选中，该数组中数量为true的个数为星级数量
            {checked: false},
            {checked: false},
            {checked: false},
            {checked: false},
            {checked: false},
        ],

        impItems: [],       //印象标签，页面加载时，从user表中加载并渲染
        showAddTag: false,   //默认不显示新印象的输入框
        newTag: '',          //新印象输入的内容

    },

    /**
     * 点击对新建tag的删除按钮时，从数组中删除，并重新渲染界面
     * @param e
     */
    delTag: function (e) {
        let index = parseInt(e.target.id);

        //删除指定下标(index)的数组元素
        let newimpItems = this.data.impItems;
        newimpItems.splice(index, 1);   //splice返回值是被删掉的元素构成的数组

        this.setData({
            impItems: newimpItems
        })
    },

    /**
     * 根据输入的内容，渲染到将添加的属性中。
     * @param e
     */
    setTag: function (e) {
        ut.debug(e);
        this.setData({
            newTag: e.detail.value
        });
    },

    /**
     * 将新的印象标签追加到原有印象标签数组的末尾，并渲染
     * @param e
     */
    addNewImp: function (e) {
        let newImpItems = this.data.impItems;
        newImpItems.push({desc: this.data.newTag, times: 1, isNew: true});

        this.setData({
            impItems: newImpItems,
            newTag: '',
            showAddTag: false   //添加一条印象后，
        });
        ut.debug(this.data.impItems);

    },
    /**
     * 代表“新建”的icon被点击时，显示输入框和按钮
     * @param e
     */
    showAddTag1: function (e) {
        let that = this;
        this.setData({
            showAddTag: !that.data.showAddTag
        })
    },

    /**
     * 点击标签后的处理
     * 1、点击到旧标签时，如果被选中，则对times+1，checked变为true；如取消选中，则对times=oldtimes，checked变为false
     * 2、点击到新标签时，被点击后直接返回。
     * @param option
     */
    impClick: function (option) {
        ut.debug(option);

        let id = option.target.id;
        let items = this.data.impItems;

        ut.debug(items[id].oldtimes);

        if (!items[id].isNew)//旧标签
        {
            ut.debug('旧标签被点击', items[id].oldtimes);
            ut.debug('旧标签checked', items[id].checked);
            //如被选中，则在原来的数值上+1，如未被选，则恢复到原来的数值中。
            items[id].checked ?
                items[id].times = this.data.impItems[id].oldtimes :      //已被选中的情况下被点击，则回复到oldtimes
                items[id].times = this.data.impItems[id].oldtimes + 1;    //未被选中的情况下被点击，对基于oldtimes+1

            items[id].checked = !items[id].checked;

            this.setData({
                impItems: items
            });
        } else {
            ut.debug('新标签被点击，不做任何处理');
        }

    },

    setStar: function (option) {
        let id = parseInt(option.target.id);
        let items = this.data.starItems;

        //根据当前点击的索引位置，将其右侧的取消标星，将其及左侧的标星
        for (let i = 0; i < items.length; i++) {
            if (i <= id) {
                items[i]['checked'] = true;
            } else {
                items[i]['checked'] = false;
            }
        }
        this.setData({
            starItems: items,
            starAmt: id + 1
        });
    },

    onLoad: function (option) {

        let that = this;
        ut.debug('cmmt-edit', option);
        ut.showLoading();


        //I：如果id字段不为空，则进入编辑模式，从后台获取数据，然后用setData(rdata:res.data[0])，渲染页面数据。
        if (typeof(option.reqId) !== "undefined") {
            ut.debug('进入编辑模式.....加载业务数据');

            //便于地图行程切换时使用参数
            that.setData({
                'rdata.reqId': option.reqId,
                'rdata.role':app.globalData.userInfo.role,
                'rdata.observerOpenId': app.globalData.userInfo.openId,
                'rdata.assesseeOpenId': option.assesseeOpenId
            });

            //从后台的user中获取被评价人的印象标签数据
            wx.request({
                url: cf.service.cmmtListUrl,
                data: {
                    openId: option.assesseeOpenId,
                    mode: 'hisimp',
                },
                header: {
                    'session3rdKey': wx.getStorageSync('session3rdKey'),
                },
                success: function (res) {
                    ut.checkSession(res, app, that, function (option1) {

                        let ret = res.data[0]; //后端返回的是一个数组。
                        //如果后台返回的数据为空说明尚未建立用户信息
                        if ("0" === ret) {
                            ut.debug('后台无数据。');
                        } else {
                            ut.debug('后台有数据，将应答结果设置到rdata中', res);
                            //用DB保存的值渲染单选框中的数据
                            let impItems = that.prepareImpItems(ret.impItems);

                            that.setData({
                                'impItems': impItems,
                            });
                            ut.hideLoading();
                        }
                    });

                }
            })

        } else {
            //新增模式要校验是否会话过期
            ut.checkSession(null,app,that,()=>{
                ut.debug('进入新增模式，隐藏详情页面');
            })
        }
    },

    /**
     * 将“印象”标签中无需保存到DB的属性删除
     * @param e
     * @returns {Array}
     */
    getImpItems: function (e) {
        let imps = this.data.impItems;
        imps.map(function (item) {
            delete item.oldtimes;
            delete item.isNew;
            delete item.checked;
        });
        return imps;
    },

    /**
     * 加载万“印象”标签后，临时添加控制属性
     * @param imps
     * @returns {*}
     */
    prepareImpItems: function (imps) {

        //后端返回的数据中如没有imps对象，则将该对象初始值设置为空数组。
        if (typeof(imps) === 'undefined') {
            imps = [];
        } else { //针对原来的印象标签元素中增加控制属性
            imps.map(function (item) {
                item['oldtimes'] = item.times;  //原来的次数
                item['checked'] = false;        //是否被选中
                item['isNew'] = false;          //是否是本次新添加的标签
            });
        }

        return imps;
    },
    onSubmit: function (e) {

        let that = this;
        //防止重复提交
        this.setData({
            submitButtonDisabled: true
        });



        let rdata = e.detail.value;
        rdata.starAmt = this.data.starAmt;
        rdata.impItems = this.getImpItems(this.data.impItems);

        ut.debug('rdata的数据:', rdata);

        if(rdata.comment===''){
            ut.showTopTips(that,'请填写评价内容','focusComment',cf);
            return
        }

        wx.request({
            url: cf.service.cmmtEditUrl,
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
                        success: function (e) {

                            ut.debug(e);

                            // 准备msg文件中所需要的内容TODO:将链接也作为参数传到下一页，或将下面的代码封装成一个函数。
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
            }
        })
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


    changePreview: function (e) {
        this.setData({
            preview: !this.data.preview,
        });

        let st = e.target.dataset.submittype;
        ut.debug('st==============', st);
        if (st === 'onemore') {
            ut.debug('再来一单,清空reqId');
            this.setData({
                'rdata.reqId': '',
                'rdata.osdt': '',
                'rdata.ostm': '',
                'rdata.stat': 'wait'
            });
        }

    },


});