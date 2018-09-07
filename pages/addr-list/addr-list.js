const app = getApp();
const cf = app.globalData.cf;

Page({

    data: {

        pageInfo: cf.motto['lbor-edit'],

        //默认地址列表为空，页面加载时根据用户的地址信息保存。
        addrs:[],
    },


    onSubmit: function (e) {

        let that = this;

        wx.request({
            url: cf.service.addrsUrl,
            method:'POST',
            data: {
                rdata: that.data.addrs,
                userInfo:app.globalData.userInfo
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
            },
            complete: function (res) {
                console.log("更新地址信息完成");
            }
        });
    },


    onAdd: function (e) {
        this.data.addrs.push({});
        this.setData({
            addrs:this.data.addrs
        });
    },
    /**
     * 通用的输入项数据绑定函数
     * @param e
     */
    onSetProps:function (e) {

        let dataset = e.target.dataset;
        console.log(e);
        this.data.addrs[dataset.idx][dataset.prop]=e.detail.value;
        this.setData({
            addrs:this.data.addrs
        });

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
            url:cf.service.addrsUrl,

            data:{
                userInfo:app.globalData.userInfo,
                //rdata:_that.addrs
            },
            header:{
                'Content-Type':'application/json'
            },
            success:function (res) {

                console.log(res);
                let addrs=res.data;

                console.log(addrs);
                //如果后台返回的数据为空说明尚无地址信息
                if(""===addrs)
                {
                    console.log('后台无地址数据，不设置data中的addrs');
                }else{
                    console.log('后台有地址数据，设置data中的addrs');
                     _that.setData({addrs:res.data});
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