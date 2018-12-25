
let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;


Component({

    properties: {
        showPost:Boolean,
        //营销菊花码需要输入的属性
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

        backGroundImagUrl:{
            type: String
        },

        postTitle:{
            type: String
        }
    },
    /**
     * 页面的初始数据
     */
    data: {


        img_template:"/image/post_head.png",//海报模板（顶部）

        img_wechat:"/image/share2wechat.png",//图标：分享到微信群
        img_quan:"/image/share2friendc.png",//图标：分享到朋友圈


        code:"E7AI98",
        inputValue:"",
        maskHidden: false,
        name:"",
        touxiang:"",
    },

    methods: {

        //点击生成的图片之后，隐藏图片
        hiddePost:function () {
          this.setData({
              showPost:!this.data.showPost
          })  ;
        },
        //获取输入框的值
        bindKeyInput: function (e) {
            this.setData({
                inputValue: e.detail.value
            })
        },
        //点击提交按钮
        btnclick: function () {
            let text = this.data.inputValue
            wx.showToast({
                title: text,
                icon: 'none',
                duration: 2000
            })
        },
        /**
         * 海报生成参考案例：https://www.cnblogs.com/zzgyq/p/8882995.html
         */
        onLoad: function (options) {
            let that = this;
            wx.getUserInfo({
                success: res => {
                    this.setData({
                        name: res.userInfo.nickName,
                    });
                    wx.downloadFile({
                        url: res.userInfo.avatarUrl, //仅为示例，并非真实的资源
                        success: function (res) {
                            // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                            if (res.statusCode === 200) {
                                console.log(res, "头像文件路径",res.tempFilePath);
                                that.setData({
                                    touxiang: res.tempFilePath
                                })
                            }
                        }
                    });

                    //下载海报模板图片到本地，为了兼容ZgConfig中的静态配置的商品信息的url做特殊处理：若不包含http，则需要加上路径
                    //let url = cf.charging_type[that.data.biz_type].pics ?cf.charging_type[that.data.biz_type].pics[0] : that.data.backGroundImagUrl;
                    let url = that.data.backGroundImagUrl;//海报背景页面从cc调用的页面中指定
                    if(url.indexOf('http')<0) url=cf.url+"/upload/"+url;

                    console.log(url);
                    wx.downloadFile({
                        //TODO:海报照片应根据商品类别代码生成，商品类别代码是创建商品类别时生成的32进制4位。
                        //url: cf.url+"/upload/"+cf.charging_type[that.data.biz_type].pics[0],
                        url: url,
                        success: (res)=>{
                            that.setData({
                                localPostFile : res.tempFilePath
                            });
                            console.log('localPostFile1:',that.data.localPostFile);
                        },
                        fail: (res)=>{

                            console.error('localPostFile2:',res);
                        }
                    });
                }
            })

        },

        setShow:function (e) {
            console.log(e);
            this.setData({
                showPost:true
            });
            this.formSubmit(e)
        },

        /**
         * 获取MPC，此处的算法与cc_dop组件中的算法一致
         * @param e
         * @private
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


                        //下载二维码到本地
                        wx.downloadFile({
                            url: url,
                            success: (res)=>{
                                that.setData({localQrcodeFile : res.tempFilePath});
                                console.log('localQrcodeFile:',that.data.localQrcodeFile);
                                // wx.previewImage({
                                //     urls: [that.data.localQrcodeFile]
                                // });
                                that.createNewImg();
                            }
                        });

                        //生成菊花码后，生成图片


                        // wx.previewImage({
                        //     urls: [url]
                        // });
                    });
                },fail: function (res) {
                    console.log('生成二失败 ：',res);
                    ut.showToast('系统忙，请稍后再试');
                },
                complete: function (res) {
                    ut.info("生成二维码 完成");
                }
            });
        },

        /**
         * 向画布中写入文字
         * @param context
         * @param fontSize
         * @param bgColor
         * @param align
         * @param text
         * @param x
         * @param y
         */
        drawText:function(context,fontSize,bgColor,align,text,x,y){
            context.setFontSize(fontSize);
            context.setFillStyle(bgColor);
            context.setTextAlign(align);
            context.fillText(text, x, y);
            context.stroke();
        },

        /**
         * 写一段文字
         * @param context
         * @param fontSize
         * @param postTitleArr
         * @param x
         * @param Y4firstLine
         */
        drawText2:function (context,fontSize,postTitleArr,x,Y4firstLine) {

            for(i=0;i<postTitleArr.length;i++){
                this.drawText(context,fontSize,'#333','left',postTitleArr[i],x,Y4firstLine+(i+1)*20)
            }
        },
        splitStr2Arr : function(str,len){
            let ret = [];
            let yu = str.length%len;
            let mod = Math.floor(str.length/len);

            console.log('yu',yu,'mod',mod);

            for(let i=0;i<mod;i++){

                let from = i*len;
                let to = i*len+len;
                console.log('from',from,'to',to);
                let currentItem = str.substring(from, to);
                ret.push(currentItem)
            }

            if(yu>0)
                ret.push(str.substring(len*mod,str.length));

            return ret;
        },

        //将canvas转换为图片保存到本地，然后将图片路径传给image图片的src
        createNewImg: function () {
            let that = this;
            let context = wx.createCanvasContext('mycanvas',this);

            //设置填充颜色和形状
            context.setFillStyle("#cccccc");
            context.fillRect(0, 0, 375, 667);//TODO：面积用系统获取到的屏幕尺寸参数设置

            //绘制海报的背景图片
            console.log('海报背景图片路径1',that.data.localPostFile);
            context.drawImage(that.data.localPostFile, 0, 0, 375, 482);//图片高度：185


            //绘制左下角文字内容，每行间隔20单位，每行显示18个字符

            this.drawText2(context,13,this.splitStr2Arr(that.data.postTitle||'',18),20,540);

            let rt = cf.runMode;
            //this.drawText(context,13,'#333','left',that.data.userInfo.nickName, 20, 620);
            this.drawText(context,13,'#000000','center',that.data.userInfo.nickName+'推荐'+rt, 310, 570+70);//310是菊花码的圆心x坐标，


            //绘制营销二维码背景的圆圈。
            let circle_x = 310; //圆心x坐标
            let circle_y = 570; //圆心y坐标
            let circle_r = 50;  //圆半径
            let image_start_x = circle_x-circle_r;//配图的起画点x坐标
            let image_start_y = circle_y-circle_r;//配图的起画点y坐标
            let image_width = circle_r*2;         //配图宽度
            let image_height = circle_r*2;        //配图高度

            //绘制头像,对头像绘制成圆形
            context.arc(    //（https://developers.weixin.qq.com/miniprogram/dev/api/canvas/CanvasContext.arc.html）
                circle_x,   //圆心X坐标
                circle_y,   //圆心Y坐标
                circle_r,   //圆半径
                0,          //起始弧度在三点钟方向，顺时针旋转。
                2 * Math.PI //终止弧度
            );
            //context.strokeStyle = "#ffe200";    //设置边框颜色
            context.clip();     //裁剪上面的圆形，https://developers.weixin.qq.com/miniprogram/dev/api/canvas/CanvasContext.clip.html
            context.drawImage(that.data.localQrcodeFile, image_start_x, image_start_y, image_width, image_height); //在刚刚裁剪的园上画图


            //将之前在绘图上下文中的描述（路径、变形、样式）画到 canvas 中
            context.draw();


            //将生成好的图片保存到本地，需要延迟一会，绘制期间耗时
            setTimeout(function () {
                wx.canvasToTempFilePath({
                    canvasId: 'mycanvas',
                    success: function (res) {
                        let tempFilePath = res.tempFilePath;
                        that.setData({
                            imagePath: tempFilePath,
                            canvasHidden: true
                        });
                        console.log('生成的海报文件',tempFilePath);
                        ut.hideLoading();
                    },
                    fail: function (res) {
                        console.error('error',res);
                    }
                },that);
            }, 1000);
        },




        //点击保存到相册
        baocun: function () {
            let that = this;
            wx.saveImageToPhotosAlbum({
                filePath: that.data.imagePath,
                success(res) {
                    wx.showModal({
                        content: '图片已保存到相册，赶紧晒一下吧~',
                        showCancel: false,
                        confirmText: '好的',
                        confirmColor: '#333',
                        success: function (res) {
                            if (res.confirm) {
                                console.log('用户点击确定');
                                /* 该隐藏的隐藏 */
                                that.setData({
                                    maskHidden: false
                                })
                            }
                        }, fail: function (res) {
                            console.log(11111)
                        }
                    })
                }
            })
        },
        //点击生成海报
        formSubmit: function (e) {
            let that = this;

            //显示蒙层
            this.setData({
                maskHidden: false
            });
            ut.showLoading('正在生成海报...');

            setTimeout(function () {
                //生成图片
                that._getMyQr();

                //隐藏蒙层
                that.setData({
                    maskHidden: true
                });
            }, 1000)
        },


        /**
         * 生命周期函数--监听页面显示
         */
        onShow: function () {
            let that = this;
            wx.getUserInfo({
                success: res => {
                    console.log(res.userInfo, "huoqudao le ")
                    this.setData({
                        name: res.userInfo.nickName,
                    });
                    wx.downloadFile({
                        url: res.userInfo.avatarUrl, //仅为示例，并非真实的资源
                        success: function (res) {
                            // 只要服务器有响应数据，就会把响应内容写入文件并进入 success 回调，业务需要自行判断是否下载到了想要的内容
                            if (res.statusCode === 200) {
                                console.log(res, "reererererer")
                                that.setData({
                                    touxiang: res.tempFilePath
                                })
                            }
                        }
                    })
                }
            })
        },



        /**
         * 用户点击右上角分享
         */
        onShareAppMessage: function (res) {
            return {
                title: "这个是我分享出来的东西",
                success: function (res) {
                    console.log(res, "转发成功")
                },
                fail: function (res) {
                    console.log(res, "转发失败")
                }
            }
        }
    }
})