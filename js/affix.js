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
