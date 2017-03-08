+function ($) {
  'use strict';

  // MODAL CLASS
  // ===========

  var Modal = function (element, options) {
    this.options             = options;
    this.$body               = $(document.body);
    this.$element            = $(element);
    this.$dialog             = this.$element.find('.modal-dialog');
    // 背景
    this.$backdrop           = null;
    this.isShown             = null;
    // body右内边距
    this.originalBodyPad     = null;
    // 竖直滑动条宽度
    this.scrollbarWidth      = 0;
    // 一开始以为跟backdrop:static有关系,然而实际上是用于模拟modal
    // dialog失去焦点的效果
    this.ignoreBackdropClick = false;

    if (this.options.remote) {
      this.$element
        .find('.modal-content')
        .load(this.options.remote, $.proxy(function () {
          this.$element.trigger('loaded.bs.modal');
        }), this);
    }
  }

  Modal.VERSION = '3.3.7';

  Modal.TRANSITION_DURATION = 300;
  Modal.BACKDROP_TRANSITION_DURATION = 150;

  Modal.DEFAULTS = {
    backdrop: true,
    keyboard: true,
    show: true
  };

  // @param {element} _relatedTarget 一个modal可以关联多个按钮,方便
  // 生成类似的modal
  // 见@Varying modal content based on trigger button节
  Modal.prototype.toggle = function (_relatedTarget) {
    return this.isShown ? this.hide() : this.show(_relatedTarget);
  };

  Modal.prototype.show = function (_relatedTarget) {
    var that = this;
    var e = $.Event('show.bs.modal', { relatedTarget: _relatedTarget });

    this.$element.trigger(e);

    if (this.isShown || e.isDefaultPrevented()) return;

    this.isShown = true;

    // 检查有没有滚动条、获取滚动条宽度、给body加相应的右内边距
    // 目的是？？貌似并不是防止抖动？
    this.checkScrollbar();
    this.setScrollbar();
    this.$body.addClass('modal-open');

    // 设置键盘和resize事件
    this.escape();
    this.resize();

    // 关闭按钮绑定监听函数
    this.$element.on('click.dismiss.bs.modal', '[data-dismiss="modal"]', $.proxy(this.hide, this));

    // 每次点击dialog的时候,在modal上绑定一个只触发一次的click的响应函数,
    // 这个函数使得ignoreBackdropClick的值为true.在backdrop方法里绑定的
    // click事件处理函数中,如果这个值为true,将不会调用hide方法隐藏modal.
    // 于是形成了模拟dialog失去焦点的效果:点击dialog->dialog获取焦点->
    // 点击背景->ignoreBackdropClick设为true->不关闭modal->
    // ignoreBackdropClick回到false->再点击一次背景->可以关闭modal
    this.$dialog.on('mousedown.dismiss.bs.modal', function () {
      that.$element.one('mouseup.dismiss.bs.modal', function (e) {
        if ($(e.target).is(that.$element))
          that.ignoreBackdropClick = true;
      });
    });

    // 先完成backdrop的显示,再显示modal
    this.backdrop(function () {
      var transition = $.support.transition && that.$element.hasClass('fade');

      if (!that.$element.parent().length) {
        that.$element.appendTo(that.$body);
      }

      that.$element
        .show()
        // 强制滚动条到最上面,避免modal太长时从中间部分开始显示
        .scrollTop(0);

      that.adjustDialog();

      // 强制回流
      if (transition) that.$element[0].offsetWidth;
      that.$element.addClass('in');

      // 强制获取焦点
      that.enforceFocus();

      var e = $.Event('shown.bs.modal', { relatedTarget: _relatedTarget });

      transition ?
        that.$dialog
          // modal in 动画完后,再获取焦点,触发shown
          .one('bsTransitionEnd', function () {
            that.$element.trigger('focus').trigger(e);
          })
          .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
        that.$element.trigger('focus').trigger(e);
    });
  };

  Modal.prototype.hide = function (e) {
    // 作为键盘事件响应函数调用的时候,阻止按键的默认行为
    if (e) e.preventDefault();

    e = $.Event('hide.bs.modal');

    this.$element.trigger(e);

    if (!this.isShown || e.isDefaultPrevented()) return;

    this.isShown = false;

    // 解绑各种事件
    this.escape();
    this.resize();
    $(document).off('focusin.bs.modal');

    // 触发淡出动画,解绑$element上的事件
    this.$element
      .removeClass('in')
      .off('click.dismiss.bs.modal')
      .off('mouseup.dismiss.bs.modal');

    this.$dialog.off('mousedown.dismiss.bs.modal');

    $.support.transition && this.$element.hasClass('fade') ?
      this.$element
        .one('bsTransitionEnd', $.proxy(this.hideModal, this))
        .emulateTransitionEnd(Modal.TRANSITION_DURATION) :
      this.hideModal();
  };

  Modal.prototype.hideModal = function () {
    var that = this;
    this.$element.hide();
    this.backdrop(function () {
      that.$body.removeClass('modal-open');
      that.resetAdjustments();
      that.resetScrollbar();
      that.$element.trigger('hidden.bs.modal');
    });
  };

  // 强制获取焦点
  Modal.prototype.enforceFocus = function () {
    $(document)
      .off('focusin.bs.modal')
      .on('focusin.bs.modal', $.proxy(function (e) {
        if (document !== e.target &&
            this.$element[0] !== e.target &&
            !this.$element.has(e.target).length) {
          this.$element.trigger('focus');
        }
      }, this));
  };

  // 检查有没有竖直滚动条
  Modal.prototype.checkScrollbar = function () {
    // window.innerWidth: 浏览器的视口宽度,包括滚动条,outerWidth浏览器窗口宽度,
    // 不同浏览器略不同
    var fullWindowWidth = window.innerWidth;

    // IE8 bug
    if (!fullWindowWidth) {
      var documentElementRect = document.documentElement.getBoundingClientRect();
      fullWindowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
    }

    // clientWidth:窗口可见区域宽度,不包括滚动条
    this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth;
    this.scrollbarWidth = this.measureScrollbar();
  };

  // 加个元素到DOM中,通过它的offsetWidth和clientWidth的差得到滚动条的宽度
  Modal.prototype.measureScrollbar = function () {
    var scrollDiv = document.createElement('div');
    scrollDiv.className = 'modal-scrollbar-measure';
    this.$body.append(scrollDiv);
    // offsetWidth 布局宽度,包括边框、内边距、竖直滚动条
    var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
    this.$body[0].removeChild(scrollDiv);
    return scrollbarWidth;
  };

  // 设置body的padding-right为滚动条的宽度
  Modal.prototype.setScrollbar = function () {
    var bodyPad = parseInt((this.$body.css('padding-right') || 0), 10);
    this.originalBodyPad = document.body.style.paddingRight || '';
    if (this.bodyIsOverflowing) this.$body.css('padding-right', bodyPad + this.scrollbarWidth);
  };

  Modal.prototype.resetScrollbar = function () {
    this.$body.css('padding-right', this.originalBodyPad);
  };

  // 处理键盘事件的绑定解绑
  // 按ESC键关闭modal
  Modal.prototype.escape = function () {
    if (this.isShown && this.options.keyboard) {
      this.$element.on('keydown.dismiss.bs.modal', $.proxy(function (e) {
        e.which == 27 && this.hide();
      }, this));
    } else if (!this.isShown) {
      this.$element.off('keydown.dismiss.bs.modal');
    }
  };

  // 处理resize事件的绑定解绑
  Modal.prototype.resize = function () {
    if (this.isShown) {
      $(window).on('resize.bs.modal', $.proxy(this.handleUpdate, this));
    } else {
      $(window).off('resize.bs.modal');
    }
  };

  // 窗口大小调整时,滚动条可能出现/隐藏,要调整左右内边距
  Modal.prototype.handleUpdate = function () {
    this.adjustDialog();
  };

  Modal.prototype.adjustDialog = function () {
    var modalIsOverflowing = this.$element[0].scrollHeight > document.documentElement.clientHeight;

    // body没滚动条,modal有滚动条,设置左内边距使内容区居中?
    // body有滚动条,modal没滚动条,设置右内边距使？
    this.$element.css({
      paddingLeft: !this.bodyIsOverflowing && modalIsOverflowing ? this.scrollbarWidth : '',
      paddingRight: this.bodyIsOverflowing && !modalIsOverflowing ? this.scrollbarWidth : ''
    });
  };

  Modal.prototype.resetAdjustments = function () {
    this.$element.css({
      paddingLeft: '',
      paddingRight: ''
    });
  };

  // @param {Function} callback 在backdrop显示/隐藏后调用
  Modal.prototype.backdrop = function (callback) {
    var that = this;
    var animate = this.$element.hasClass('fade') ? 'fade' : '';

    // modal显示过程中
    if (this.isShown && this.options.backdrop) {
      var doAnimate = $.support.transition && animate;

      // 加上backdrop
      this.$backdrop = $(document.createElement('div'))
        .addClass('modal-backdrop ' + animate)
        .appendTo(this.$body);

      this.$element.on('click.dismiss.bs.modal', $.proxy(function (e) {
        if (this.ignoreBackdropClick) {
          this.ignoreBackdropClick = false;
          return;
        }
        // e.currentTarget 冒泡到的元素
        if (e.target !== e.currentTarget) return;

        // 传入backdrop: 'static'时,点backdrop不会关闭model
        this.options.backdrop == 'static'
          ? this.$element[0].focus()
          : this.hide();
      }, this));

      // 强制浏览器回流,防止不正常显示fade in动画
      if (doAnimate) this.$backdrop[0].offsetWidth;
      this.$backdrop.addClass('in');

      if (!callback) return;
      doAnimate ?
        this.$backdrop
          .one('bsTransitionEnd', callback)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callback();

    } else if (!this.isShown && this.$backdrop) {
      this.$backdrop.removeClass('in');

      var callbackRemove = function () {
        that.removeBackdrop();
        callback && callback()
      }
      $.support.transition && this.$element.hasClass('fade') ?
        this.$backdrop
          .one('bsTransitionEnd', callbackRemove)
          .emulateTransitionEnd(Modal.BACKDROP_TRANSITION_DURATION) :
        callbackRemove();

    } else if (callback) {
      callback();
    }
  };

  Modal.prototype.removeBackdrop = function () {
    this.$backdrop && this.$backdrop.remove();
    this.$backdrop = null;
  };

  // PLUGIN
  // ====================

  function Plugin(option, _relatedTarget) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.modal');
      var options = $.extend({}, Modal.DEFAULTS, $this.data(), typeof option == 'object' && option);

      if (!data) $this.data('bs.modal', (data = new Modal(this, options)));
      if (typeof option == 'string') data[option](_relatedTarget);
      else if (options.show) data.show(_relatedTarget);
    })
  }

  var old = $.fn.modal;

  $.fn.modal = Plugin;
  $.fn.modal.Constructor = Modal;

  $.fn.modal.noConflict = function () {
    $.fn.modal = old;
    return this;
  };

  // DATA-API
  // =================

  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this   = $(this);
    var href    = $this.attr('href');
    var $target = $($this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, '')));
    var option = $target.data('bs.modal') ? 'toggle' : $.extend({ remote: !/#/.test(href) && href }, $target.data(), $this.data());

    if ($this.is('a')) e.preventDefault();

    $target.one('show.bs.modal', function (showEvent) {
      if (showEvent.isDefaultPrevented()) return;
      // toggle在modal隐藏后获取焦点
      $target.one('hidden.bs.modal', function () {
        $this.is(':visible') && $this.trigger('focus');
      });
    });
    Plugin.call($target, option, this);
  });

}(jQuery);
