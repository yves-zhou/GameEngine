var getTimeNow = function(){
    return +new Date();
};

var Game = function(gameName, canvasId){
    var canvas = document.getElementById(canvasId),
        self = this;
    // General
    this.context = canvas.getContext('2d');
    this.gameName = gameName;
    this.sprites = [];
    this.keyListeners = [];
    //Time
    this.startTime = 0;
    this.lastTime = 0;
    this.gameTime = 0;
    this.fps = 0;
    this.STARTING_FPS = 60;

    this.paused = false;
    this.startedPauseAt = 0;
    this.PAUSE_TIMEOUT = 100;
    //加载图片相关属性
    this.imageLoaddingProgressCallback;
    this.images = {};
    this.imageUrls = [];
    this.imagesLoaded = 0;
    this.imagesFailedToLoad = 0;
    this.imagesIndex = 0;
    //播放声音相关属性
    this.soundOn = true;
    this.soundChannels = [];
    this.audio = new Audio();
    this.NUM_SOUND_CHANNELS = 10;

    for(var i = 0; i < this.NUM_SOUND_CHANNELS; ++i){
        var audio = new Audio();
        this.soundChannels.push(audio);
    }

    //高分
    this.HIGH_SCORES_SUFFIX = '_highscores';

    //监听window默认的键盘按键事件，并用self.keyPressed()代替
    window.onkeypress = function(e){ self.keyPressed(e); };
    window.onkeydown = function(e){ self.keyPressed(e); };

    return this;
};

Game.prototype = {
    pixelsPerFrame: function(time, velocity){//基于时间的运动
        return velocity / this.fps;
    },
    getImage: function(imageUrl){//返回图像对象
        return this.images[imageUrl];
    },
    imageLoadedCallback: function(e){//图像下载成功回调
        this.imagesLoaded++;
    },
    imageLoadErrorCallback: function(e){//图像下载失败回调
        this.imagesFailedToLoad++;
    },
    loadImage: function(imageUrl){//图像下载
        var image = new Image(),
            self = this;

        image.src = imageUrl;
        image.addEventListener('load', function(e){
            self.imageLoadedCallback(e);
        });
        image.addEventListener('error', function(e){
            self.imageLoadErrorCallback(e);
        });

        this.images[imageUrl] = image;
    },
    loadImages: function(){//开发者需要持续调用该方法，直到其返回100为止（方法的返回值表示图像加载完成百分比）
        if(this.imagesIndex < this.imageUrls.length){
            this.loadImage(this.imageUrls[this.imagesIndex]);
            this.imagesIndex++;
        }
        return (this.iamgesLoaded + this.imagesFailedToLoad) / this.iamgeUrls.length * 100;
    },
    queueImage: function(imageUrl){//将图像放入加载队列中
        this.imageUrls.push(imageUrl);
    },
    canPlayOggVorbis: function(){
        return "" != this.audio.canPlayType('audio/ogg; codecs="vorbis"');
    },
    canPlayMp3: function(){
        return "" != this.andio.canPlayType('audio/mpeg');
    },
    getAvailableSoundChannel: function(){
        var audio;

        for(var i = 0; i < this.NUM_SOUND_CHANNELS; ++i){
            audio = this.soundChannels[i];
            if(audio.played && audio.played.length > 0){
                if(audio.ended) return audio;
            }else{
                if(!audio.ended) return audio;
            }
        }
        return undefined;
    },
    playSound: function(id){
        var channel = this.getAvailableSoundChannel(),
            element = document.getElementById(id);

        if(channel && element){
            channel.src = element.src === '' ? element.currentSrc : element.src;
            channel.load();
            channel.play();
        }
    },
    addKeyListener: function(keyAndListener){
        this.keyListeners.push(keyAndListener);
    },
    findKeyListener: function(key){
        var listener = undefined;

        this.keyListeners.forEach(function(keyAndListener){
            var currentKey = keyAndListener.key;
            if(currentKey === key){
                listener = keyAndListener.listener;
            }
        });
        return listener;
    },
    keyPressed: function(e){
        var listener = undefined,
            key = undefined;

        switch(e.keyCode){
            case 32: key = 'space'; break;
            case 83: key = 's'; break;
            case 80: key = 'p'; break;
            case 37: key = 'left arrow'; break;
            case 39: key = 'right arrow'; break;
            case 38: key = 'up arrow'; break;
            case 40: key = 'down arrow'; break;
        }
        listener = this.findKeyListener(key);
        if(listener){
            listener();
        }
    },
    getHighScores: function(){//返回本地存储空间中保存的游戏高分列表
        var key = this.gameName + this.HIGH_SCORES_SUFFIX,
            highScoresString = localStorage[key];

        if(highScoresString == undefined){
            localStorage[key] = JSON.stringify([]);
        }
        return JSON.parse(localStorage[key]);
    },
    setHighScore: function(highScore){//将highScore参数所指的高分加入本地存储空间里的高分列表中
        var key = this.gameName + this.HIGH_SCORES_SUFFIX,
            highScoresString = localStorage[key];

        highScores.unshift(highScore);
        localStorage[key] = JSON.stringify(highScores);
    },
    clearHighScores: function(){//清空本地空间中的游戏高分数据
        localStorage[this.gameName + this.HIGH_SCORES_SUFFIX] = JSON.stringify([]);
    },
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
    togglePaused: function(){
        var now = getTimeNow();
        this.paused = !this.paused;
        if(this.paused){
            this.startedPauseAt = now;//暂停时，记录暂停那一刻的时间
        }else{
            this.startTime = this.startTime + now - this.startedPauseAt;//重置游戏开始的时间
            this.lastTime = now;
        }
    },
    addSprite: function(sprite){
        this.sprites.push(sprite);
    },
    getSprite: function(name){
        for(var i in this.sprites){
            if(this.sprites[i].name === name){
                return this.sprites[i];
            }
        }
        return null;
    },
    startAnimate: function(time){ },//游戏引擎在播放每帧动画前都会调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
    paintUnderSprites: function(){ },//游戏引擎在绘制精灵前会调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
    paintOverSprite: function(){ },//游戏引擎绘制完精灵后会调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
    endAnimate: function(){ }//游戏引擎绘制完当前动画帧之后，调用此回调方法。默认情况下它不做任何事情，留待开发者在其中实现游戏逻辑
};