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
