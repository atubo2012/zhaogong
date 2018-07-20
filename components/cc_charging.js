let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        /**
         * cc_rdata是业务数据交换容器，
         * 工时数  ：dura
         * 工时费  ：uprice
         * 计件单价 ：piece_price
         * 计件量  ：piece_amount
         */
        cc_rdata: {
            type: Object
        },

        //单价列表
        upriceList: {
            type: Object,
            value: [35, 40, 45, 50]
        },

        //备选工时列表
        durationList: {
            type: Object,
            value: [2, 4, '不限']
        },

        cart: {
            type: Object,
            value: {
                goods: [
                    {charging: 'accleaning', type: '壁挂', uprice: 80, quantity: 3, subtotal: 240},
                    {charging: 'oilsmoke_cleaning', type: '大型', uprice: 80, quantity: 1, subtotal: 80},
                ],
                total_cost: 0,//更新goods购物车时更新
                //date: 'yyyyMMdd'//更新goods时更新
            }
        },

        charging_type: {
            type: String
        },

    },

    data: {
        //备选费用种类列表
        chargingTypeKeyList: Object.keys(cf.charging_type).map((item, index, arr) => {
            return {desc: cf.hint[item], type: item}
        }),//charging_type大类列表


        chargingTypeList: cf.charging_type.accleaning,
        currentChargingType: Object.keys(cf.charging_type)[0],
        currentChargingTypeDesc: cf.hint[Object.keys(cf.charging_type)[0]],//默认显示的charging_type大类描述
        currentChargingItem: cf.charging_type.accleaning[0],


        ct: cf.charging_type,
        cf: cf,


    },


    methods: {

        _bindPickerChangeUprice: function (e) {
            let that = this;

            this.setData({
                'cc_rdata.uprice': Number(that.data.upriceList[e.detail.value]),
            });
            this.triggerEvent("upriceChangeEvent", Number(that.data.upriceList[e.detail.value]));
        },
        _bindPickerChangeDuration: function (e) {
            ut.debug(e);
            let that = this;
            this.setData({
                'cc_rdata.dura': Number(that.data.durationList[e.detail.value]),
            });
            this.triggerEvent("duraChangeEvent", Number(that.data.durationList[e.detail.value]));
        },


        _initCharging: function (charging_type) {
            let that = this;
            console.log('this is in _initCharging', this.data.charging_type);

            // this.setData({
            //     chargingTypeKeyList: Object.keys(cf.charging_type).map((item, index, arr) => {
            //         console.log(item + '-', charging_type + 'aa');
            //         if (charging_type === item) {
            //             return {desc: cf.hint[item], type: item}
            //         }
            //     }),
            // });



            // Object.keys(cf.charging_type).map((item, index, arr) => {
            //     console.log(item + '-', charging_type + 'aa');
            //     if (charging_type === item) {
            //         that.setData({
            //             currentChargingType: item.type,
            //             currentChargingTypeDesc: cf.hint[item.type],
            //
            //             chargingTypeList: cf.charging_type[item.type],
            //             currentChargingItem: cf.charging_type[item.type][0],
            //         });
            //
            //     }
            // });



                    that.setData({
                        currentChargingType: charging_type,
                        currentChargingTypeDesc: cf.hint[charging_type],

                        chargingTypeList: cf.charging_type[charging_type],
                        currentChargingItem: cf.charging_type[charging_type][0],
                    });




            console.log('this is in _initCharging2', this.data.chargingTypeKeyList);

        },

        //大类选择后，初始化子类的列表
        _bindChargingTypeKeyChange: function (e) {

            //当前选中的大类
            let currentChargingType = this.data.chargingTypeKeyList[Number(e.detail.value)];
            console.log(e, currentChargingType);

            //渲染当前选中的大类和默认选中的小类
            this.setData({
                currentChargingType: currentChargingType.type,
                currentChargingTypeDesc: cf.hint[currentChargingType.type],

                chargingTypeList: cf.charging_type[currentChargingType.type],
                currentChargingItem: cf.charging_type[currentChargingType.type][0],

            });

        },

        _bindChargingTypeChange: function (e) {
            let currentChargingItem = this.data.chargingTypeList[Number(e.detail.value)];
            console.log(e, currentChargingItem);
            this.setData({
                currentChargingItem: currentChargingItem,
            });
        },

        //向CART中增加一个类别
        _add2Cart: function (e) {
            let that = this;
            console.log('e',e, 'item',this.data.currentChargingItem, 'ct',this.data.currentChargingType, 'data',this.data);
            let newCart = {quantity: 1};

            //若cart为null，则初始化cart数据
            if (!this.data.cart) {
                this.data['cart'] = {};
                this.data.cart['goods'] = [];
            }

            //同一个子类的业务类别应只能有一条记录，如重复添加则提示
            for(let i = 0;i<this.data.cart.goods.length;i++)
            {
                if(this.data.cart.goods[i].type === this.data.currentChargingItem.type){
                    ut.alert(this.data.currentChargingItem.type+'已添加，无需重新添加','none');
                    return;
                }
            }


            //当前添加的子业务类别未曾添加过，则加入到goods数组中
            this.data.cart.goods.push(Object.assign(
                newCart,
                {charging: this.data.currentChargingType},
                this.data.currentChargingItem,
                {subtotal: this.data.currentChargingItem.uprice}
                )
            );
            console.log(newCart, this.data.cart.goods);

            this.setData({
                'cart.goods': that.data.cart.goods
            });
            this.getCost();
        },

        //从购物车中删除一个收费类别
        _delFromCart: function (e) {
            let that = this;
            console.log(e);
            let index = e.currentTarget.id;
            this.data.cart.goods.splice(index, 1);
            this.setData({
                'cart.goods': that.data.cart.goods
            })
        },


        //向购物车中添加一个条目
        _addOne: function (e) {
            let that = this;
            let index = e.currentTarget.id;

            this.data.cart.goods[index].quantity++;
            this.data.cart.goods[index].subtotal = this.data.cart.goods[index].quantity * this.data.cart.goods[index].uprice;

            this.setData({
                'cart.goods': that.data.cart.goods
            });
            this.getCost();
        },

        //从购物车中删除一个条目
        _delOne: function (e) {
            let that = this;
            let index = e.currentTarget.id;

            if (this.data.cart.goods[index].quantity > 0) {
                this.data.cart.goods[index].quantity--;

                //若数量减为0，则自动从cart中删除
                if (this.data.cart.goods[index].quantity === 0) {
                    this.data.cart.goods.splice(index, 1);
                    this.setData({
                        'cart.goods': that.data.cart.goods
                    })
                } else { //若数量大于0，则刷新cart
                    this.data.cart.goods[index].subtotal = this.data.cart.goods[index].quantity * this.data.cart.goods[index].uprice;
                    this.setData({
                        'cart.goods': that.data.cart.goods
                    });
                }

                //刷新购物车的合计金额
                this.getCost();
            }
        },

        //刷新cart中的需支付金额
        getCost: function () {
            let that = this;
            let cost = 0;
            this.data.cart.goods.map((item, index, arr) => {
                cost = cost + Number(item.subtotal);
            });

            console.log('cost', cost);
            this.setData({
                'cart.total_cost': cost,
                'cart.date': new Date()
            });

            //每次购物车修改完后，都要将购物车数据通知主调页面，刷新购物车数据
            this.triggerEvent("cartChangeEvent", {cart: that.data.cart});
        },


    }
});
