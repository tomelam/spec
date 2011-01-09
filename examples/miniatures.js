/* Miniatures JavaScript library
 *
 * Created by Kit Goncharov.
 * http://kitgoncharov.github.com
*/

(function() {
  // Convenience aliases.
  var toString = Object.prototype.toString, compare = function(left, right) {
    left = left.criteria;
    right = right.criteria;
    return left < right ? -1 : left > right ? 1 : 0;
  },

  // The Miniatures library.
  Miniatures = this.Miniatures = {
    'noop': function() {},

    'isFunction': function(value) {
      return value && toString.call(value) === '[object Function]';
    },

    'sortBy': function(value, iterator, context) {
      var results = [], length, element;
      value = Object(value);
      if (!Miniatures.isFunction(iterator)) {
        iterator = Miniatures.noop;
      }
      length = value.length;
      while (length--) {
        element = value[length];
        results[length] = {
          'element': element,
          'criteria': iterator.call(context, element, length, value)
        };
      }
      length = results.sort(compare).length;
      while (length--) {
        results[length] = results[length].element;
      }
      return results;
    },

    'ajax': function(options) {
      var type, url, async, complete, success, error, data, transport, status;
      options = Object(options);

      type = options.type && String(options.type) || 'get';
      if (!(url = options.url && String(options.url))) {
        return false;
      }
      async = 'async' in options ? !!options.async : true;
      complete = Miniatures.isFunction(options.complete) && options.complete;
      success = Miniatures.isFunction(options.success) && options.success;
      error = Miniatures.isFunction(options.error) && options.error;
      data = options.data && String(options.data);

      transport = typeof ActiveXObject !== 'undefined' ? new ActiveXObject(
        'Microsoft.XMLHTTP') : typeof XMLHttpRequest !== 'undefined' ?
        new XMLHttpRequest() : null;
      if (!transport) {
        throw new Error('Ajax requests are not supported.');
      }

      transport.open(type.toLowerCase(), url, async);
      transport.onreadystatechange = function() {
        if (transport.readyState === 4) {
          status = transport.status;
          (((status >= 200 && status < 300 || status === 304) ? success :
            error) || Miniatures.noop).call(transport, transport);
          (complete || Miniatures.noop).call(transport, transport);
          transport.onreadystatechange = Miniatures.noop;
        }
      };
      transport.send(data || null);
      return transport;
    }
  };
}).call(this);
