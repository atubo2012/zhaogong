let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({

    properties: {
        cart: {
            type: Object,
            value: {
                goods: [
                    // {charging: 'accleaning', type: '壁挂', price: 80, quantity: 3, subtotal: 240},
                ],
                total_cost: 0,//更新goods购物车时更新
            }
        },
    },

    data: {
        //ct: cf.charging_type,
        cf: cf,
    },

    methods: {

        /**
         * 功能：初始化费用类型选择器
         * 场景：onload()的修改模式中调用，根据数据库中的bizcatalog表中的biz_id初始化费用选择器
         * @private
         */
        _initBizCart: function (biz_id,cb) {
            let that = this;
            //console.log('this is in _initBizcart', biz_id);//组件中初始化设置的业务类型

            ut.request(cf.service.bizQueryUrl,
                {cond: {'id': biz_id}},
                false,
                (res) => {
                    //ut.debug('_initBizCart(): ', res.data);

                    that.setData({
                        biz_name: res.data.biz_name,
                        sub_types: res.data.sub_types,
                        pics: res.data.pics_list,
                        currentSubType: res.data.sub_types[0],
                        biz_type:res.data,
                    });

                    //ut.debug('_initBizCart()2: ',that.data);

                    cb?cb():'';
                }, (res) => {
                    ut.showToast(res.data);
                });

        },
        getBizType:function () {
            //console.log(this.data);
            return this.data;
        },

        _bindChargingTypeChange: function (e) {
            let currentSubType = this.data.sub_types[Number(e.detail.value)];
            //console.log(e, currentSubType);
            this.setData({
                currentSubType: currentSubType,
            });
        },

        //向CART中增加一个类别
        _add2Cart: function (e) {
            let that = this;
            console.log( '_add2Cart()', this.data.currentChargingType );
            let newCart = {quantity: 1};

            //若cart为null，则初始化cart数据
            if (!this.data.cart) {
                this.data['cart'] = {};
                this.data.cart['goods'] = [];
            }

            //同一个子类的业务类别应只能有一条记录，如重复添加则提示
            for (let i = 0; i < this.data.cart.goods.length; i++) {
                if (this.data.cart.goods[i].type === this.data.currentSubType.type) {
                    ut.alert(this.data.currentSubType.type + '已添加，无需重新添加', 'none');
                    return;
                }
            }


            //当前添加的子业务类别未曾添加过，则加入到goods数组中
            this.data.cart.goods.push(Object.assign(
                newCart,
                //{charging: this.data.currentChargingType},
                this.data.currentSubType,
                {subtotal: this.data.currentSubType.price}
                )
            );
            console.log( '_add2Cart()2',newCart, this.data.cart.goods);

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
            this.data.cart.goods[index].subtotal = this.data.cart.goods[index].quantity * this.data.cart.goods[index].price;

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
                    this.data.cart.goods[index].subtotal = this.data.cart.goods[index].quantity * this.data.cart.goods[index].price;
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
