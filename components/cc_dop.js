let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        biz_type: {
            type: String
        },
        userInfo: {
            type: Object
        },
        type: {
            type: String
        },
        page: {
            type: String
        },

    },

    data: {
    },

    methods: {
        /**
         * 生成二维码
         * 算法：
         * 1、生成交易序号out_trade_no
         * 2、计算交易金额total_fee
         * 3、发送请求到后端，后端向微信申请统一下单申请，后端收到申请应答payModel
         * 4、以payModel作为参数拉起微信支付界面(wx.requestPayment())，输入支付密码，向微信发起支付
         * 5、支付成功后查询支付结果
         */
        _getMyQr:function (e) {
            let that = this;
            ut.showLoading('正在生成分销码');
            console.log('生成二维码 rp:',this.data);
            let ds = this.data;

            let scene = ds.type+'&'+ds.userInfo.uid+'&'+(ds.biz_type||'')+'&'+cf.runMode;
            let rdata = {
                userInfo:ds.userInfo,
                page:'pages/'+ds.page+'/'+ds.page,
                scene:scene,
                width:430,
                auto_color:false
            };
            wx.request({
                url: cf.service.genQrCodeUrl,
                data: {
                    rdata:rdata
                },
                header: {
                    'session3rdKey': wx.getStorageSync('session3rdKey'),
                },
                success: function (res) {
                    ut.checkSession(res, app, that, function (option) {
                        let retMsg = res.data;
                        let url = cf.runtimeConfig.url+'/upload/'+retMsg;
                        console.log('生成二维码 应答res:',res,url);

                        that.setData({
                            qrcodeUrl:url
                        });

                        wx.previewImage({
                            urls: [url]
                        });
                    });
                },fail: function (res) {
                    console.log('生成二失败 ：',res);
                    ut.showToast('系统忙，请稍后再试');
                },
                complete: function (res) {
                    ut.info("生成二维码 完成");
                    ut.hideLoading();
                }
            });
        },
    }
});
