let ut = require('../utils/utils.js');
let app = getApp();
let cf = app.globalData.cf;

Component({
    /**
     * 组件的属性列表
     */
    properties: {
        picsList:{
            type:Object,
            value:[]
        },
        onlyShow:{
            type:Boolean,
            value:false
        },
        hidden:{
            type:Boolean,
            value:false
        }
    },


    data: {
        x:100,
        y:200,
        width:app.globalData.sysInfo.screenWidth,
        height:app.globalData.sysInfo.screenWidth*3/4,
    },

    attached:function(){

        
    },

    methods: {

        _chooseImage: function (e) {
            let that = this;

            ut.uploadFile(cf.service.uploadUrl, (fn, backEndFilePath, res) => {
                that.setData({
                    picsList: that.data.picsList.concat(backEndFilePath)
                });
                this.triggerEvent("uploadchangeevent", this.data);
            });
        },
        _previewImage: function(e){
            wx.previewImage({
                current: e.currentTarget.id, // 当前显示图片的http链接
                urls: this.data.picsList // 需要预览的图片http链接列表
            })
        },
        _delImage:function (e) {
            let that = this;
            console.log(e);
            ut.request(cf.service.uploadRmUrl,{'rmfile':that.data.picsList[e.target.id]},true,
                (res)=>{
                    that.data.picsList.splice(e.target.id,1);
                    that.setData({
                        picsList:that.data.picsList
                    });
                    console.log('删除文件成功应答'+res);
                    this.triggerEvent("uploadchangeevent", this.data);
                },
                (res)=>{
                    console.log('删除文件失败应答'+res);
                }
            );


        },

        _toggleHidden(){
            let that = this;
          this.setData({
              hidden: !that.data.hidden
          })
        },
        _tabCanvas:function (e) {
            let that = this;
            const ctx = wx.createCanvasContext('myCanvas',this)

            console.log(ctx)

            ctx.setFillStyle('Aqua');//设置填充颜色
            ctx.setShadow(10, 10, 100, 'blue');//阴影的x,y,透明度，颜色
            ctx.fillRect(10, 10, 150, 75);

            that.data.x = that.data.x+15
            that.data.y = that.data.y+15

            ctx.draw(true,()=> {

                //切图保存为临时文件
                wx.canvasToTempFilePath({
                    x: that.data.x,
                    y: that.data.y,
                    // width: 50,
                    // height: 50,
                    // destWidth: 100,
                    // destHeight: 100,
                    canvasId: 'myCanvas',
                    success: function (res) {
                        console.log(res, res.tempFilePath);
                        wx.previewImage({
                            current: '', // 当前显示图片的http链接

                            urls: [res.tempFilePath], // 需要预览的图片http链接列表
                            success: function (resa) {
                                console.log('resa',resa);
                                wx.saveImageToPhotosAlbum({
                                    filePath: res.tempFilePath,
                                    success(resb) {
                                       console.log('resb',resb);
                                    }
                                })
                            }
                        })
                    }
                }, that);
            });

            //画一个像素点
            const data = new Uint8ClampedArray([255, 0, 0, 1]);
            wx.canvasPutImageData({
                canvasId: 'myCanvas',
                x: 400,
                y: 400,
                width: 1,
                data: data,
                success(res) {}
            },this);


            //空心矩阵
            ctx.setStrokeStyle('red')
            ctx.strokeRect(50, 50, 150, 75)
            ctx.draw(true)


            //移动到某个点、划线、头尾相连、填充
            // ctx.moveTo(10, 10)
            // ctx.lineTo(100, 10)
            // ctx.lineTo(100, 100)
            // ctx.fill()
            // ctx.draw(true)

            //画一个空心矩阵，扩大该空心矩阵。
            // ctx.strokeRect(10, 10, 25, 15)
            // ctx.scale(2, 2)
            // ctx.strokeRect(10, 10, 25, 15)
            // ctx.scale(2, 2)
            // ctx.strokeRect(10, 10, 25, 15)
            // ctx.draw(true)

            //选择图片->画图片->显示输入框->输入文字->边输入边刷新->输入完成后保存->保存后上传
            wx.chooseImage({
                success: function (res) {
                    //参数：文件名，画布上的x、y、源图片的取像点x、y
                    ctx.drawImage(res.tempFilePaths[0], 0, 0, 150, 100)
                    console.log(res.tempFilePaths[0]);
                    ctx.setTextAlign('left');
                    ctx.setFontSize(20);
                    ctx.font = 'italic bold 20px cursive';
                    const content = '你好啊啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦啦';
                    const metrics = ctx.measureText(content);
                    console.log('宽度：',metrics.width);
                    ctx.fillText(content, 100, 80);
                    ctx.draw()
                }
            });

            const pattern = ctx.createPattern('/image/vcode.jpg', 'repeat-x')
            ctx.fillStyle = pattern
            ctx.fillRect(0, 0, 300, 150)
            ctx.draw(true)

            // ctx.setLineDash([10, 20], 5);
            // ctx.beginPath();
            // ctx.moveTo(0,100);
            // ctx.lineTo(400, 100);
            // ctx.stroke();
            // ctx.draw()
        }

    }
});


