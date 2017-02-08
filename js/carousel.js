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
