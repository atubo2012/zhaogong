let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        title: String,
        //日期、时间
        cc_rdata:{
            type:Object
        },
    },


    data: {

    },


    methods: {
        //手动设置日期时，通知主调修改日期
        _setDate: function (e) {
            this.setData({
                'cc_rdata.date': e.detail.value
            });
            this.triggerEvent("dateChangeEvent", this.data);
        },
        _setTime: function (e) {
            this.setData({
                'cc_rdata.time': e.detail.value
            });
            this.triggerEvent("timeChangeEvent", this.data);
        },

        // _checkDateAndTime:function (e) {
        //     if()
        // }
    }
});
