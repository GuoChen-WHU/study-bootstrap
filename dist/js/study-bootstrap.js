/*!
 * Bootstrap v1.0.0 ()
 * Copyright 2011-2017 Guo Chen
 * Licensed under the ISC license
 */

if (typeof jQuery === 'undefined') {
  throw new Error('Bootstrap\'s JavaScript requires jQuery')
}

+function ($) {
  'use strict';
  var version = $.fn.jquery.split(' ')[0].split('.')
  if ((version[0] < 2 && version[1] < 9) || (version[0] == 1 && version[1] == 9 && version[2] < 1) || (version[0] > 3)) {
    throw new Error('Bootstrap\'s JavaScript requires jQuery version 1.9.1 or higher, but lower than version 4')
  }
}(jQuery);

+function ( $ ) {
  'use strict';

  // 检查当前环境的transition属性支持情况
  function transitionEnd() {
    var el = document.createElement( 'bootstrap' );

    var transEndEventNames = {
      WebkitTransition : 'webkitTransitionEnd',
      MozTransition    : 'transitionend',
      OTransition      : 'OTransitionEnd otransitionend',
      transition       : 'transitionend'
    };

    for ( var name in transEndEventNames ) {
      if ( el.style[ name ] !== undefined ) {
        return { end: transEndEventNames[ name ] };
      }
    }

    return false;
  }

  // 模拟transition结束事件
  $.fn.emulateTransitionEnd = function ( duration ) {
    var called = false;
    var $el = this;
    $( this ).one( 'bsTransitionEnd', function () { called = true; } );

    // duration时间后，触发transition.end事件
    var callback = function () {
      if ( !called ) $( $el ).trigger( $.support.transition.end );
    };
    setTimeout( callback, duration );
    return this;
  };

  $( function () {
    $.support.transition = transitionEnd();

    if ( !$.support.transition ) return;

    // 这里把bsTransitionEnd事件和transition.end事件关联还是怎么样？
    $.event.special.bsTransitionEnd = {
      bindType: $.support.transition.end,
      delegateType: $.support.transition.end,
      handle: function ( e ) {
        if ( $( e.target ).is( this ) ) return e.handleObj.handler.apply( this, arguments );
      }
    };
  });

}( jQuery );

