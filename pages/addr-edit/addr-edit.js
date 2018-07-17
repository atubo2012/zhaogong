'use strict';
let ut = require('../../utils/utils.js');
const app = getApp();
let cfg = app.globalData.cf;

    Page({
    data: {

        /**
         * 页面顶端显示的motto和模块标题
         */
        pageInfo: app.getPageInfo('addr-edit'),
        listTitle: '常用地址管理',

        /**
         * 页面控件的控制参数
         */
        showTips: false,    //字段校验出错时的提示信息。


        /**
         *表单控制参数
         */
        addHidden: true,            //aform默认不显示
        buttonType: 'primary',      //编辑form的按钮类别，默认为primary，删除时设置为warn
        newRecord: {},              //aform中输入项，在提交后需要用该对象重置
        submitButtonDisabled: false,//提交按钮默认状态，点击提交后设置为true，避免重复提交。
        addressList:[],

        hideDetl: true,             //detl页面默认不显示。当点击修改按钮后，编辑界面显示出来编辑模式。SPM中该参数被list中元素的对应属性取代。


        /**
         * 查询条件与数据
         */
        list: [], //onload函数、onReachBottom从后台查询后的列表查询结果

        /**
         * 查询条件，后台收到该参数后，直接将参数设置到find语句中。
         * find({cond.query}).skip(cond.skip).limit(cond.limit)
         * todo:将cond参数放到onfig中配置
         */
        cond: {
            query: {},
            skip: 0,
            limit: cfg.pageSize,
        },

        /**
         * 翻页控制参数。
         * 翻页算法：
         * 1、上拉时查询后10条，追加到当前的list末尾
         *    1）查询条件：cond:{skip:this.data.paging.pageNum*this.data.paging.pageSize,'userInfo.nickName': app.globalData.userInfo.nickName,this.data.pageNum}
         *    2）应答后的处理：
         *      a)if(res.data.length<this.data.paging.pageSize) this.setData({'paging.hasMore':false,this.data.paging.pageNum:this.data.paging.pageNum+1})
         *      b)追加结果到list末尾，渲染页面
         *    3）上拉时的校验条件
         *      if(this.data.paging.hasMore) { onLoad() } else {提示没有记录了}
         *
         * 2、下拉时查询最新的10条，刷新list
         *    1）清空list
         *    2）将paging参数设置为初始值
         *    3）调用onLoad()
         */
        paging: {
            pageSize: cfg.pageSize,//每页的记录数，在config文件中配置。
            pageNum: 0,      //当前已经翻到的页数，返回的后台数据条数大于或等于pageSize时pageNum加1。
            hasMore: true,   //是否有下一页，后台返回的记录数如果小于pageSize（res.data.length<pageSize），则将hasMore设置为false，表示没有记录了。
        },

        lastLoadTime:0,//下拉计数器，每下拉一次加一，超过阀值则提示。

        /**
         * 新增，修改条件，将发往后台保存入库的业务数据，其中包括特殊组件的实际取值
         */
        rdata: {
            rdst: '1',//记录状态。1有效，0无效
        },


    },


    /**
     * 上拉时查询新一页的内容
     */
    onReachBottom: function () {
        ut.debug('onreachbottom.....');
        let that = this;

        /**
         * 如果还有下一页，则设置新的查询条件(主要是skip的数量要更新)
         */
        if (that.data.paging.hasMore) {
            this.setData({
                cond: {
                    query: that.data.cond.query,//使用上次的查询条件
                    skip: that.data.paging.pageNum * that.data.paging.pageSize, //跳过已经查询过的记录。
                    limit: cfg.pageSize
                }
            });
            ut.debug('本次的查询条件为:', that.data.cond);

            //从后台获取数据
            wx.request({
                url: cfg.service.userAddrUrl,
                data: {
                    userInfo: app.globalData.userInfo,
                    cond: that.data.cond
                },
                header: {
                    'session3rdKey':wx.getStorageSync('session3rdKey'),
                },
                success: function (res) {
                    ut.debug("常用地址信息查询结果如下：", res.data);
                    let list = res.data;

                    //对UTC日期类字段转换成与当前时间长度的描述
                    list.map(function (item) {
                        item.updt = ut.getTimeShow(item.updt);
                    });


                    //将返回结果追加到data.list中，并渲染页面，隐藏新增区
                    let newList = that.data.list.concat(list);
                    ut.debug(newList);
                    that.setData({
                        'list': newList,
                        addHidden: true //隐藏新增区
                    });

                    //分页处理:判断是否为最后一页，如果返回结果少于一页的记录数，则说明没有新页了
                    if (list.length < that.data.paging.pageSize) {
                        ut.debug('记录数为' + list.length + '，小于一页的记录数，说明已经没有数据了');
                        that.setData({
                            'paging.hasMore': false,
                        });
                    } else {
                        ut.debug('记录数为' + list.length + '，大于等于一页的记录数，说明还有数据，更新后的页码数为' + that.data.paging.pageNum);
                        that.setData({
                            'paging.pageNum': that.data.paging.pageNum + 1,
                            'paging.hasMore': true,
                        });
                    }
                }
            });


        } else {
            ut.debug('没有记录了', that.data);
        }
    },


    onPullDownRefresh: function (e) {


        //wx.startPullDownRefresh(OBJECT)
        ut.debug('下拉刷新查询');

        let now = new Date();
        let interval = now - this.data.lastLoadTime;
        if ( interval>=cfg.vc.PAGE_REFRESH_INTERVAL) {
            /**
             * 新建、更新操作提交后，要重置查询条件，并再次查询，刷新界面。
             */
            this.setData({
                paging: {
                    pageSize: cfg.pageSize,//每页的记录数，在config文件中配置。
                    pageNum: 0,      //当前已经翻到的页数，在收到后台数据后+1。
                    hasMore: true,   //是否有下一页，后台返回的记录数如果小于pageSize（res.data.length<pageSize），则将hasMore设置为false，表示没有记录了。
                },
                cond: {
                    query: {},
                    skip: 0,
                    limit: cfg.pageSize,
                }
            });
            this.onLoad();
            this.data.lastLoadTime=now;
        } else {
            ut.debug('太频繁',(now - this.data.lastLoadTime));
            ut.alert('不能这么刷啊', 'success');
        }
    },


    onSubmit: function (e) {

        this.setData({
            submitButtonDisabled: true
        });

        let that = this;

        ut.debug('form的数据:', e.detail.value);
        ut.debug('this.data:', this.data);

        let rdata = e.detail.value;

        //将三类数据组合（form的额数据、this.data.jlzt、userInfo对象），准备发给后台：
        Object.assign(
            rdata, //表单参数
            this.data.rdata, //追加默认参数
            {'userInfo': app.globalData.userInfo}
        );
        ut.debug('rdata:', rdata);

        wx.request({
            url: cfg.service.userAddrUrl,
            method: 'POST',
            data: {
                /**
                 *前端的参数通过rdata封装，不用在data中按输入域设置参数值，以减少前端代码量。
                 *后端程序通过let p = JSON.parse(req.query.rdata)，获得rdata对象，
                 * 用p.name方式获取前端页面上输入的参数值
                 */
                rdata: rdata
            },
            header: {
                'session3rdKey':wx.getStorageSync('session3rdKey'),
            },
            success: function (res) {

                //如果会话超时，则清空用户数据后重新登录，确认后重新调用onLoad()
                if (res.header.RTCD === 'RTCD_SESSION_TIMEOUT') {
                    //清空userInfo，目的是让app.getUserInfo重新触发向后端的登录操作
                    app.globalData.userInfo = null;
                    app.getUserInfo(function () {
                        that.onSubmit(e);
                    });
                    return;
                }

                let retMsg = res.data;
                ut.debug('应答信息',retMsg);

                ut.alert(retMsg,'success');

                that.onPullDownRefresh();
            },
            complete: function (res) {
                ut.info("地址更新完成");
                that.setData({
                    newRecord: {}
                });

            }
        })
    },


    /**
     * 默认展现当前用户所管理的常用地址列表
     * @param options
     */
    onLoad: function (options) {

        ut.showLoading();

        let that = this;

        Object.assign(this.data.cond.query, {'userInfo.openId': app.globalData.userInfo.openId});
        that.setData({
            cond: that.data.cond
        });

        ut.debug('onLoad-1', that.data.cond,'本地存储内的header:',wx.getStorageSync('session3rdKey'));

        //从后台获取数据
        wx.request({
            url: cfg.service.userAddrUrl,
            data: {
                userInfo: app.globalData.userInfo,
                cond: that.data.cond
            },
            header: {
                'session3rdKey':wx.getStorageSync('session3rdKey'),
            },
            success: function (res) {

                //如果会话超时，则清空用户数据后重新登录，确认后重新调用onLoad()
                if (res.header.RTCD === 'RTCD_SESSION_TIMEOUT') {
                    ut.debug('onLoad-3,调用app.getUserInfo重生成session');

                    //清空userInfo，目的是让app.getUserInfo重新触发向后端的登录操作
                    app.globalData.userInfo = null;
                    app.getUserInfo(function () {
                        ut.debug('onLoad-5,重新调用onLoad函数');
                        that.onLoad(options);
                    });
                    return;
                }

                ut.info("onLoad-7，常用地址信息查询结果如下：", res.data);
                let list = res.data;

                //对UTC日期类字段转换成与当前时间长度的描述
                list.map(function (item) {
                    item.updt = ut.getTimeShow(item.updt);
                });


                that.setData({
                    'list': list,
                    addHidden: true //隐藏新增区
                });

                //分页处理:判断是否为最后一页，如果返回结果少于一页的记录数，则说明没有新页了
                if (list.length < that.data.paging.pageSize) {
                    ut.debug('onLoad-7，记录数为' + list.length + '，小于一页的记录数，说明已经没有数据了');
                    that.setData({
                        'paging.hasMore': false,
                    });
                } else {
                    that.setData({
                        'paging.pageNum': that.data.paging.pageNum + 1,
                    });
                    ut.debug('onLoad-8，记录数为' + list.length + '，大于等于一页的记录数，说明还有数据，更新后的页码数为' + that.data.paging.pageNum);
                }
                ut.hideLoading();

            }
        });

    },

    onEdit: function (e) {

        let index = e.target.dataset.idx;
        this.data.list[index]['hidden'] = !this.data.list[index]['hidden'];
        this.data.list[index]['disabled'] = false;

        this.setData({
            'rdata.rdst': '1',
            list: this.data.list,
            submitButtonDisabled: false,
            buttonType: 'primary',
        });
    },

    onDelete: function (e) {

        let index = e.target.dataset.idx;
        this.data.list[index]['hidden'] = !this.data.list[index]['hidden'];//将当前记录对应的form表单显示出来
        this.data.list[index]['rdst'] = '0';//删除
        this.data.list[index]['disabled'] = true;//输入框不可编辑

        console.log(this.data.list);
        this.setData({
            'rdata.rdst': '0',
            list: this.data.list,
            submitButtonDisabled: false,
            buttonType: 'warn'
        });
    },

    onAdd: function (e) {

        this.setData({
            'rdata.rdst': '1',
            submitButtonDisabled: false,
            addHidden: !this.data.addHidden,
            buttonType: 'primary'
        });
    },

    itemtap2: function (e) {

        ut.debug(e);
        let index = e.target.dataset.rcdidx;
        this.data.list[index]['addr'] = e.target.dataset.address;

        this.setData({
            list: this.data.list,
            addressList: []
        });
    },

    bindKeyInput2:function (e) {
        ut.debug(e);
        ut.setAddress(e,'addr2','addressList',this);
    },

    itemtap: function (e) {
        ut.debug(e);
        // this.setData({
        //     'newRecord.newAddr': e.target.id,
        //     addressList: []
        // });


        let location = {'longitude':e.target.dataset.location.lng,'latitude':e.target.dataset.location.lat}; //下拉列表中的经纬度构造成对象。
        this.setData({
            'newRecord.newAddr': e.target.dataset.address,
            'newRecord.location': JSON.stringify(location),//将对象以字符串的方式
            addressList: []
        })
    },

    bindKeyInput:function (e) {
        ut.debug('输入的内容',e);
        ut.setAddress(e,'addr','addressList',this);
    },

    formReset: function (e) {
        console.log(e);
    },


});