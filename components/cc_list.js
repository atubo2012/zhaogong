'use strict';
let ut = require('../utils/utils.js');
const app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        //已查询到前端的数据结果
        list:{
            type:Object,
            value:[]
        },

        //当数据是从后端获取时，需要指定后端服务的URL和查询条件
        serviceUrl:String,

        /**
         * 查询条件，后台收到该参数后，直接将参数设置到find语句中。
         * find({cond.query}).skip(cond.skip).limit(cond.limit)
         */
        cond: {
            type:Object,
        },

        /**
         * 指定使用哪一类详情页面文件
         */
        itemname:String,
    },

    /**
     * 组件的初始数据
     */
    data: {
        /**
         * 页面顶端显示的motto和模块标题
         */
        pageInfo: cf.motto['addr-edit'],
        listTitle: '常用地址管理',

        /**
         * 页面控件的控制参数
         */
        showTips: false,    //字段校验出错时的提示信息。


        /**
         * 查询数据结果
         */
        list: [], //onload函数、onReachBottom从后台查询后的列表查询结果

        cf:cf,



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
            pageSize: cf.pageSize,//每页的记录数，在config文件中配置。
            pageNum: 0,      //当前已经翻到的页数，返回的后台数据条数大于或等于pageSize时pageNum加1。
            hasMore: true,   //是否有下一页，后台返回的记录数如果小于pageSize（res.data.length<pageSize），则将hasMore设置为false，表示没有记录了。
        },
        lastLoadTime: 0,//下拉计数器，每下拉一次加一，超过阀值则提示。
    },

    /**
     * 组件的方法列表
     */
    methods: {

        /**
         * 在detail记录中，可以绑定数据和事件，当用户触发
         * 用户点击某条记录后，可以向主调模块发送冒泡事件，通知
         * @param e
         */
        showDetail:function (e) {
            console.log('cc_list.showDetail():触发冒泡事件,dataset:',e.currentTarget.dataset);
            this.triggerEvent(
                e.currentTarget.dataset.event,  //冒泡事件，触发univ-list.wxml中的通知事件，激活univ-list.js中的showDetail
                {
                    'detaildata':e.currentTarget.dataset.detaildata,//item对应的detail数据
                    'eventtype':e.currentTarget.dataset.eventtype,//事件类别，在univ-list.js.showDetail()中用于区分事件来自哪个组件
                },
                { bubbles: true ,composed:true}
            );
        },

        omitEvent:function (e) {
            console.log('cc_list.omitEvent():触发冒泡事件,dataset:',e.currentTarget.dataset);
            this.triggerEvent(
                e.currentTarget.dataset.event,  //冒泡事件，触发univ-list.wxml中的通知事件，激活univ-list.js中的showDetail
                {
                    'detaildata':e.currentTarget.dataset.detaildata,        //item对应的detail数据
                    'eventtype':e.currentTarget.dataset.eventtype,          //事件类别，在univ-list.js.showDetail()中用于区分事件来自哪个组件
                    'method':e.currentTarget.dataset.method,  //univ-list.js中处理该事件的方法
                },
                { bubbles: true ,composed:true}
            );
        },


        onLoad:function (cb) {
            this.onReachBottom(cb)
        },
        /**
         * 上拉时查询新一页的内容
         */
        onReachBottom: function (cb) {
            let that = this;
            ut.showLoading();

            /**
             * 如果还有下一页，则设置新的查询条件(主要是skip的数量要更新)
             */
            if (that.data.paging.hasMore) {
                this.setData({
                    cond: {
                        skip: that.data.paging.pageNum * that.data.paging.pageSize, //跳过已经查询过的记录。
                        query: that.data.cond.query,//使用上次的查询条件
                        limit: that.data.cond.limit,
                        coll: that.data.cond.coll,
                        sort:that.data.cond.sort,
                    }
                });



                ut.debug('本次的查询条件为:', that.data.cond);


                if(that.data.serviceUrl) {
                    //从后台获取数据
                    console.log('that.data.serviceUrl',that.data.serviceUrl);
                    wx.request({
                        url: that.data.serviceUrl,
                        data: {
                            cond: that.data.cond
                        },
                        success: function (res) {
                            let list = res.data;
                            console.log(list);

                            //如指定了数据预处理函数，则执行预处理。
                            if(cb && typeof(cb)==='function'){
                                cb(list);
                            }


                            //将返回结果追加到data.list中，并渲染页面，隐藏新增区
                            let newList = that.data.list.concat(list);
                            that.setData({
                                'list': newList,
                                addHidden: true //隐藏新增区
                            });



                            //分页处理:判断是否为最后一页，如果返回结果少于一页的记录数，则说明没有新页了
                            if (list.length < that.data.paging.pageSize) {
                                that.setData({
                                    'paging.hasMore': false,
                                });
                            } else {
                                that.setData({
                                    'paging.pageNum': that.data.paging.pageNum + 1,
                                    'paging.hasMore': true,
                                });
                            }
                            ut.hideLoading();
                        }
                    });
                }
            } else {
                ut.alert(cf.hint.H_NOMORE,'none');
            }
        },

        /**
         * 下拉刷新处理函数
         * @param e
         */
        onPullDownRefresh: function (e) {


            //wx.startPullDownRefresh(OBJECT)
            ut.debug('下拉刷新查询');

            let now = new Date();
            let interval = now - this.data.lastLoadTime;
            if (interval >= cf.vc.PAGE_REFRESH_INTERVAL) {
                /**
                 * 新建、更新操作提交后，要重置查询条件，并再次查询，刷新界面。
                 */
                this.setData({
                    paging: {
                        pageSize: cf.pageSize,//每页的记录数，在config文件中配置。
                        pageNum: 0,      //当前已经翻到的页数，在收到后台数据后+1。
                        hasMore: true,   //是否有下一页，后台返回的记录数如果小于pageSize（res.data.length<pageSize），则将hasMore设置为false，表示没有记录了。
                    },
                    cond: {
                        skip: that.data.paging.pageNum * that.data.paging.pageSize, //跳过已经查询过的记录。
                        query: that.data.cond.query,//使用上次的查询条件
                        limit: that.data.cond.limit,
                        coll: that.data.cond.coll,
                        sort:that.data.cond.sort,
                    }
                });
                this.onLoad();
                this.data.lastLoadTime = now;
            } else {
                //ut.debug('太频繁', (now - this.data.lastLoadTime));
                ut.alert('不能这么刷啊', 'success');
            }
        },

    }
});
