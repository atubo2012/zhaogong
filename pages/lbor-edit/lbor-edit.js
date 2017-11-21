let common = require('../../common.js');
let cf = require('../../config.js');
const app = getApp();
let ut = require('../../utils/utils.js');

Page({
    /**
     * 页面的初始数据
     */
    data: {

        pageInfo: app.getPageInfo('lbor-edit'),

        hideimg:true,//是否显示图片

        //每日的空闲时段，代码初始化时为未设置，在onload函数中加载数据，界面中
        weekly:[
            {day:'MO',idle:[]},
            {day:'TU',idle:[]},
            {day:'WE',idle:[]},
            {day:'TH',idle:[]},
            {day:'FR',idle:[]},
            {day:'SA',idle:[]},
            {day:'SU',idle:[]},
        ],
    },


    /**
     * 上传图片
     */
    ulcertpic: function () {
        let _that = this;

        wx.chooseImage({

            success: function (res) {
                let tempFilePaths = res.tempFilePaths;

                wx.uploadFile({
                    url: cf.service.uploadUrl,
                    filePath: tempFilePaths[0],
                    name: 'avatar',
                    formData: {
                        'user': 'testusername'
                    },
                    success: function (res) {
                        //do something
                        console.log("后台应答上传成功1-res.data：" + res.data);
                        console.log("后台应答上传成功2-JS(res.data)：" + JSON.stringify(res.data));
                        console.log("后台应答上传成功3-JS(res.：" + JSON.stringify(res));

                        //后台生成的文件名
                        let fn = res.data;
                        _that.setData({source: cf.service.uploadUrl+'/' + fn});
                        wx.showToast({title: '上传成功', icon: 'success', duration: 2000});

                        //wx.previewImage({current:'uploads',urls:[]});
                        //wx.navigateTo({url: '../index/index'});

                        //上传成功后，将上传的图片显示出来
                        _that.setData({
                            hideimg:false
                        })
                    },
                    fail: function (res) {
                        console.log("上传失败：" + res.data)
                    }
                });
            }
        })
    },

    onSubmit: function (e) {


        /**
         * 向后台提交数据前，有3组数据：
         * （1）当前按钮触发的表单数据：e.detail.value
         * （2）app.globalData的数据，如userInfo，与当前用户相关的数据
         * （3）当前.js中的data:{}中的成员数据，如weekly，source等。data中某些数据未必是要提交到后台保存的，如hideimg
         * 前端原则上不应发送与后台保存数据无关的信息到后台，以免增加数据通讯量
         */
        ut.debug('this.data',this.data);

        ut.debug('e.detail.value',e.detail.value);

        //form表单内的数据
        let formData = e.detail.value;
        ut.debug('初始的表单数据：',formData);

        //ut.showLog('初始的表单数据：'+JSON.stringify(formData));


        //将form表单数据与用户名、业务数据
        Object.assign(formData,
            {'userInfo':app.globalData.userInfo},
            {'weekly':this.data.weekly},
            {'source':this.data.source}
        );

        ut.debug('补充空闲日期和图片链接后的表单数据:',formData);

        wx.request({
            url: cf.service.lborEditUrl,
            data: {
                /**
                 *  前端的参数通过rdata封装，不用在data中按输入域设置参数值，以减少前端代码量。
                 *  后端程序通过let p = JSON.parse(req.query.rdata)，获得rdata对象，用p.name方式获取前端页面上输入的参数值
                 */
                rdata: formData
            },
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {

                let retMsg = res.data;

                wx.showToast({
                    title: retMsg,
                    icon: 'success',
                    duration: cf.vc.ToastShowDurt
                });
                // wx.redirectTo({
                //     url: '../rqst-list/rqst-list'
                // });
                // wx.switchTab({
                //     url:'../../pages/lbor-edit/lbor-edit'
                // });
            },
            complete: function (res) {
                console.log("修改个人信息完成");
            }
        })
    },
    blurName:function (e) {
        console.log(e);
    },
    formReset: function () {
        console.log('form发生了reset事件');
    },

    bindDateChange: function(e) {
        console.log('picker发送选择改变，携带值为', e.detail.value);
        this.setData({
            osdt: e.detail.value,
        })
    },
    bindTimeChange: function(e) {
        console.log('picker发送选择改变，携带值为', e.detail.value);
        this.setData({
            ostm: e.detail.value,
        })
    },

    addidle: function (e) {

        console.log('addidle1');
        console.log(JSON.stringify(e));

        console.log('addidle1');
        console.log(e.detail.value);

        let wkidx = parseInt(e.detail.value.wkidx);

        this.data.weekly[wkidx].idle.push({fr:'1111',to:'2222'});
        this.setData({
            weekly:this.data.weekly
        });
    },
    delidle: function (e) {
        console.log(JSON.stringify(e.detail));

        let wkidx = parseInt(e.detail.value.wkidx);
        let idledidx =parseInt(e.detail.value.idledidx);

        //从空闲时段数组中删除选中的元素
        this.data.weekly[wkidx].idle.splice(idledidx,1);
        this.setData({
            weekly:this.data.weekly
        });

        console.log('删除['+wkidx+'|'+idledidx+']时段后weekly：');
        console.log(JSON.stringify(this.data.weekly));

    },
    frInput:function (e) {

        let dataset = e.target.dataset;

        this.data.weekly[dataset.wkidx].idle[dataset.idledidx].fr=e.detail.value;
        this.setData({
            weekly:this.data.weekly
        });
        //console.log(JSON.stringify(this.data.weekly));
    },
    toInput:function (e) {

        //通过组件中的数据绑定，获得与该输入项有关的参数
        let dataset = e.target.dataset;

        this.data.weekly[dataset.wkidx].idle[dataset.idledidx].to=e.detail.value;
        this.setData({
            weekly:this.data.weekly
        });
        //console.log(JSON.stringify(this.data.weekly));

    },
    /**
     * 页面加载时，查询用户信息
     */
    onLoad: function () {

        let _that = this;

        wx.setNavigationBarTitle({
            title: '个人信息更新'
        });

        /**
         * 获取当前微信用户信息，在app的onload函数中没有被执行的时候
         * TODO：此处是否有必要增加以下代码获取userInfo，屏蔽代码后尝试是否可以
         */
        // if (app.globalData.userInfo) {
        //     //console.log('app.globalData.userInfo='+JSON.stringify(app.globalData.userInfo));
        //     this.setData({
        //         userInfo: app.globalData.userInfo,
        //         hasUserInfo: true
        //     })
        // } else {
        //     // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
        //     // 所以此处加入 callback 以防止这种情况
        //     app.userInfoReadyCallback = res => {
        //         console.log('res.userInfo='+JSON.stringify(res.userInfo));
        //         this.setData({
        //             userInfo: res.userInfo,
        //             hasUserInfo: true
        //         })
        //     }
        // }


        //加载当前用户的空闲信息
        wx.request({
            url:cf.service.lborDetlUrl,
            data:{
                userInfo:app.globalData.userInfo
            },
            header:{
                'Content-Type':'application/json'
            },
            success:function (res) {

                let lborInfo = JSON.stringify(res.data);

                console.log(res);
                console.log(res.data);
                console.log(lborInfo);

                //如果后台返回的数据为空说明尚未建立用户信息
                if("0"===lborInfo)
                {
                    console.log('后台lborInfo无数据。不设置data中的lborInfo和weekly');
                }else{
                    console.log('后台lborInfo有数据，设置data中的lborInfo');
                    _that.setData({lborInfo:res.data});
                    _that.setData({weekly:res.data.weekly});
                    _that.setData({source:res.data.source});
                    _that.setData({hideimg:false});//设置为图片可展示
                }
            }
        })
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

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