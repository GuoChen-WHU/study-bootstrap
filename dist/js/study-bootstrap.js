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
    $.support.transition && $parent.hasClass( 'fade' ) ?
      $parent
        // bsTransitionEnd事件发生后，移除元素
        .one( 'bsTransitionEnd', removeElement )
        .emulateTransitionEnd( Alert.TRANSITION_DURATION ) :
      removeElement();
  }

  // Alert插件
  // -----------------
  function Plugin( option ) {
    // 一般是在jquery对象上调这个方法，如$el.alert，所以这个this就是jquery对象
    return this.each( function () {
      // jquery的each方法把this值设成每一个DOM节点
      var $this = $( this );
      // 获取存储的$.bs.alert对象，第一次执行data值为undefined
      var data = $this.data( 'bs.alert' );

      // 创建Alert对象，并赋值给data，存储在元素的jQuery对象上的'bs.alert'字段上
      if ( !data ) $this.data( 'bs.alert', ( data = new Alert( this ) ) );
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

  // 带有[data-dismiss="alert"]属性的元素上面都绑定事件监听函数
  // 带上命名空间bs.alert.data-api的作用？
  $( document ).on( 'click.bs.alert.data-api', dismiss, Alert.prototype.close );

}( jQuery );

