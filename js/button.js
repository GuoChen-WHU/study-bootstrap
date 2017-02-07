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
