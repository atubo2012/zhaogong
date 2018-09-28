// components/cc_user_item.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {
        item: {
            type: Object
        }
    },

    /**
     * 组件的初始数据
     */
    data: {},

    attached() {
        console.log('in tomato_item this is ',this);
    },
    /**
     * 组件的方法列表
     */
    methods: {

        //将当前记录的数据发送到外层节点，供显示使用
        //参考：https://developers.weixin.qq.com/miniprogram/dev/framework/custom-component/events.html
        showDetail:function () {
            this.triggerEvent("showdetailevent", this.data.item, { bubbles: true ,composed:true});
        }
    }
});
