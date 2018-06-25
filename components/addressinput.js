let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        title: String,
        address: {
            type: String,
            value: ''
        },
        buttonDesc: {
            type: String,
            value: '地图'
        },
    },


    data: {

    },


    methods: {

        _setAddress: function (e) {
            this.setData({
                address: e.detail.value
            });
        },

        _chooseAddress: function (e) {
            let _that = this;
            if('保存'===this.data.buttonDesc){
                this.triggerEvent("chooseaddressevent", this.data);
                this.setData({
                    buttonDesc:'地图'
                })
            }else{
            wx.chooseLocation({
                success:function (res) {
                    console.log(res);
                    _that.setData({
                        'address':res.address,
                        'name'  :res.name,
                        'latitude':res.latitude,
                        'longitude':res.longitude,
                        'buttonDesc':'保存'
                    })
                },
                fail:function (res) {
                    console.error(res);
                }
            })}
        },
    }
});
