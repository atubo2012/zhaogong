'use strict';
let common = require('../../common.js');
let cfg = require('../../config.js');
let ut = require('../../utils/utils.js');
const app = getApp();

Page({
    data: {
        //控制参数，向后台提交数据前应删除
        pageInfo: app.getPageInfo('rqst-edit'),
        showTips: false,
        preview: true,//初始默认为显示，点击修改后，进入编辑模式。

        //初始的业务参数
        radioItems: [
            {name: '家里有', value: '有'},
            {name: '带工具', value: '带', checked: true},
            {name: '买工具', value: '买'}
        ],

        submitButtonDisabled: false,

        //rdata承载业务数据。新增记录场景中，数据来自e.detail.value；修改成精中，数据来自res.data
        rdata: {}
    },

    /**
     * 生命周期函数
     */
    onLoad: function (options) {

        let _that = this;

        //如果id字段不为空，则进入编辑模式，从后台获取数据，然后用setData(rdata:res.data[0])，渲染页面数据。
        if (typeof(options.reqId) !== "undefined") {
            ut.debug('进入编辑模式.....加载业务数据');


            //从后台获取数据
            wx.request({
                url: cfg.service.rqstListUrl,
                data: {
                    reqId: options.reqId
                },
                header: {
                    'Content-Type': 'application/json'
                },
                success: function (res) {

                    let ret = res.data[0]; //后端返回的是一个数组。

                    //如果后台返回的数据为空说明尚未建立用户信息
                    if ("0" === ret) {
                        ut.debug('后台无数据。');
                    } else {
                        ut.debug('后台有数据，将应答结果设置到rdata中');
                        _that.setData({'rdata': ret});
                    }
                }
            })

        } else {
            ut.debug('进入新增模式.....，设置新增界面的默认值（如picker为当前时间）');
            _that.setData({
                'rdata.osdt': ut.getToday('-'),
                'rdata.ostm': ut.getNow(':'),
                'rdata.rdst': '1',//记录状态。1有效，0无效
                preview: false,
            });
        }
    },

    chooseAddr: function (e) {
        wx.chooseAddress({
            success: function (res) {
                ut.debug(res.userName)
                ut.debug(res.postalCode)
                ut.debug(res.provinceName)
                ut.debug(res.cityName)
                ut.debug(res.countyName)
                ut.debug(res.detailInfo)
                ut.debug(res.nationalCode)
                ut.debug(res.telNumber)
            }
        })
    },

    formSubmit: function (e) {

        this.setData({
            submitButtonDisabled: true
        });

        //将表单中录入的数据封装成一个对象，保存在data中，在页面上以“对象.变量名”方式展现
        //获取表单中输入的参数
        let rdata = e.detail.value;
        //将表单中输入的参数，回写到data.rdata中
        this.setData({'rdata': rdata});
        //将用户信息加入到业务对象中，以便识别创建人。
        Object.assign(rdata, {userInfo: app.globalData.userInfo});

        ut.debug('发给后台的参数:',rdata);

        wx.request({
            url: cfg.service.rqstEditUrl,
            data: {
                //前端的参数通过rdata封装，不用在data中按输入域设置参数值，以减少前端代码量。
                //后端程序通过let p = JSON.parse(req.query.rdata)，获得rdata对象，用p.name方式获取前端页面上输入的参数值
                rdata: rdata
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {

                let retMsg = res.data;

                wx.showToast({
                    title: retMsg,
                    icon: 'success',
                    duration: cfg.vc.ToastShowDurt
                });

                //准备msg文件中所需要的内容
                app.globalData['result'] = {rtype: 'success', rdesc: '操作成功', ndesc: '查看我的订单'};
                //跳转到结果页中
                wx.redirectTo({
                    url: '../../pages/msg/msg'
                });
            },
            complete: function (res) {
                ut.info("下单完成");
            }
        })
    },
    formReset: function (e) {

    },
    delete: function (e) {
        ut.debug('删除按钮被次点击');

        let dataset = e.target.dataset;

        ut.debug(e.target.dataset);
        ut.debug(e);

        wx.request({
            url: cfg.service.rqstEditUrl,
            data: {
                //前端的参数通过rdata封装，不用在data中按输入域设置参数值，以减少前端代码量。
                //后端程序通过let p = JSON.parse(req.query.rdata)，获得rdata对象，用p.name方式获取前端页面上输入的参数值
                rdata: {reqId:dataset.reqid,rdst:'0'}
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {

                let retMsg = res.data;

                wx.showToast({
                    title: retMsg,
                    icon: 'success',
                    duration: cfg.vc.ToastShowDurt
                });

                //准备msg文件中所需要的内容
                app.globalData['result'] = {rtype: 'success', rdesc: '操作成功', ndesc: '查看我的订单'};
                //跳转到结果页中
                wx.redirectTo({
                    url: '../../pages/msg/msg'
                });
            },
            complete: function (res) {
                ut.debug("删除完成");
            }
        })

    },


    /**单选框控制函数**/
    radioChange: function (e) {
        ut.debug('radio发生change事件，携带value值为：', e.detail.value);

        let radioItems = this.data.radioItems;
        for (let i = 0, len = radioItems.length; i < len; ++i) {
            radioItems[i].checked = radioItems[i].value == e.detail.value;
        }

        //将checkbox数组设置为this.data
        this.setData({
            radioItems: radioItems
        });

        //将选中的值到this.data中
        this.setData({
            tools: e.detail.value
        });
    },

    bindDateChange: function (e) {
        this.setData({
            'rdata.osdt': e.detail.value,
        })
    },
    bindTimeChange: function (e) {
        this.setData({
            'rdata.ostm': e.detail.value,
        })
    },
    changePreview: function (e) {
        this.setData({
            preview: !this.data.preview,
        });
    },


    onReady: function (e) {
        // 使用 wx.createMapContext 获取 map 上下文


    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
});