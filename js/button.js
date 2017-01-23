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

    if ( data.resetText == null ) $el.data( 'resetText', $el[ val ]() );

    //
    setTimeout( $.proxy( function () {
      $el[ val ]( data[ state ] == null ? this.options[ state ] : data[ state ]);
    }))
  }
}
