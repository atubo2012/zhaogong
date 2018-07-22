let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        title: String,
        mobile: {
            type: String,
            value: ''
        },
        smsCode: {
            type: String,
            value: ''
        },
        buttonDesc: {
            type: String,
            value: '发送'
        },
        focusMobile:{
            type : Boolean,
            value:false,//焦点移动到手机号输入栏位
        }
    },


    data: {

        mobile: '',   //手机号栏位
        smsCode: '',   //动态口令栏位


        buttonDisabled: false,  //隐藏发送动态密码


        focusSC: false,//焦点移动到动态口令
        hideSC: true,    //隐藏动态口令
        second: cf.runtimeConfig.countDownSecond, //再次发送验证码按钮前需等待的时间

        newMobile: '',//用户输入的新手机号
    },


    methods: {
        _checkMobile: function (e) {
            let _that = this;

            //按钮禁用，防止重复提交
            this.setData({
                buttonDisabled: true
            });

            if (!ut.isPoneAvailable(this.data.newMobile)) { //如格式错误，提示用户修改手机号
                ut.showToast("手机号格式错误！");
                this.setData({
                    focusMobile: true, //光标移动到手机号输入栏位
                    buttonDisabled: false //按钮恢复到可点击状态
                });

            } else {
                //校验通过，则显示动态输入框，并开始倒计时。
                this.setData({
                    focusSC: true,              //光标移动到短信认证码输入栏位
                    smsCode: ut.getSmsCode()    //在前端生成随机码，以便传送到后台发送给手机端
                });

                //通知后端发送短信
                let rdata = {
                    'openId': app.globalData.userInfo.openId,
                    'mobile': this.data.newMobile,
                    'smsCode': this.data.smsCode,
                    'sendSms': cf.runtimeConfig.sendSms
                };
                ut.request(cf.service.mobileSCUrl, rdata, false,
                    (res) => {
                        ut.debug('短信发送应答', res.data);
                        //未被占用
                        if (res.data.code === '0') {
                            ut.showToast(res.data.msg);
                            //开始倒计时
                            _that._countDown(_that);
                        } else if (res.data.code === '1') {
                            ut.showToast(res.data.msg);
                            //按钮恢复
                            this.setData({
                                buttonDisabled: false
                            });
                        }
                    },
                    (res) => {
                        ut.debug('error', res.data)
                    }
                )
            }
        },
        _setMobile: function (e) {
            this.setData({
                newMobile: e.detail.value
            });
            //录入内容不是当前用户的默认手机号，显示发送短信认证码功能。否则隐藏发送短信认证码功能。
            if (e.detail.value !== app.globalData.userInfo.mobile) {
                this.setData({
                    hideSC: false
                })
            } else if (e.detail.value === app.globalData.userInfo.mobile) {
                this.setData({
                    'mobile': e.detail.value,
                    hideSC: true
                })
            }
        },

        _setSmsCode: function (e) {
            let _that = this;
            //录入内容不是当前用户的默认手机号，显示发送短信认证码功能。否则隐藏发送短信认证码功能。
            if (e.detail.value === this.data.smsCode) {
                this.setData({
                    hideSC: true,
                    'mobile': _that.data.newMobile
                });
                ut.showToast('验证码正确');
                this.triggerEvent("checkmobileevent", this.data);


            } else {
                console.log('验证码内容为' + e.detail.value);
            }
        },

        _countDown: function (that) {
            let second = that.data.second;
            if (second === 0) {
                that.setData({
                    second: 10,
                    buttonDesc: '发送',
                    buttonDisabled: false
                });
                return;
            }
            setTimeout(() => {
                    that.setData({
                        second: second - 1,
                        buttonDesc: that.data.second + '秒后可重发'
                    });
                    that._countDown(that);
                }
                , 1000)
        },
    }
});
