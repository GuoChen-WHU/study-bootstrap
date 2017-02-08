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
