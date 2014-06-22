define("LogoSettings", ["logoLoadingObject", "toastmessage", "fancybox", "FileAPI", "Jcrop", "tmpl", "text!logoTmpl.ftl"], function(logoLoadingObject) {
    /**
     * Глобальные настройки 
     */
    var settings = {
        nodeLogo: ""
        , prefix: window.prefix
        , baseUrl: window.base_url
        , errorMessage: window.errorMessage
    };
    /**
     * Глобальные переменные и константы
     */ 
    // ...
    /**
     * Конструктор LogoSettings. В конструкторе определюятся все свойства объекта. 
     * Защищенные и приватные свойства называются начиная с символа подчеркивания
     * @constructor
     * @param {Object} options
     */
    function LogoSettings(options) {
        $.extend(this, settings, options);
        
        this.editLogoInAction = false;
        this.x; 
        this.y; 
        this.w; 
        this.h; 
        this.originalPath;
        this.imageWidth;
        this.imageHeight;
        this.content;
        this.bigHolder;
        this.normalHolder;
        this.miniHolder;
        this.k;
        
        this._init();                
    }
    /**
     * Наследуемся от класса родителя и определяем методы. Защищенные и приватные методы называются начиная с символа подчеркивания
     */
    var methods = LogoSettings.prototype = new Object();
    
    methods._proxy = function(name) {
        var obj = this;
        return this["proxy-" + name] = this["proxy-" + name] || function(event) {
            obj[name](event);
        };
    };
    
    methods._init = function() {
        this.setLoadLogoEvent();

        this.setDeleteLogoEvent();

        this.setReadThumbnailSettingsEvent();
    };
    
    methods.fileApiBefore = function(imgCanvas) {
        $('#node-logo')
                .empty()
                .addClass('node-logo-big-toll')
                .css({width: "", height: ""})
                .append($(imgCanvas)
                .css("display", "block")
                .attr("id", "logo-img"));
        $('#logo-img')
                .fadeIn(500);
    };
    
    methods.fileApiSuccess = function() {
        $('#delete-logo-btn').fadeIn(200);
        $('#settings-logo-btn').fadeIn(200);

    };
    
    methods.fileApiError = function(xhr, status) {
        this.errorMessage(xhr.responseText);
    };
    
    methods.fileApiComplete = function() {
        $('#load-logo-btn').removeClass('load-logo-btn-press');
        $('#delete-logo-btn').removeClass('delete-logo-btn-press');
        $('#settings-logo-btn').removeClass('settings-logo-btn-press');
        $('#logo-loader').fadeOut(200);

        this.editLogoInAction = false;
    };
    
    methods.loadLogo = function (event) {
        if (this.editLogoInAction) {
            return;
        }
        this.editLogoInAction = true;

        $('#load-logo-btn').addClass('load-logo-btn-press');
        $('#delete-logo-btn').addClass('delete-logo-btn-press');
        $('#settings-logo-btn').addClass('settings-logo-btn-press');
        $('#logo-loader').fadeIn(200);
        
        this.onFiles(FileAPI.getFiles(event), {}, this._proxy("fileApiBefore"), this._proxy("fileApiSuccess"), this._proxy("fileApiError"), this._proxy("fileApiComplete"));
        FileAPI.reset(event.currentTarget);

    };
    
    methods.deleteLogoBeforeSend = function() {
        $('#load-logo-btn').addClass('load-logo-btn-press');
        $('#delete-logo-btn').addClass('delete-logo-btn-press');
        $('#settings-logo-btn').addClass('settings-logo-btn-press');
        $('#logo-loader').fadeIn(200);
    };
    
    methods.deleteLogoSuccess = function() {
        $('#node-logo')
                .empty()
                .removeClass('node-logo-big-toll')
                .css({width: "170px", height: "170px"})
                .append("<img src=\"" + this.nodeLogo + '/med?' + Math.random() + "\"/>");
        $('#delete-logo-btn')
                .fadeOut(200);
        $('#settings-logo-btn')
                .fadeOut(200);

    };
    
    methods.deleteLogoError = function(xhr, status) {
        this.errorMessage(xhr.responseText);
    };
    
    methods.deleteLogoComplete = function() {
        $('#load-logo-btn').removeClass('load-logo-btn-press');
        $('#delete-logo-btn').removeClass('delete-logo-btn-press');
        $('#settings-logo-btn').removeClass('settings-logo-btn-press');
        $('#logo-loader').fadeOut(200);

        this.editLogoInAction = false;
    };
    
    methods.deleteLogo = function () {
        if (this.editLogoInAction) {
            return;
        }
        this.editLogoInAction = true;
        
        this.deleteLogoBeforeSend();
        
        $.ajax({
            url: this.nodeLogo,
            type: 'DELETE',
            dataType: 'json',
            context: this,
            success: this.deleteLogoSuccess,
            error: this.deleteLogoError,
            complete: this.deleteLogoComplete
        });
    };
    
    methods.getThumbnailSettingsBeforeSend = function() {
        $('#load-logo-btn').addClass('load-logo-btn-press');
        $('#delete-logo-btn').addClass('delete-logo-btn-press');
        $('#settings-logo-btn').addClass('settings-logo-btn-press');
        $('#logo-loader').fadeIn(200);
    };
    
    methods.getThumbnailSettingsSuccess = function(json) {
        this.imageWidth = json.crop_info.width_src || '';
        this.imageHeight = json.crop_info.height_src || '';
        this.originalPath = (this.prefix ? this.prefix + '/' : '') + json.crop_info.original_path || '';
        this.w = json.crop_info.width_dst || 0;
        this.h = json.crop_info.height_dst || 0;
        this.x = json.crop_info.x || 0;
        this.y = json.crop_info.y || 0;
        this.content = $($("#logo-settings-popup").tmpl({original_path: this.originalPath}));

        $.fancybox.open({
            content: this.content,
            closeBtn: false,
            modal: true,
            wrapCSS: 'content-wrap',
            fitToView: false,
            afterShow: this._proxy("fancyboxAfterShow")
        });
    };
    
    methods.fancyboxAfterShow = function() {
        this.bigHolder = $("#thumbnail-settings-big-holder");
        this.bigHolder.height(this.bigHolder.width() / this.k);
        this.normalHolder = $("#thumbnail-settings-normal-holder");
        this.miniHolder = $("#thumbnail-settings-mini-holder");
        $('#load-cover-close').bind('click', this._proxy("loadCoverCloseHandler"));
        this.content
                .find('#cropbox:first')
                .Jcrop({
                    //aspectRatio: 1,
                    onRelease: this._proxy("jcropOnRelease"),
                    onChange: this._proxy("jcropOnChange"),
                    onSelect: this._proxy("jcropOnSelect"),
                    boxWidth: 500,
                    boxHeight: 370,
                    //minSize: [100, 100],
                    maxSize: [this.imageWidth, this.imageHeight],
                    bgColor: 'black',
                    bgOpacity: 0.6,
                    setSelect: [this.x, this.y, this.w + this.x, this.h + this.y]
                })
                .end()
                .find('#crop-image-btn:first')
                .bind('click', this._proxy("cropImageBtnHandler"))
                .end()
                .find('#cancel-image-btn:first')
                .bind('click', this._proxy("cancelImageBtnHandler"));
    };
    
    methods.jcropOnRelease = function(coords) {
        //происходит когда кликаешь на картинке вне текущей рамки, при этом рамка сбрасывается
    };
    
    methods.jcropOnChange = function(coords) {
        var k = coords.w / coords.h;
        if (k > 1) {
            if (k > 5) {
                this.setSelect([coords.x, coords.y, 4.8 * coords.h + coords.x, coords.h + coords.y]);
                return;
            }
        } else {
            if (k < 0.5) {
                this.setSelect([coords.x, coords.y, coords.w + coords.x, (coords.w / 0.52) + coords.y]);
                return;
            }
        }
        this.updateCoords(coords);
        this.showBigPreview(coords);
        this.showNormalPreview(coords);
        this.showMiniPreview(coords);
    };
    
    methods.jcropOnSelect = function(coords) {
        this.updateCoords(coords);
        this.showBigPreview(coords);
        this.showNormalPreview(coords);
        this.showMiniPreview(coords);
        this.bigHolder.find("img").css("visibility", "visible");
        this.normalHolder.find("img").css("visibility", "visible");
        this.miniHolder.find("img").css("visibility", "visible");
    };
    
    methods.loadCoverCloseHandler = function() {
        $.fancybox.close();
    };
    
    methods.cropImageBtnHandler = function(event) {
        this.createThumbnails();
    };
    
    methods.cancelImageBtnHandler = function(event) {
        $.fancybox.close();
    };
    
    methods.getThumbnailSettingsError = function(xhr, status) {
        this.errorMessage(xhr.responseText);
    };
    
    methods.getThumbnailSettingsComplete = function() {
        $('#load-logo-btn').removeClass('load-logo-btn-press');
        $('#delete-logo-btn').removeClass('delete-logo-btn-press');
        $('#settings-logo-btn').removeClass('settings-logo-btn-press');
        $('#logo-loader').fadeOut(200);

        this.editLogoInAction = false;
    };
    
    methods.getThumbnailSettings = function () {
        if (this.editLogoInAction) {
            return;
        }
        this.editLogoInAction = true;

        this.getThumbnailSettingsBeforeSend();

        $.ajax({
            url: this.nodeLogo,
            type: 'GET',
            dataType: 'json',
            context: this, 
            success: this.getThumbnailSettingsSuccess,
            error: this.getThumbnailSettingsError,
            complete: this.getThumbnailSettingsComplete
        });

    }

    methods.showBigPreview = function (coords) {
        var w = coords.w;
        var h = coords.h;
        var x = coords.x;
        var y = coords.y;
        this.k = w / h;
        this.bigHolder.height(this.bigHolder.width() / this.k);
        var rx = this.bigHolder.width() / w;
        var ry = this.bigHolder.height() / h;

        $('#thumbnail-settings-big-img').css({
            width: Math.round(rx * this.imageWidth) + 'px',
            height: Math.round(ry * this.imageHeight) + 'px',
            marginLeft: '-' + Math.round(rx * x) + 'px',
            marginTop: '-' + Math.round(ry * y) + 'px'
        });
    }

    methods.showNormalPreview = function (coords) {
        var w = coords.w;
        var h = coords.h;
        var x = coords.x;
        var y = coords.y;
        var k = w / h;
        if (k > 1) {
            x = Math.round(x + (w - h) / 2);
            w = h;
        } else {
            y = Math.round(y + (h - w) / 2);
            h = w;
        }
        var rx = this.normalHolder.width() / w;
        var ry = this.normalHolder.height() / h;

        $('#thumbnail-settings-normal-img').css({
            width: Math.round(rx * this.imageWidth) + 'px',
            height: Math.round(ry * this.imageHeight) + 'px',
            marginLeft: '-' + Math.round(rx * x) + 'px',
            marginTop: '-' + Math.round(ry * y) + 'px'
        });
    };

    methods.showMiniPreview = function (coords) {
        var w = coords.w;
        var h = coords.h;
        var x = coords.x;
        var y = coords.y;
        var k = w / h;
        if (k > 1) {
            x = Math.round(x + (w - h) / 2);
            w = h;
        } else {
            y = Math.round(y + (h - w) / 2);
            h = w;
        }
        var rx = this.miniHolder.width() / w;
        var ry = this.miniHolder.height() / h;

        $('#thumbnail-settings-mini-img').css({
            width: Math.round(rx * this.mage_width) + 'px',
            height: Math.round(ry * this.imageHeight) + 'px',
            marginLeft: '-' + Math.round(rx * x) + 'px',
            marginTop: '-' + Math.round(ry * y) + 'px'
        });
    }

    methods.updateCoords = function (c) {
        this.x = parseInt(c.x);
        this.y = parseInt(c.y);
        this.w = parseInt(c.w);
        this.h = parseInt(c.h);
    };
    
    methods.createThumbnailsBeforeSend = function() {
        $('#crop-image-btn').addClass('profile-form-blue-btn-press');
        $('#cancel-image-btn').addClass('profile-form-btn-press');
    };
        

    methods.createThumbnailsSuccess = function() {
        $.fancybox.close();
        var k = this.w / this.h;
        var width = 170;
        var height = width / k;
        $('#node-logo').empty().addClass('node-logo-big-toll').css({width: width + "px", height: height + "px"})
                .append("<img src=\"" + this.nodeLogo + '/med?' + Math.random() + "\"/>");
    };
    
    methods.createThumbnailsError = function(xhr, status) {
        this.errorMessage(xhr.responseText);
    };
    
    methods.createThumbnailsComplete = function() {
        $('#crop-image-btn').removeClass('profile-form-blue-btn-press');
        $('#cancel-image-btn').removeClass('profile-form-btn-press');

        this.editLogoInAction = false;
    };
    
    methods.createThumbnails = function () {
        if (this.editLogoInAction) {
            return;
        }
        this.editLogoInAction = true;
        
        this.createThumbnailsBeforeSend();
        
        var data = {
            width_dst: this.w,
            height_dst: this.h,
            x: this.x,
            y: this.y
        };
        
        $.ajax({
            url: this.nodeLogo + "/crop",
            type: "POST",
            dataType: "json",
            data: data,
            context: this,
            success: this.createThumbnailsSuccess,
            error: this.createThumbnailsError,
            complete: this.createThumbnailsComplete
        });

    }
    
    methods.setLoadLogoEvent = function () {
        $('#load-logo-inp').bind('change', this._proxy("loadLogo"))
    };

    methods.setDeleteLogoEvent = function () {
        $('#delete-logo-btn').bind('click', this._proxy("deleteLogo"));
    };

    methods.setReadThumbnailSettingsEvent = function () {
        $('#settings-logo-btn').bind('click', this._proxy("getThumbnailSettings"));
    };

    methods.onFiles = function (files, data, before, success, error, complete) {

        // Инициализация объекта по загрузке файлов
        logoLoadingObject.init(this.nodeLogo, data, $("#load-logo-inp"), before, success, error, complete);

        FileAPI.filterFiles(files, function(file, info) {
            if (/image/.test(file.type) && info) {
                return info.width > 100 || info.height > 100;
            }
            else {
                return file.size > 512 || !file.size;
            }
        }, function(files, deleted) {
            //
        });

        FileAPI.each(files, function(file) {
            if (file.size >= 25 * FileAPI.MB) {
                // Превышение размера файла
            }
            else if (file.size === void 0) {
                // Размер файла равен нулю
            }
            else {
                // Приступаем к загрузке логотипа
                logoLoadingObject.add(file);
                logoLoadingObject.start();
            }
        });
    };
    return LogoSettings;
});