+function ( $ ) {
  'use strict';

  // Alert类
  // -----------------

  // Button上面会有这个属性
  var dismiss = '[data-dismiss="alert"]';
  var Alert = function ( el ) {
    $( el ).on( 'click', dismiss, this.close );
  };

  Alert.VERSION = '3.3.7';

  Alert.TRANSITION_DURATION = 150;

  Alert.prototype.close = function ( e ) {
    // 这里的this值是带有data-dismiss='alert'属性的DOM元素
    var $this = $( this );
    // 找有data-target属性的节点作为$parent
    var selector = $this.attr( 'data-target' );

    if ( !selector ) {
      // 没有data-target属性，如果是带有href的a元素也可以
      selector = $this.attr( 'href' );
      selector = selector && selector.replace( /.*(?=#[^\s]*$)/, '' ); // strp for ie 7?
    }

    var $parent = $( selector === '#' ? [] : selector );

    // 阻止click事件的默认行为
    if ( e ) e.preventDefault();

    // 如果没有找到带有data-target属性或href属性的节点
    if ( !$parent.length ) {
      // 目标就是最近的带有alert类的节点
      $parent = $this.closest( '.alert' );
    }

    // 触发close.bs.alert事件
    $parent.trigger( e = $.Event( 'close.bs.alert' ) );

    // 触发的事件对象如果在其它处理函数里使用过preventDefault，就直接返回，
    // 没有下面把data-target及其子节点移除的操作了。
    if ( e.isDefaultPrevented() ) return;

    // 目标上同时有fade和in类，目标移除时会有淡出效果
    // 这里先把in移除掉,会触发opacity由1变0的动画效果(见component-animation.less)
    $parent.removeClass( 'in' );

    // 移除目标元素
    function removeElement() {
      // 这里的顺序需要注意，先把parent从视觉上移除掉，再触发closed事件，等closed
      // 事件的处理函数处理完后，再把parent彻底移除。
      // closed事件表示元素已经关闭，所以先detach；事件响应函数可能用到$parent，
      // 所以最后才把parent彻底移除
      $parent.detach().trigger( 'closed.bs.alert' ).remove();
    }

    // 首先判断支持transition，在transition.js文件中重写了jquery自带的
    // support.transition属性，因为这个特性可能在新版本jquery中移除
    // 如果禁用了过渡效果，那就直接移除元素了
    $.support.transition && $parent.hasClass( 'fade' ) ?
      $parent
        // bsTransitionEnd事件发生后，移除元素
        .one( 'bsTransitionEnd', removeElement )
        .emulateTransitionEnd( Alert.TRANSITION_DURATION ) :
      removeElement();
  }

  // Alert插件
  // -----------------

  // Plugin方法在bootstrap中一般有两种调用方式。
  // 首先是不带option的调用，形如$().alert()，使元素“具有alert特性”，即它会监听
  // 具有data-dismiss="alert"子孙元素上的click事件，当click事件发生时它会从DOM
  // 移除.(使用data-api的时候不需要显示调用这个方法，因为最后一行已经做了这个工
  // 作)。实现的原理就是使用当前元素调用new Alert()，在Alert方法内实现：具有
  // data-dismiss="alert"子孙元素上的click事件的监听。
  // 然后是带option的调用，用于触发特定的行为，如$().alert('close')，能够调用
  // 元素上的close方法，将alert从DOM移除
  function Plugin( option ) {
    // 一般是在jquery对象上调这个方法，如$el.alert，所以这个this就是jquery对象
    return this.each( function () {
      // jquery的each方法把this值设成每一个DOM节点
      var $this = $( this );
      // 获取存储的$.bs.alert对象，第一次执行data值为undefined
      var data = $this.data( 'bs.alert' );

      // 创建Alert对象，并赋值给data，存储在元素的jQuery对象上的'bs.alert'数据中
      if ( !data ) $this.data( 'bs.alert', ( data = new Alert( this ) ) );
      // 如果传入了option，调用相应的方法
      if ( typeof option == 'string' ) data[ option ].call( $this );
    });
  }

  // 将原先的fn.alert插件对象保存起来
  var old = $.fn.alert;

  // 新的alert插件对象
  $.fn.alert = Plugin;
  // 这个自定义的Constructor属性的用途：通过将作用域内的Alert类赋值给Constructor
  // 属性，在本作用域外就可以使用Alert类了，比如var Alert = $.fn.alert.Constructor
  $.fn.alert.Constructor = Alert;

  $.fn.alert.noConflict = function () {
    $.fn.alert = old;
    return this;
  };

  // 事件命名空间包括data-api，这样可以通过$(document).off('.data-api')禁用
  // bootstrap的data api
  $( document ).on( 'click.bs.alert.data-api', dismiss, Alert.prototype.close );

}( jQuery );

+function ( $ ) {
  'use strict';

  // Button 公有类定义

  var Button = function ( element, options ) {
    this.$element = $( element );
    this.options = $.extend( {}, Button.DEFAULTS, options );
    this.isLoading = false;
  };

  Button.VERSION = '3.3.7';

  Button.DEFAULTS = {
    loadingText: 'loading...'
  };

  Button.prototype.setState = function ( state ) {
    var d = 'disabled';
    var $el = this.$element;
    var val = $el.is( 'input' ) ? 'val' : 'html';
    var data = $el.data();

    state += 'Text';

    // 如果是input元素，val返回输入框的内容；其它元素用html返回内部html.保存在
    // data-reset-text属性中
    if ( data.resetText == null ) $el.data( 'resetText', $el[ val ]() );

    // 添加到浏览器事件轮询中，使表单能够提交
    setTimeout( $.proxy( function () {
      // 把输入框内容或innerHTML设为data[ state ]
      $el[ val ]( data[ state ] == null ? this.options[ state ] : data[ state ]);

      // 如果是setState( loading )，使按钮不可点击
      if ( state == 'loadingText' ) {
        this.isLoading = true;
        // 分别加上.disabled类、设置disabled='disabled'、设置节点的disabled
        // 属性为true
        $el.addClass( d ).attr( d, d ).prop( d, true );
      }
      // 否则检查是否需要取消loading状态
      else if ( this.isLoading ) {
        this.isLoading = false;
        $el.removeClass( d ).removeAttr( d ).prop( d, false );
      }
    }, this), 0 );
  }

  Button.prototype.toggle = function () {
    var changed = true;
    // 对于checkbox和radio，会有一个父元素包裹一组checkbox或radio，带有
    // data-toggle="buttons"属性
    var $parent = this.$element.closest( '[data-toggle="buttons"]' );

    if ( $parent.length ) {
      var $input = this.$element.find( 'input' );

      if ( $input.prop( 'type' ) == 'radio' ) {
        if ( $input.prop( 'checked' ) ) changed = false;
        $parent.find( '.active' ).removeClass( 'active' );
        this.$element.addClass( 'active' );

      } else if ( $input.prop( 'type' ) == 'checkbox' ) {
        if ( $input.prop( 'checked' ) !== this.$element.hasClass( 'active' ) )
          changed = false;
        this.$element.toggleClass( 'active' );
      }
      $input.prop( 'checked', this.$element.hasClass( 'active') );
      if ( changed ) $input.trigger( 'change' );
    } else {
      // 对于button，切换aria-pressed属性和active类
      this.$element.attr( 'aria-pressed', !this.$element.hasClass( 'active' ) );
      this.$element.toggleClass( 'active' );
    }
  }


  // Button插件
  // ----------------------

  function Plugin( option ) {
    return this.each( function () {
      var $this = $( this );
      var data = $this.data( 'bs.button' );
      var options = typeof option == 'object' && option;

      if ( !data ) $this.data( 'bs.button', ( data = new Button( this, options)));

      if ( option == 'toggle' ) data.toggle();
      else if ( option ) data.setState( option );
    });
  }

  var old = $.fn.button;

  $.fn.button = Plugin;
  $.fn.button.Constructor = Button;

  $.fn.button.noConflict = function () {
    $.fn.button = old;
    return this;
  };

  // Button data-api
  $( document )
    .on( 'click.bs.button.data-api', '[data-toggle^="button"]', function ( e ) {
      var $btn = $( e.target ).closest( '.btn' );
      Plugin.call( $btn, 'toggle' );
      if ( !( $( e.target ).is( 'input[type="radio"], input[type="checkbox"]' ))) {
        // 阻止单选框和复选框上的双击
        e.preventDefault();
        // 保持焦点
        if ( $.btn.is( 'input,button' ) ) $btn.trigger( 'focus' );
        else $btn.find( 'input:visible,button:visible' ).first().trigger( 'focus' );
      }
    })
    .on( 'focus.bs.button.data-api blur.bs.button.data-api', '[data-toggle^="button"]', function ( e ) {
      // 如果是focus或focusin事件，给button加上'.focus'类，否则去掉
      $( e.target ).closest( '.btn' ).toggleClass( 'focus', /^focus(in)?$/.test( e.type ));
    });
}

+function ($) {
  'use strict';

  // CAROUSEL CLASS DEFINITION
  // ==========================

  var Carousel = function (element, options) {
    this.$element    = $(element);
    this.$indicators = this.$element.find('.carousel-indicators');
    this.options     = options;
    this.paused      = null;
    this.sliding     = null;
    this.interval    = null;
    this.$active     = null;
    this.$items      = null;

    // 响应键盘事件
    this.options.keyboard && this.$element.on('keydown.bs.carousel', $.proxy(this.keydown, this));

    // 设置了pause:'hover'，鼠标进入时停止旋转，鼠标移出时恢复旋转
    this.options.pause == 'hover' && !('ontouchstart' in document.documentElement) && this.$element.on('mouseenter.bs.carousel', $.proxy(this.pause, this))
                       .on('mouseleave.bs.carousel', $.proxy(this.cycle, this));
  }

  Carousel.VERSION = '3.3.7';

  Carousel.TRANSITION_DURATION = 600;

  Carousel.DEFAULTS = {
    interval: 5000,
    pause: 'hover',
    wrap: true,
    keyboard: true
  };

  // 左右箭头控制旋转
  Carousel.prototype.keydown = function (e) {
    if (/input|textarea/i.test(e.target.tagName)) return;
    switch (e.which) {
      case 37: this.prev(); break;
      case 39: this.next(); break;
      default: return;
    }

    e.preventDefault();
  };

  Carousel.prototype.cycle = function (e) {
    // cycle可能直接调用，也可能作为事件响应函数
    // 不带参数直接调用那就把this.paused设为false，开始旋转
    // 作为事件响应函数时(mouseleave事件)则不修改this.paused的值，pause函数里
    // 也是这样，很巧妙
    e || (this.paused = false);

    // 清除之前的定时器
    this.interval && clearInterval(this.interval);

    // 检查options.interval和this.paused，设置新的定时器
    this.options.interval
      && !this.paused
      && (this.interval = setInterval($.proxy(this.next, this), this.options.interval));

    return this;
  };

  Carousel.prototype.getItemIndex = function (item) {
    this.$items = item.parent().children('.item');
    return this.$items.index(item || this.$active);
  };

  // 给定方向和当前项索引，返回下一项
  Carousel.prototype.getItemForDirection = function (direction, active) {
    var activeIndex = this.getItemIndex(active);
    var willWrap = (direction == 'prev' && activeIndex === 0)
                || (direction == 'next' && activeIndex == (this.$items.length - 1));
    // 需要wrap而options指定不允许wrap，那就返回当前active的索引
    if (willWrap && !this.options.wrap) return active;
    var delta = direction == 'prev' ? -1 : 1;
    var itemIndex = (activeIndex + delta) % this.$items.length;
    return this.$items.eq(itemIndex);
  };

  Carousel.prototype.to = function (pos) {
    var that = this;
    var activeIndex = this.getItemIndex(this.$active = this.$element.find('.item.active'));

    if (pos > (this.$items.length - 1) || pos < 0) return;

    // 正在滑动，等滑动结束后再执行这个函数
    if (this.sliding) return this.$element.one('slid.bs.carousel', function () { that.to(pos) });
    // 目标就是当前的项，开始新的旋转
    if (activeIndex == pos) return this.pause().cycle();

    // 调用slide实现往特定方向滑动至目标项
    return this.slide(pos > activeIndex ? 'next' : 'prev', this.$items.eq(pos));
  };

  Carousel.prototype.pause = function (e) {
    // 类似cycle，pause可能直接调用，也可能作为事件响应函数
    e || (this.paused = true);

    // .next, .prev这种元素是干嘛的?
    if (this.$element.find('.next, .prev').length && $.support.transition) {
      this.$element.trigger($.support.transition.end);
      this.cycle(true);
    }

    // 清除定时器，this.interval设为undefined(clearInterval没有返回值)
    this.interval = clearInterval(this.interval);

    return this;
  };

  Carousel.prototype.next = function () {
    if (this.sliding) return;
    return this.slide('next');
  };

  Carousel.prototype.prev = function () {
    if (this.sliding) return;
    return this.slide('prev');
  };

  /**
   * @param type 'prev'或者'next'
   * @param next 目标项
   */
  Carousel.prototype.slide = function (type, next) {
    var $active   = this.$element.find('.item.active');
    var $next     = next || this.getItemForDirection(type, $active);
    var isCycling = this.interval;
    var direction = type == 'next' ? 'left' : 'right';
    var that      = this;

    // nowrap时会有这种情况，next就是active
    if ($next.hasClass('active')) return (this.sliding = false);

    // 先触发slide事件，带上relatedTarget和direction两个参数
    var relatedTarget = $next[0];
    var slideEvent = $.Event('slide.bs.carousel', {
      relatedTarget: relatedTarget,
      direction: direction
    });
    this.$element.trigger(slideEvent);
    if (slideEvent.isDefaultPrevented()) return;

    // 将sliding标志设为true
    this.sliding = true;

    // 有一个正在旋转的定时器的话，把它清除掉
    isCycling && this.pause();

    // indicators上active类的切换
    if (this.$indicators.length) {
      this.$indicators.find('.active').removeClass('active');
      var $nextIndicator = $(this.$indicators.children()[this.getItemIndex($next)]);
      $nextIndicator && $nextIndicator.addClass('active');
    }

    // slid事件
    var slidEvent = $.Event('slid.bs.carousel', { relatedTarget: relatedTarget, direction: direction });
    // 如果没有禁用transition，过渡之后再触发slid
    if ($.support.transition && this.$element.hasClass('slide')) {
      // 以slide(next)为例来看整个过程：(结合carousel.less)
      // 首先$next添加.next，则$next对应元素的
      // display:block和transform:translate3d(100%, 0, 0)属性生效
      // 效果就是$next元素被推到了最右侧，且由于carousel-inner的overflow:hidden
      // 被隐藏
      $next.addClass(type);
      $next[0].offsetWidth; // 强制浏览器回流，重新渲染UI
      // 然后给$active添加.left，则$active对应元素的
      // transform属性由translate3d(0,0,0)变为translate3d(-100%,0,0)
      // 且.item设定了transition:transform .6s ease-in-out;
      // 产生了向左滑出窗口的效果
      $active.addClass(direction);
      // 最后给$next添加.left，元素的transform属性变为translate3d(0,0,0)
      // 产生向左滑入窗口的效果
      $next.addClass(direction);

      // transition所需的duration时间过后，再把上面加的几个类移除;触发slid事件
      $active
        .one('bsTransitionEnd', function () {
          // $next移除.next.left，添加.active
          $next.removeClass([type, direction].join(' ')).addClass('active');
          // $active移除.active.left
          $active.removeClass(['active', direction].join(' '));
          that.sliding = false;
          setTimeout(function () {
            that.$element.trigger(slidEvent);
          }, 0);
        })
        .emulateTransitionEnd(Carousel.TRANSITION_DURATION);
    } else { // 否则直接切换item，触发slid事件
      $active.removeClass('active');
      $next.addClass('active');
      this.sliding = false;
      this.$element.trigger(slidEvent);
    }

    // 本来是在旋转的话，重新开始旋转(上面有一句停止了旋转的定时器)
    isCycling && this.cycle();

    return this;
  }


  // CAROUSEL PLUGIN DEFINITION
  // ==========================

  function Plugin(option) {
    return this.each(function () {
      var $this   = $(this);
      var data    = $this.data('bs.carousel');

      // options由默认值、carousel上的data属性和option组成
      var options = $.extend({}, Carousel.DEFAULTS, $this.data(), typeof option == 'object' && option);

      // option为'cycle','pause','prev','next'时；
      // 或者是control被点击时，由data-slide获取action('prev'或'next')
      var action  = typeof option == 'string' ? option : options.slide;

      if (!data) $this.data('bs.carousel', (data = new Carousel(this, options)));

      // 还可以传入number，切换到指定项
      if (typeof option == 'number') data.to(option);

      else if (action) data[action]();

      // 不是以上情况,那就是通过carousel({interval: ...})初始化一个carousel时，
      // 那就停止之前的旋转，开始旋转
      else if (options.interval) data.pause().cycle();
    });
  }

  var old = $.fn.carousel;

  $.fn.carousel = Plugin;
  $.fn.carousel.Constructor = Carousel;

  $.fn.carousel.noConflict = function () {
    $.fn.carousel = old;
    return this;
  };


  // CAROUSEL DATA-API
  // =================

  var clickHandler = function (e) {
    var href;
    var $this = $(this);

    // 获取carousel元素(div)，看例子，第一种情况是由indicator获取target，第二种
    // 情况是由controls获取target
    var $target = $($this.attr('data-target') || (href = $this.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, '')); // strip for ie7
    if (!$target.hasClass('carousel')) return;

    // options由carousel元素上的data和被点击的indicator或control上的data(分别是data-slide-to和data-slide)组成
    var options = $.extend({}, $target.data(), $this.data());

    // 点击的是indicator，就会有data-slide-to，把
    // options.interval设为false避免在Plugin中进入最后一种情况
    var slideIndex = $this.attr('data-slide-to');
    if (slideIndex) options.interval = false;

    // 如果点击的是indicator，Plugin里面其实只做了一件事：当carousel还未初始化
    // 的时候，调用Carousel生成一个Carousel对象并存储在data-bs.carousel上
    Plugin.call($target, options);

    // 还是点击的是indicator的情况，切换到指定项
    if (slideIndex) {
      $target.data('bs.carousel').to(slideIndex);
    }

    e.preventDefault();
  }

  // Controls和Indicators都绑定click事件
  $(document)
    .on('click.bs.carousel.data-api', '[data-slide]', clickHandler)
    .on('click.bs.carousel.data-api', '[data-slide-to]', clickHandler);

  // carousel初始化
  $(window).on('load', function () {
    $('[data-ride="carousel"]').each(function () {
      var $carousel = $(this);
      Plugin.call($carousel, $carousel.data());
    });
  });

}(jQuery);

/**
 * 官方示例
 * ----------------

<div id="carousel-example-generic" class="carousel slide" data-ride="carousel">
  <!-- Indicators -->
  <ol class="carousel-indicators">
    <li data-target="#carousel-example-generic" data-slide-to="0" class="active"></li>
    <li data-target="#carousel-example-generic" data-slide-to="1"></li>
    <li data-target="#carousel-example-generic" data-slide-to="2"></li>
  </ol>

  <!-- Wrapper for slides -->
  <div class="carousel-inner" role="listbox">
    <div class="item active">
      <img src="..." alt="...">
      <div class="carousel-caption">
        ...
      </div>
    </div>
    <div class="item">
      <img src="..." alt="...">
      <div class="carousel-caption">
        ...
      </div>
    </div>
    ...
  </div>

  <!-- Controls -->
  <a class="left carousel-control" href="#carousel-example-generic" role="button" data-slide="prev">
    <span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span>
    <span class="sr-only">Previous</span>
  </a>
  <a class="right carousel-control" href="#carousel-example-generic" role="button" data-slide="next">
    <span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span>
    <span class="sr-only">Next</span>
  </a>
</div>
*/

+function ($) {
  'use strict';

  var Collapse = function (element, options) {
    this.$element = $(element);
    this.options = $.extend({}, Collapse.DEFAULTS, options);
    this.$trigger = $('[data-toggle="collapse"][href="#' + element.id + '"],' +
                      '[data-toggle="collapse"][data-target="#' + element.id + '"]');
    this.transitioning = null;

    if (this.options.parent) {
      this.$parent = this.getParent();
    } else {
      this.addAriaAndCollapsedClass(this.$element, this.$trigger);
    }

    if (this.options.toggle) this.toggle();
  };

  Collapse.VERSION = '3.3.7';

  Collapse.TRANSITION_DURATION = 350;

  Collapse.DEFAULTS = {
    toggle: true
  };

  // 获取折叠的维度
  Collapse.prototype.dimension = function () {
    var hasWidth = this.$element.hasClass('width');
    return hasWidth ? 'width' : 'height';
  };

  Collapse.prototype.show = function () {
    if (this.transitioning || this.$element.hasClass('in')) return;

    // 如果有同组的其它collapse，要把其它的hide
    var activesData;
    var actives = this.$parent && this.$parent.children('.panel').children('.in, .collapsing');

    if (actives && actives.length) {
      activesData = actives.data('bs.collapse');
      if (activesData && activesData.transitioning) return;
    }

    var startEvent = $.Event('show.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    if (actives && actives.length) {
      /* jshint ignore:start */
      Plugin.call(actives, 'hide');
      /* jshint ignore:end */
      activesData || actives.data('bs.collapse', null);
    }

    var dimension = this.dimension();

    this.$element
      .removeClass('collapse')
      .addClass('collapsing')[dimension](0) // 高度设为0
      .attr('aria-expanded', true);

    this.$trigger
      .removeClass('collapsd')
      .attr('aria-expanded', true);

    this.transitioning = 1;

    var complete = function () {
      this.$element
        .removeClass('collapsing')
        .addClass('collapse in')[dimension]('');
      this.transitioning = 0;
      this.$element
        .trigger('shown.bs.collapse');
    };

    if (!$.support.transition) return complete.call(this);

    var scrollSize = $.camelCase(['scroll', dimension].join('-'));

    this.$element
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION)[dimension](this.$element[0][scrollSize]); // 设为完整高度(scrollHeight)
  };

  Collapse.prototype.hide = function () {
    if (this.transitioning || !this.$element.hasClass('in')) return;

    var startEvent = $.Event('hide.bs.collapse');
    this.$element.trigger(startEvent);
    if (startEvent.isDefaultPrevented()) return;

    var dimension = this.dimension();

    this.$element[dimension](this.$element[dimension]())[0].offsetHeight;

    this.$element
      .addClass('collapsing')
      .removeClass('collapse in')
      .attr('aria-expanded', false);

    this.$trigger
      .addClass('collapsed')
      .attr('aria-expanded', false);

    this.transitioning = 1;

    var complete = function () {
      this.transitioning = 0;
      this.$element
        .removeClass('collapsing')
        .addClass('collapse')
        .trigger('hidden.bs.collapse');
    }

    if (!$.support.transition) return complete.call(this);

    this.$element
      [dimension](0)
      .one('bsTransitionEnd', $.proxy(complete, this))
      .emulateTransitionEnd(Collapse.TRANSITION_DURATION);
  };

  Collapse.prototype.toggle = function () {
    this[this.$element.hasClass('in') ? 'hide' : 'show']();
  };

  // 不只返回parent，还添加了Aria相关和collapsed类
  /* jshint ignore:start */
  Collapse.prototype.getParent = function () {
    return $(this.options.parent)
      .find('[data-toggle="collapse"][data-parent="' + this.options.parent + '"]')
      .each($.proxy(function (i, element) {
        var $element = $(element);
        this.addAriaAndCollapsedClass(getTargetFromTrigger($element), $element);
      }, this))
      .end(); // 回到find之前的集合，即parent
  };
  /* jshint ignore:end */

  Collapse.prototype.addAriaAndCollapsedClass = function ($element, $trigger) {
    var isOpen = $element.hasClass('in');

    $element.attr('aria-expanded', isOpen);
    $trigger
      .toggleClass('collapsed', !isOpen)
      .attr('aria-expanded', isOpen);
  };

  function getTargetFromTrigger ($trigger) {
    var href;
    var target = $trigger.attr('data-target')
      || (href = $trigger.attr('href')) && href.replace(/.*(?=#[^\s]+$)/, ''); // strip for ie7
    return $(target);
  }

  // Plugin
  // ===================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this);
      var data = $this.data('bs.collapse');
      var options = $.extend({}, Collapse.DEFAULTS, $this.data(), typeof option == 'object' && option);

      if (!data && options.toggle && /show|hide/.test(option)) options.toggle = false;
      if (!data) $this.data('bs.collapse', (data = new Collapse(this, options)));
      if (typeof option == 'string') data[option]();
    });
  }

  var old = $.fn.collapse;

  $.fn.collapse = Plugin;
  $.fn.collapse.Constructor = Collapse;

  $.fn.collapse.noConflict = function () {
    $.fn.collapse = old;
    return this;
  };

  // Data-api
  // ====================

  $(document).on('click.bs.collapse.data-api', '[data-toggle="collapse"]', function (e) {
    var $this = $(this);

    // trigger可以是具有href属性的a元素或具有data-target属性的button
    // a元素，阻止默认行为
    if (!$this.attr('data-target')) e.preventDefault();

    var $target = getTargetFromTrigger($this);
    var data = $target.data('bs.collapse');
    var option = data ? 'toggle' : $this.data();

    Plugin.call($target, option);
  });
}(jQuery);

