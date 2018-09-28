let ut = require('../../utils/utils.js');
const app = getApp();
let cf = app.globalData.cf;


Page({

    data: {
        pageInfo: cf.motto['lbor-edit'],
        hideCfm: false,     //是否隐藏审核状态，只有当前用户为LBOR时才会显示
        second: cf.runtimeConfig.countDownSecond,     //再次发送验证码按钮前需等待的时间

        cf: app.globalData.cf,

        hideCertimg: true,           //默认不显示身份证
        certPicUrl : '../../image/sfz_sample.jpg',


        //界面控制参数用在两个场景：（1）注册信息，（2）修改信息（默认场景）。两个场景是根据后台的mobile字段是否有值来判断。
        focusMobile: false,         //默认是焦点不在mobile栏位
        hideSC: true,               //默认是隐藏短信动态码输入框，注册场景中显示
        focusSC: false,             //默认焦点不在认证码
        submitButtonDisabled: false, //修改场景中默认不禁用，注册场景中禁用

        buttonDesc: '发送验证码',     //按钮上的文案
        buttonDisabled: false,      //提交按钮默认是可以点击的（即默认是修改场景）
        mobile: '',      //手机号暂存区，供checkMobile检查格式是否正确
        smsCode: '',     //短信认证码，前端生成

        address: '',
        location: '',


        role: 'CLNT',    //用户默认的角色，
        rolecfm: false, //角色确认情况，默认为未确认，LBOR角色下，只有true的状态才能接单
        bizList: [      //默认的业务种类
            {name: '临时保洁', value: 'lsbj', checked: true},
            {name: '家电清洗', value: 'jdqx',},
        ],

        items: [
            {name: 'CLNT', value: '找帮手', checked: true},
            {name: 'LBOR', value: '找工作'},
        ],

    },

    /**
     * 选地址列表中某条地址后将选中的内容设置到属性中，并清空列表
     * @param e
     */
    bindKeyInput: function (e) {
        ut.debug('输入内容', e);
        ut.setAddress(e, 'address', 'addressList', this);
    },
    itemtap: function (e) {

        ut.debug('选中地址', e.target);
        let location = {'longitude': e.target.dataset.location.lng, 'latitude': e.target.dataset.location.lat}; //下拉列表中的经纬度构造成对象。
        this.setData({
            'address': e.target.dataset.address,
            'location': JSON.stringify(location),//将对象以字符串的方式
            addressList: []
        })
    },

    /**
     * 选择不同的职业
     * @param e
     */
    checkboxChange: function (e) {
        console.debug(e.detail.value);
        this.setData({
            bizListValues: e.detail.value
        });
    },

    /**
     * 发送短信验证码按钮的倒计时刷新功能
     * @param that
     */
    countDown: function (that) {
        let second = that.data.second;
        if (second === 0) {
            that.setData({
                second: 10,
                buttonDesc: '发送验证码',
                buttonDisabled: false
            });
            return;
        }
        let time = setTimeout(() => {
                that.setData({
                    second: second - 1,
                    buttonDesc: that.data.second + '秒钟后可再次发送'
                });
                that.countDown(that);
            }
            , 1000)
    },
    setMobile: function (e) {
        this.setData({
            mobile: e.detail.value
        })
    }
    ,

    showSC: function (e) {
        let that = this;
        this.setData({
            hideSC: !that.data.hideSC,
        })

    }
    ,
    /**
     * 功能：手机号有效性检查
     *
     * 场景：用户点击“发送认证码”按钮时调用本函数
     *
     * 算法：
     * 1、若格式校验失败，光标移动到mobile栏位，便于用户重新输入
     * 2、若格式校验成功：
     *  (1)向后台查询是否该手机号码是否已被占用(手机号为当前号码，但是openId不是当前本人)。
     *      (1.1)如被占用，则提示已被占用
     *      (1.2)如未被占用，则调用openapi请求生成短信验证码。
     *      (1.2.1)收到验证码生成请求的应答后，按钮进入禁用和倒计时状态。
     *
     * n、用户信息修改提交到后端程序时，先验证动态口令是否有效，如有效，才保存，如无效则应答已过期。
     *
     */
    checkMobile: function () {
        let _that = this;

        //按钮禁用，防止重复提交
        this.setData({
            buttonDisabled: true
        });

        if (!ut.isPoneAvailable(this.data.mobile)) { //如格式错误，提示用户修改手机号
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

            //想后端查询校验手机号是否被占用
            let rdata = {
                'openId': app.globalData.userInfo.openId,
                'mobile': this.data.mobile,
                'smsCode': this.data.smsCode,
                'sendSms': this.data.cf.runtimeConfig.sendSms
            };
            ut.request(cf.service.mobileCheckUrl, rdata,false,
                (res) => {
                    ut.debug('应答数据', res.data);

                    //未被占用
                    if (res.data.code === '0') {
                        ut.showToast(res.data.msg);
                        //开始倒计时
                        _that.countDown(_that);

                        //将校验通过的手机号设置为oldMobile，以便submit可以提交
                        _that.setData({
                            oldMobile: _that.data.mobile,
                        });
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


    /**
     * 上传图片//TODO:将这个函数封装成公用函数
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
                    header: {
                        'session3rdKey': wx.getStorageSync('session3rdKey'),
                    },
                    success: function (res) {
                        ut.debug(res);
                        //后台生成的文件名
                        let fn = res.data;
                        ut.debug('文件路径' + cf.service.uploadUrl + '/' + fn);


                        //上传成功后，将上传的图片显示出来
                        _that.setData({
                            headImage: cf.service.uploadUrl + '/' + fn,
                        })
                    },
                    fail: function (res) {
                        ut.error("上传失败：", res.data)
                    }
                });
            }
        })
    },

    onSubmit: function (e) {
        let that = this;

        //form表单的数据
        let fd = e.detail.value;

        //如输入的smsCode与生成的不同，则提示验证码错误，并将光标移到验证码栏位
        if (fd.smsCode !== this.data.smsCode) {
            ut.showToast('验证码错误');
            this.setData({
                focusSC: true
            });
            return;
        }
        if (!ut.isPoneAvailable(fd.mobile)) {
            ut.showToast('手机号格式错误');
            this.setData({
                focusMobile: true,
                hideSc: false
            });
            return;
        }
        if (this.data.oldMobile !== fd.mobile) {
            ut.showToast('手机已改变，请输入验证码验证');
            this.setData({
                hideSC: false,
                focusSC: true,
            });
            return;
        }
        if (!fd.name || fd.name.trim()==='') { //TODO:代码按配置文件可自动生成
            ut.showTopTips(that,'请填入姓名','nameFocus',cf);
            return;
        }

        if(this.data.role==='LBOR'){

            if (!fd.certNumber) {
                ut.showTopTips(that,'请填写身份证号码','certNumberFocus',cf);
                return;
            }
            if (this.data.certPicUrl.indexOf('sfz_sample.jpg') >= 0) {
                ut.showTopTips(that,'请上传身份证照片','certNumberFocus',cf);
                return;
            }

        }


        let rdata = {
            name: fd.name, mobile: fd.mobile, address: fd.address, location: this.data.location,
            sign: fd.sign,uid:this.data.uid,
            certNumber: fd.certNumber, servDist: fd.servDist, role: this.data.role,
            bizList: this.data.bizListValues,
            rolecfm: false, //只要保存过用户信息，角色审核状态就被重置为false，需要管理员审核
        };

        //将form表单数据与用户名、业务数据整合成将发往后台的数据
        Object.assign(rdata,
            {'openId': app.globalData.userInfo.openId},
            {'headImage': this.data.headImage},
            {'certPicUrl': this.data.certPicUrl}
        );
        ut.debug('this.data:', this.data, 'formData:', e.detail.value, 'rdata', rdata);


        /**
         * ut.request自带3rdsessionKey参数
         */
        ut.request(cf.service.userEditUrl, rdata,false,
            (res) => {
                ut.showToast('保存成功');
                ut.debug('success', res);
                this.setData({
                    submitButtonDisabled: true
                });
                app.checkUser((res1) => {
                        ut.debug('after update userInfo ', res1);
                        app.globalData.userInfo = res1.data;
                    }
                );
                ut.switchTab('../me/me');
            },
            (res) => {
                ut.debug('error', res)
            }
        )
    },

    ulCertPic: function () {
        let that = this;
        ut.uploadFile(cf.service.uploadUrl, (fn, backEndFilePath, res) => {
            that.setData({
                hideCertimg: false,
                certPicUrl: backEndFilePath,
            });
        });
    },

    /**
     * 页面加载时，查询用户信息
     */
    onLoad: function (param) {

        let _that = this;

        let userInfo ={};
        if(param.openId && param.type==='ta'){
            userInfo.openId=param.openId;
        }else{
            userInfo = app.globalData.userInfo;
        }


        //加载当前用户的空闲信息 TODO:用ut.request替换wx.request
        wx.request({
            url: cf.service.userCheckUrl,
            data: {
                userInfo: userInfo
            },
            header: {'session3rdKey': wx.getStorageSync('session3rdKey')},
            success: function (res) {

                ut.checkSession(res, app, _that, function (option1) {
                    ut.debug('后台userInfo有数据，设置data中的userInfo', res.data);

                    //如果角色为''说明尚未注册，默认角色是CLNT，否则使用用户的状态
                    let role = (res.data.role === '') ? 'CLNT' : res.data.role;

                    _that.setData({
                        userInfo: res.data,     //设置用户数据
                        address: res.data.address ? res.data.address : '',
                        location: res.data.location ? res.data.location : '',
                        mobile: res.data.mobile,//原始手机号
                        oldMobile: res.data.mobile,//原始手机号，用来在提交前比较是否手机号发生了变化，如发生了变化则要求发送短信认证
                        headImage:res.data.headImage,
                        role: role,             //用户原来的角色
                        rolecfm: res.data.rolecfm ? res.data.rolecfm : false,

                        items: ut.getRa(role, _that.data.items),//原来的角色渲染
                        hideSubmitButton: param.type==='ta',//若查看其它的用户信息则隐藏保存按钮
                        hideSC: '' !== res.data.mobile,//如手机号为空，表明当前场景为“注册场景”，应显示验证码输入框，提交时应校验mobile是否有值
                        hideCfm: role==='CLNT',   //若是CLNT角色则隐藏审核状态
                        uid:res.data.uid?res.data.uid:'',//后端生成的uid，无无此值，则默认为''
                        ouid:res.data.ouid?res.data.ouid:'',
                        qrcode:res.data.qrcode?res.data.qrcode:'',

                        qrcodeurl:cf.runtimeConfig.url+'/upload/'+res.data.qrcode

                        //showLborInfo: true,
                    });



                    //如果type==='LBOR'，表明是从上单补录入口来的，显示LBOR有关的信息，加载默认的信息
                    if ('LBOR' === param.type || app.globalData.userInfo.role === 'LBOR') {
                        _that.setData({
                            certNumber: res.data.certNumber ? res.data.certNumber : '',
                            certPicUrl: res.data.certPicUrl ? res.data.certPicUrl : '../../image/sfz_sample.jpg',
                            bizList: res.data.bizList ? ut.renderCheckbox(_that.data.bizList, res.data.bizList) : _that.data.bizList,//库中没有，则使用本页的默认数据渲染
                            servDist: res.data.servDist ? res.data.servDist : '',
                            role: 'LBOR',
                            showLborInfo: true,
                            hideCfm:false,   //显示审核状态//TODO:催单功能
                            hideCertimg: false  //显示头像
                        });
                    }
                })
            }
        });
    },


    /**
     * 当角色被设置为LBOR时，状态变为未审核。
     * @param e
     */
    roleChange: function (e) {
        this.setData({
            'role': e.detail.value,
            'showLborInfo': e.detail.value === 'LBOR',
            'rolecfm': !(e.detail.value === 'LBOR') ,//如果设置为LBOR，就为false，等待审批
            'hideCfm': !(e.detail.value === 'LBOR') //如果用户选择角色是CLNT则不显示审核状态
        });

    },

});