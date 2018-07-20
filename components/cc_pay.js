let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        //金额     ：cost
        //订单编号  ：reqId
        //业务类别  ：body，biz_type的value，biz_type需要预先在cf.hint中配置
        //产品类别  ：product_id，biz_type的key
        cc_rdata:{
            type:Object
        },
    },

    data: {
    },

    methods: {
        /**
         * 订单支付按下后的处理
         * 算法：
         * 1、生成交易序号out_trade_no
         * 2、计算交易金额total_fee
         * 3、发送请求到后端，后端向微信申请统一下单申请，后端收到申请应答payModel
         * 4、以payModel作为参数拉起微信支付界面(wx.requestPayment())，输入支付密码，向微信发起支付
         * 5、支付成功后查询支付结果
         */
        _payTap: function () {
            let that = this;

            this.setData({
                'cc_rdata.submitButtonDisabled':true
            });

            let out_trade_no = cf.runtimeConfig.getOutTradeNo(this.data.cc_rdata.reqId);           //开发环境中使用临时生成的交易编号
            let total_fee = (this.data.cc_rdata.cost * 100 * cf.runtimeConfig.payDisct).toFixed(0);  //开发环境中对实际金额降低100倍支付
            console.log('统一下单RP', out_trade_no, total_fee);


            wx.request({
                url: cf.service.wxpayUrl,
                data: {
                    /**
                     * 商户支付的订单号由商户自定义生成，微信支付要求商户订单号保持唯一性（建议根据当前系统时间加随机序列来生成订单号）。
                     * 重新发起一笔支付要使用原订单号，避免重复支付；
                     * 已支付过或已调用关单、撤销（请见后文的API列表）的订单号不能重新发起支付。
                     */
                    out_trade_no: out_trade_no,
                    total_fee: total_fee,
                    openid: app.globalData.userInfo.openId,//付款用户的openId
                    body: that.data.cc_rdata.body,//命名规范参考：https://pay.weixin.qq.com/wiki/doc/api/wxa/wxa_api.php?chapter=4_2
                    product_id: that.data.cc_rdata.product_id,
                },
                header: {
                    'session3rdKey': wx.getStorageSync('session3rdKey'),
                },
                success: function (res) {
                    ut.checkSession(res, app, that, function (option) {
                        let payModel = res.data;
                        console.log('统一下单RD=', payModel, res);

                        if (res.data.status === '100') {
                            wx.requestPayment({
                                'timeStamp': payModel.timestamp,
                                'nonceStr': payModel.nonceStr,
                                'package': payModel.package,
                                'signType': 'MD5',
                                'paySign': payModel.paySign,
                                'success': function (res1) {
                                    console.log('支付成功，结果=', res1);

                                    if (res1.errMsg === 'requestPayment:ok') {
                                        //TODO可以显示倒计时，订单生成中。
                                        wx.request({
                                            url: cf.service.wxpayQueryUrl,
                                            data: {
                                                out_trade_no: out_trade_no,
                                            },
                                            success: function (res3) {
                                                console.log(res3);
                                                ut.showToast('支付成功');

                                                that.setData({
                                                    'cc_rdata.hide':true
                                                });
                                                that.triggerEvent("paySuccessEvent", that.data.cc_rdata);
                                            }
                                        })
                                    }
                                },
                                'fail': function (res2) {
                                    console.log('支付失败，结果:', res2);
                                }
                            })
                        }
                    });
                },
                fail: function (res) {
                    console.log('后端支付服务异常:', res);
                }
            })
        },
    }
});