// Affix
// 模拟position:sticky;效果

+function ($) {
  'use strict';

  // AFFIX CLASS DEFINITION
  // ======================

  var Affix = function (element, options) {
    this.options = $.extend({}, Affix.DEFAULTS, options)

    this.$target = $(this.options.target)
      .on('scroll.bs.affix.data-api', $.proxy(this.checkPosition, this))
      // 文档被点击时，可能有ui的重新渲染，使用一个定时器，等ui渲染完毕后再做检查
      .on('click.bs.affix.data-api', $.proxy(this.checkPositionWithEventLoop, this))

    this.$element = $(element)
    this.affixed = null
    this.unpin = null
    this.pinnedOffset = null

    this.checkPosition()
  }

  Affix.VERSION = '3.3.7'

  Affix.RESET = 'affix affix-top affix-bottom'

  Affix.DEFAULTS = {
    offset: 0,
    target: window
  }

  /**
   * 获取当前的状态
   *
   * @param {Number} scrollHeight 目标的总高度
   * @param {Number} height 自身的高度
   * @param {Number} offsetTop: 用户指定的阈值,option.offset.top
   * @param {Number} offsetBottom: option.offset.bottom
   * @return {String|Boolean} 'top' 还没滑动到affix位置
             'bottom' 滑过了固定位置，回到文档中
             false 被固定状态
   */
  Affix.prototype.getState = function (scrollHeight, height, offsetTop, offsetBottom) {
    // 目标元素下滑的距离
    var scrollTop = this.$target.scrollTop()
    // 自身距文档顶部的偏移
    var position = this.$element.offset()
    var targetHeight = this.$target.height()

    // 之前还没固定，检查下是不是该固定了：如果目标元素没有下滑到offsetTop阈值，
    // 还是不固定，否则进入固定状态
    if (offsetTop != null && this.affixed == 'top') return scrollTop < offsetTop ? 'top' : false

    // 之前滑过了固定位置，检查下是不是该固定了：条件好复杂...
    if (this.affixed == 'bottom') {
      // this.unpin记录了元素affix时到视口顶部的距离
      if (offsetTop != null) return (scrollTop + this.unpin <= position.top) ? false : 'bottom'
      // 目标滑动高度+显示高度小于总高度-滑过的阈值的话，还是处于固定状态
      return (scrollTop + targetHeight <= scrollHeight - offsetBottom) ? false : 'bottom'
    }

    // 还有初始化的情况
    var initializing = this.affixed == null
    var colliderTop = initializing ? scrollTop : position.top
    var colliderHeight = initializing ? targetHeight : height

    if (offsetTop != null && scrollTop <= offsetTop) return 'top'
    if (offsetBottom != null && (colliderTop + colliderHeight >= scrollHeight - offsetBottom)) return 'bottom'

    return false
  }

  /**
   * 获取当固定时距离视口顶部的距离
   */
  Affix.prototype.getPinnedOffset = function () {
    // 之前计算过的缓存在pinnedOffset中
    if (this.pinnedOffset) return this.pinnedOffset;
    // 否则就是第一次从affix进入affix-bottom状态
    // 设置.affix，应该是确保position.top和scrollTop的值的确是affix状态下的值
    this.$element.removeClass(Affix.RESET).addClass('affix')
    // 然后计算affix时元素到视口顶部的距离，存入pinnedOffset
    var scrollTop = this.$target.scrollTop()
    var position = this.$element.offset()
    return (this.pinnedOffset = position.top - scrollTop)
  }

  Affix.prototype.checkPositionWithEventLoop = function () {
    setTimeout($.proxy(this.checkPosition, this), 1)
  }

  Affix.prototype.checkPosition = function () {
    if (!this.$element.is(':visible')) return

    var height = this.$element.height()
    var offset = this.options.offset
    var offsetTop = offset.top
    var offsetBottom = offset.bottom
    var scrollHeight = Math.max($(document).height(), $(document.body).height())

    if (typeof offset != 'object') offsetBottom = offsetTop = offset
    if (typeof offsetTop == 'function') offsetTop = offset.top(this.$element)
    if (typeof offsetBottom == 'function') offsetBottom = offset.bottom(this.$element)

    var affix = this.getState(scrollHeight, height, offsetTop, offsetBottom)

    // 状态需要改变
    if (this.affixed != affix) {
      // 固定状态，top恢复默认值(css中指定的position:fixed时top的值)
      if (this.unpin != null) this.$element.css('top', '')

      // 触发affix.bs.affix,affix-top.bs.affix或affix-bottom.bs.affix事件
      var affixType = 'affix' + (affix ? '-' + affix : '')
      var e = $.Event(affixType + '.bs.affix')

      this.$element.trigger(e)

      if (e.isDefaultPrevented()) return

      this.affixed = affix
      this.unpin = affix == 'bottom' ? this.getPinnedOffset() : null

      // 根据状态相应修改css类，触发完成事件
      this.$element
        .removeClass(Affix.RESET)
        .addClass(affixType)
        .trigger(affixType.replace('affix', 'affixed') + '.bs.affix')
    }

    // 滑过状态下，设定元素放置的位置：目标总高度-元素高度-滑过的阈值
    if (affix == 'bottom') {
      this.$element.offset({
        top: scrollHeight - height - offsetBottom
      })
    }
  }

  // AFFIX PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data = $this.data('bs.affix')
      var options = typeof option == 'object' && option

      if (!data) $this.data('bs.affix', (data = new Affix(this, options)))
      if (typeof option == 'string') data[option]
    })
  }

  var old = $.fn.affix

  $.fn.affix = Plugin
  $.fn.affix.Constructor = Affix

  $.fn.affix.noConflict = function () {
    $.fn.affix = old
    return this
  }

  // AFFIX DATA-API
  // ==============

  $(window).on('load', function () {
    $('[data-spy="affix"]').each(function () {
      var $spy = $(this)
      var data = $spy.data()

      data.offset = data.offset || {}

      if (data.offsetBottom != null) data.offset.bottom = data.offsetBottom
      if (data.offsetTop != null) data.offset.top = data.offsetTop

      Plugin.call($spy, data)
    })
  })

}(jQuery);
