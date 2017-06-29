var Game = function(gameName, canvasId){
    var canvas = document.getElementById(canvasId),
        self = this;

    this.context = canvas.getContext('2d');
    this.sprites = [];

    this.startTime = 0;
    this.lastTime = 0;
    this.gameTime = 0;
    this.fps = 0;
    this.STARTING_FPS = 60;

    this.paused = false;
    this.startedPauseAt = 0;
    this.PAUSE_TIMEOUT = 100;

    return this;
};

Game.prototype = {
    start: function(){//设置游戏启动时间，并请求浏览器绘制下一帧动画，以此开始游戏
        var self = this;
        this.startTime = getTimeNow();

        window.requestAnimationFrame(function(time){
            self.animate.call(self, time);
        });
    },
    animate: function(time){//实现游戏循环
        var self = this;
        if(this.paused){
            setTimeout(function(){
                self.animate.call(self, time);
            }, this.PAUSE_TIMEOUT);
        }else{
            this.tick(time);
            this.clearScreen();

            this.startAnimate(time);

            this.paintUndersprites();

            this.updateSprites(time);
            this.paintSprites(time);

            this.paintOverSprite();

            this.endAnimate();

            window.requestAnimationFrame(function(time){
                self.animate.call(self, time);
            });
        }
    },
    tick: function(time){//在播放每帧动画前更新帧速率及游戏时间
        this.updateFrameRate(time);
        this.gameTime = (getTimeNow()) - this.startTime;
        this.lastTime = time;
    },
    updateFrameRate: function(time){//更新游戏当前的帧速率
        if(this.lastTime === 0) this.fps = this.STARTING_FPS;
        else this.fps = 1000 / (time - this.lastTime);
    },
    clearScreen: function(){//清楚屏幕
        this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
    },
    updateSprites: function(time){//更新所有精灵对象
        for(var i = 0; i < this.sprites.length; ++i){
            var sprite = this.sprites[i];
            sprite.update(this.context, time);
        }
    },
    paintSprites: function(time){//绘制所有可见的精灵
        for(var i = 0; i < this.sprites.length; ++i){
            var sprite = this.sprites[i];
            if(sprite.visible){
                sprite.paint(this.context);
            }
        }
    },
    startAnimate: function(time){ },//游戏引擎在播放每帧动画前都会调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
    paintUnderSprites: function(){ },//游戏引擎在绘制精灵前会调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
    paintOverSprite: function(){ },//游戏引擎绘制完精灵后会调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
    endAnimate: function(){ }//游戏引擎绘制完当前动画帧之后，调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
};