/**
 * Created by changtong on 16/8/15.
 */
;(function($){
    var LightBox = function(settings){
        var self = this;

        this.settings = {
            speed:500
        }

        $.extend(this.settings,settings||{});

        //创建遮罩和弹出层

        this.popupMask = $('<div id="G-lightbox-mask">');
        this.popupWin = $('<div id="G-lightbox-popup">');

        //保存body
        this.bodyNode = $(document.body);

        //渲染剩余的dom并且插入到body
        this.renderDOM();

        this.picViewArea = this.popupWin.find('div.lightbox-pic-view');
        this.popupPic = this.popupWin.find('img.lightbox-img');
        this.picCaptionArea = this.popupWin.find('div.lightbox-pic-caption');
        this.nextBtn = this.popupWin.find('span.lightbox-next-btn');
        this.prevBtn = this.popupWin.find('span.lightbox-prev-btn');
        this.captionText = this.popupWin.find('p.lightbox-pic-desc');
        this.currentIndex = this.popupWin.find('span.lightbox-of-index');
        this.closeBtn = this.popupWin.find('span.lightbox-close-btn');



        this.groupName = null;
        this.groupData = [];
        //委托事件,委托到body上
        this.bodyNode.delegate(".js-lightbox,*[data-role='lightbox']","click",function(e){
            //阻止冒泡
            e.stopPropagation();

            var currentGroupName = $(this).attr('data-group');

            if(currentGroupName != self.groupName){
                self.groupName = currentGroupName;
                //获取一组数据
                self.getGroup();


            }
            self.initPopup($(this));
        });

        this.popupMask.click(function(){
            $(this).fadeOut(self.settings.speed);
            self.popupWin.fadeOut(self.settings.speed);
            self.clear = false;
        });

        this.closeBtn.click(function(){
            self.popupMask.fadeOut(self.settings.speed);
            self.popupWin.fadeOut(self.settings.speed);
            self.clear = false;
        });


        this.flag = true;
        this.nextBtn.hover(function(){
            if(!$(this).hasClass('disabled') && self.groupData.length > 1){
                $(this).addClass('lightbox-next-btn-show');
            }
        },function(){
            if(!$(this).hasClass('disabled') && self.groupData.length > 1){
                $(this).removeClass('lightbox-next-btn-show');
            }
        }).click(function(e){
            e.stopPropagation();
            if(!$(this).hasClass('disabled') && self.flag){
                self.flag = false;
                self.goto("next");
            }

        });

        this.prevBtn.hover(function(){
            if(!$(this).hasClass('disabled') && self.groupData.length > 1){
                $(this).addClass('lightbox-prev-btn-show');
            }
        },function(){
            if(!$(this).hasClass('disabled') && self.groupData.length > 1){
                $(this).removeClass('lightbox-prev-btn-show');
            }
        }).click(function(e){
            e.stopPropagation();
            if(!$(this).hasClass('disabled') && self.flag){
                self.flag = false;
                self.goto("prev");
            }

        });

        //
        var timer = null;
        this.clear = false;
        $(window).resize(function(){
            if(self.clear){
                window.clearTimeout(timer);
                timer = window.setTimeout(function(){
                    self.loadPic(self.groupData[self.index].src);
                },500);
            }


        }).keyup(function(e){
            var keyValue = e.which;

            if(keyValue == 38 || keyValue == 37){
                self.prevBtn.click();
            }else if(keyValue == 40 || keyValue == 39){
                self.nextBtn.click();
            }

        });

    };
    LightBox.prototype = {
        goto:function(dir){
            if(dir === 'next'){

                this.index++;
                if(this.index >= this.groupData.length - 1){
                    this.nextBtn.addClass('disabled').removeClass('lightbox-next-btn-show');
                }

                if(this.index != 0){
                    this.prevBtn.removeClass('disabled');
                }

                var src = this.groupData[this.index].src;
                this.loadPic(src);


            }else if(dir === 'prev'){
                this.index--;
                if(this.index <= 0){
                    this.prevBtn.addClass('disabled').removeClass('lightbox-prev-btn-show');
                }

                if(this.index != this.groupData.length - 1){
                    this.nextBtn.removeClass('disabled');
                }

                var src = this.groupData[this.index].src;
                this.loadPic(src);

            }
        },
        showMaskAndPopup:function(sourceSrc,currentId){
            var self      = this;
            this.popupPic.hide();
            this.picCaptionArea.hide();

            this.popupMask.fadeIn(self.settings.speed);

            var winWidth = $(window).width();
            var winHeight = $(window).height();

            this.picViewArea.css({
                width:winWidth/2,
                height:winHeight/2
            });

            this.popupWin.fadeIn(self.settings.speed);

            var viewHeight = winHeight/2+10;

            this.popupWin.css({
                width:winWidth/2+10,
                height:winHeight/2+10,
                marginLeft:-(winWidth/2+10)/2,
                top:-viewHeight
            }).animate({
                top:(winHeight-viewHeight)/2
            },function(){
                //加载图片
                self.loadPic(sourceSrc);
            });

            //根据当前点击的元素ID，获取当前组别的索引

            this.index = this.getIndexOf(currentId);

            var groupDataLength = this.groupData.length;
            if(groupDataLength > 1){

                if(this.index === 0){
                    this.prevBtn.addClass('disabled');
                    this.nextBtn.removeClass('disabled');
                }else if(this.index === groupDataLength-1){
                    this.prevBtn.removeClass('disabled');
                    this.nextBtn.addClass('disabled')

                }else{
                    this.prevBtn.removeClass('disabled');
                    this.nextBtn.removeClass('disabled')
                }
            }


        },
        loadPic:function(sourceSrc){
            var self = this;
            self.popupPic.css({
                width:'auto',
                height:'auto'
            }).hide();
            self.picCaptionArea.hide();
            this.preLoadImg(sourceSrc,function(){
                self.popupPic.attr('src',sourceSrc);

                var picWidth = self.popupPic.width(),
                    picHeight = self.popupPic.height();

                self.changePic(picWidth,picHeight);

            });
        },
        changePic:function(picWidth,picHeight){
            var self = this,
                winWidth = $(window).width(),
                winHeight = $(window).height();

            //如果图片的宽高大于浏览器的宽高比例，是否益处
            var scale = Math.min(winWidth/(picWidth+10),winHeight/(picHeight+10),1);

            picWidth = picWidth * scale;
            picHeight = picHeight * scale;

            this.picViewArea.animate({
                width:picWidth-10,
                height:picHeight-10
            });

            this.popupWin.animate({
                width:picWidth,
                height:picHeight,
                marginLeft:-(picWidth/2),
                top:(winHeight-picHeight)/2
            },function(){
                self.popupPic.css({
                    width:picWidth-10,
                    heigth:picHeight-10
                }).fadeIn(self.settings.speed);
                self.picCaptionArea.fadeIn(self.settings.speed);
                self.flag = true;
                self.clear = true;
            });


            //设置描述文字和当前索引
            this.captionText.text(this.groupData[this.index].caption) ;
            this.currentIndex.text("当前索引："+(this.index+1)+" of "+this.groupData.length);

        },
        preLoadImg:function(sourceSrc,cb){
            var img = new Image();

            if(!!window.ActiveXObject){
                img.onreadystatechange = function(){
                    if(this.readStae == 'complete'){
                        cb();
                    }
                }
            }else{
                img.onload = function(){
                    cb();
                }
            }

            img.src = sourceSrc;

        },
        getIndexOf:function(currentId){
            var index = 0;
            $(this.groupData).each(function(i){
                index = i;
                if(this.id === currentId){
                    return false;
                }
            });
            return index;
        },
        initPopup:function(currentObj){
            var self      = this,
                sourceSrc = currentObj.attr('data-src'),
                currentId = currentObj.attr('data-id');


            this.showMaskAndPopup(sourceSrc,currentId);

        },
        getGroup:function(){
            var self = this;
            //根据当前的组别名称获取页面中所有相同组别的对像
            var groupList = this.bodyNode.find('*[data-group='+this.groupName+']');
            self.groupData.length = 0;
            groupList.each(function(){
                var item = $(this);
                self.groupData.push({
                    src:item.attr('data-src'),
                    id:item.attr('data-id'),
                    caption:item.attr('data-caption')
                });
            });

        },
        renderDOM:function(){
            var strDom = '<div class="lightbox-pic-view">'+
            '<span class="lightbox-btn lightbox-prev-btn "></span>'+
            '<img class="lightbox-img" src="../resource/image/image9.jpg">'+
            ' <span class="lightbox-btn lightbox-next-btn"></span>'+
            '</div>'+
            ' <div class="lightbox-pic-caption">'+
            '<div class="lightbox-caption-area">'+
            ' <p class="lightbox-pic-desc"></p>'+
            ' <span class="lightbox-of-index">当前索引:0 of 0</span>'+
            '</div>'+
            '<span class="lightbox-close-btn"></span>'+
            '</div>';

            //插入到 this.popupWin
            this.popupWin.empty().html(strDom);

            //把遮罩和弹出框插入body

            this.bodyNode.append(this.popupMask,this.popupWin)




        }
    };
    window['LightBox'] = LightBox;

})(jQuery);