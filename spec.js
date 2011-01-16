/*!
 * Spec unit testing library
 * http://github.com/kitgoncharov/spec
 *
 * Copyright 2011, Kit Goncharov
 * http://kitgoncharov.github.com
 *
 * Released under the MIT License.
*/

(function() {
  // Initial Setup
  // -------------

  // Convenience aliases.
  var toString = Object.prototype.toString, slice = Array.prototype.slice,

  // Creates a new spec, or collection of related unit tests.
  Spec = this.Spec = function(name) {
    return new Spec.prototype.constructor(name);
  },

  // Internal method; recursively compares two objects.
  eq = function(left, right, stack) {
    // Based on work by Jeremy Ashkenas, Philippe Rathe, and Mark Miller.
    var className, key, size, sizeRight, result;
    // Identical objects and values. `0 === -0`, but they aren't equal.
    if (left === right) {
      return left !== 0 || 1 / left === 1 / right;
    }
    // `null` and `undefined` values.
    if (left == null) {
      // A strict comparison is necessary because `null == undefined`.
      return left === right;
    }
    // Compare `[[Class]]` names (see the ECMAScript 5 spec, section 15.2.4.2).
    if ((className = toString.call(left)) != toString.call(right)) {
      return false;
    }
    switch (className) {
      // Compare strings, numbers, dates, and booleans by value.
      case '[object String]':
      case '[object Number]':
      case '[object Date]':
      case '[object Boolean]':
        // Primitives and their corresponding object wrappers are equal.
        left = left.valueOf();
        right = right.valueOf();
        // `NaN`s are non-reflexive.
        return left !== left ? right !== right : left === right;
      // Compare regular expressions.
      case '[object RegExp]':
        return left.source === right.source && left.global === right.global &&
        // The sticky (`y`) flag is Firefox-specific.
        left.ignoreCase === right.ignoreCase && left.sticky === right.sticky &&
        left.multiline === right.multiline;
      // Compare functions.
      case '[object Function]':
        return left === right;
      case '[object Array]':
        // Compare lengths to determine if a deep comparison is necessary.
        if (left.length !== right.length) {
          return false;
        }
    }
    // Recursively compare objects and arrays.
    if (typeof left == 'object') {
      // Ensure that the object has not already been traversed and compared.
      size = stack.length;
      while (size--) {
        if (stack[size] === left) {
          // Cyclic structure; assume equality.
          return true;
        }
      }
      // Add the object to the stack of traversed objects.
      stack.push(left);
      result = true;
      size = sizeRight = 0;
      for (key in left) {
        // Count the expected number of properties.
        size++;
        // Deep compare each member.
        if (!(result = key in right && eq(left[key], right[key], stack))) {
          break;
        }
      }
      // Ensure that the objects have the same number of properties.
      if (result) {
        for (key in right) {
          if (++sizeRight > size) {
            // Break as soon as the expected number of properties is greater.
            break;
          }
        }
        result = size === sizeRight;
      }
      // Remove the object from the stack once the deep comparison is complete.
      stack.pop();
      return result;
    }
    return false;
  };

  // The current version of Spec. Keep in sync with `package.json`.
  Spec.version = '0.9.8';

  // Custom Events
  // -------------

  // `Spec.Events` is module that provides methods for adding, removing, and
  // firing custom events. You can `bind` or `unbind` event handlers;
  // `trigger`ing an event executes its handlers in succession. All specs and
  // tests inherit from this module.
  Spec.Events = function() {};

  // Binds an event handler. The `handler` function will be invoked each time
  // the `event`, specified by a string identifier, is fired.
  Spec.Events.prototype.bind = function(event, handler) {
    // Create the event registry if it doesn't exist.
    var events = this.events || (this.events = {}), handlers;
    if (event != null && typeof handler == 'function') {
      if (!(handlers = events[event])) {
        // Single-handler event; avoid creating a handler registry.
        events[event] = handler;
      } else if (handlers && typeof handlers.push == 'function') {
        // Multiple-handler event; add the handler to the registry.
        handlers.push(handler);
      } else {
        // Convert a single-handler event into a multiple-handler event.
        events[event] = [handlers, handler];
      }
    }
    return this;
  };

  // Binds a one-time event handler. The `handler` function is invoked and
  // immediately removed when the `event` is fired.
  Spec.Events.prototype.one = function(event, handler) {
    var target = this, onTrigger;
    if (event != null && typeof handler == 'function') {
      // Create and bind a proxy event handler.
      onTrigger = function() {
        // Remove the proxy and trigger the original handler.
        target.unbind(event, onTrigger);
        handler.apply(this, arguments);
      };
      target.bind(event, onTrigger);
    }
    return target;
  };

  // Removes a previously-bound event handler. If the `handler` function is
  // omitted, all handlers for the `event` are removed. If both the event and
  // handler are omitted, *all* event handlers are removed.
  Spec.Events.prototype.unbind = function(event, handler) {
    var events = this.events, handlers, length;
    if (event == null && handler === event || !events) {
      // Create or clear the event registry.
      this.events = {};
    } else if (event != null && (handlers = events[event])) {
      // Omitted handler or single-handler event.
      if (handler == null || typeof handlers == 'function' &&
      handlers === handler) {
        delete events[event];
      } else {
        // Remove the handler from the event handler registry.
        length = handlers.length;
        while (length--) {
          if (handlers[length] === handler) {
            handlers.splice(length, 1);
          }
        }
        // Remove empty handler registries.
        if (!handlers.length) {
          delete events[event];
        }
      }
    }
    return this;
  };

  // Triggers an event, firing all bound event handlers. Subsequent arguments
  // are passed to each handler.
  Spec.Events.prototype.trigger = function(event) {
    var events = this.events, handlers, handler, index, length, parameters;
    if (event != null && events && (handlers = events[event])) {
      if (typeof handlers == 'function') {
        // Optimize for 3 or fewer arguments. Based on work by Jeremy Martin.
        switch (arguments.length) {
          case 1:
            handlers.call(this, this);
            break;
          case 2:
            handlers.call(this, arguments[1], this);
            break;
          case 3:
            handlers.call(this, arguments[1], arguments[2], this);
            break;
          default:
            // Pass the event target as the last argument to the handler.
            (parameters = slice.call(arguments, 1)).push(this);
            handlers.apply(this, parameters);
        }
      } else {
        if (arguments.length > 1) {
          (parameters = slice.call(arguments, 1)).push(this);
        }
        // Clone the handler registry before executing any handlers.
        handlers = slice.call(handlers, 0);
        for (index = 0, length = handlers.length; index < length; index++) {
          // Execute each event handler.
          handler = index in handlers && handlers[index];
          if (typeof handler == 'function') {
            if (parameters) {
              handler.apply(this, parameters);
            } else {
              handler.call(this, this);
            }
          }
        }
      }
    }
    return this;
  };

  // Specs
  // -----

  // Mix in the custom events module.
  Spec.prototype = new Spec.Events();

  // Creates a new spec. The `name` is optional.
  (Spec.prototype.constructor = function(name) {
    this.name = name != null ? name : 'Anonymous Spec';
    this.length = 0;
  }).prototype = Spec.prototype;

  // Adds a new `test` function to the spec. The `name` is optional.
  Spec.prototype.test = function(name, test) {
    this[this.length++] = new Spec.Test(name, test);
    return this;
  };

  // Invokes the method `name` for each test in the spec. Subsequent arguments
  // are passed to the invoked method.
  Spec.prototype.invoke = function(name) {
    var parameters = slice.call(arguments, 1), index, length, test, method;
    for (index = 0, length = this.length; index < length; index++) {
      test = index in this && this[index];
      if (test && typeof (method = test[name]) == 'function') {
        method.apply(test, parameters);
      }
    }
    return this;
  };

  // Successively runs all tests in the spec.
  Spec.prototype.run = function() {
    var spec = this, index, length, onSetup, onAssertion, onFailure,
    onError, onTeardown;
    if (!spec.isRunning) {
      // Avoid race conditions caused by multiple invocations.
      spec.isRunning = true;
      // Create the aggregate spec summary.
      index = spec.assertions = spec.failures = spec.errors = 0;
      length = spec.length;
      // Triggered at the start of each test.
      onSetup = function(test) {
        // Bind the helper event handlers and trigger the spec's `setup` event.
        test.bind('assertion', onAssertion).bind('failure', onFailure).bind(
          'error', onError).one('teardown', onTeardown);
        spec.trigger('setup', test);
      };
      // Triggered when an assertion (`ok`, `equal`, etc.) succeeds.
      onAssertion = function(assertion, test) {
        spec.assertions++;
        spec.trigger('assertion', assertion, test);
      };
      // Triggered when an assertion fails.
      onFailure = function(failure, test) {
        spec.failures++;
        spec.trigger('failure', failure, test);
      };
      // Triggered when a test throws an error.
      onError = function(error, test) {
        spec.errors++;
        spec.trigger('error', error, test);
      };
      // Triggered at the end of each test.
      onTeardown = function(test) {
        // Unbind the helper event handlers.
        test.unbind('assertion', onAssertion).unbind('failure',
          onFailure).unbind('error', onError);
        spec.trigger('teardown', test);
        if (++index < length && index in spec) {
          // Run the next test.
          spec[index].run();
        } else {
          // Finish running the spec.
          spec.isRunning = false;
          spec.trigger('complete');
        }
      };
      // Bind the `onSetup` event handler and begin running the tests.
      spec.invoke('one', 'setup', onSetup).trigger('start')[index].run();
    }
    return this;
  };

  // Tests
  // -----

  // Wraps a `test` function with several convenience methods and assertions.
  // The `name` is optional.
  Spec.Test = function(name, test) {
    if (typeof name == 'function' && test == null) {
      test = name;
      name = null;
    }
    this.name = name != null ? name : 'Anonymous Test';
    this.test = typeof test == 'function' ? test : null;
  };

  // Mix in the custom events module.
  Spec.Test.prototype = new Spec.Events();
  Spec.Test.prototype.constructor = Spec.Test;

  // Runs the test.
  Spec.Test.prototype.run = function() {
    var ok;
    if (!this.isRunning) {
      this.isRunning = true;
      this.assertions = this.failures = this.errors = 0;
      this.trigger('setup');
      try {
        if ((ok = typeof this.test == 'function')) {
          // Pass the wrapper as the first argument to the test function.
          this.test(this);
        }
      } catch (error) {
        this.errors++;
        this.trigger('error', error);
        ok = false;
      }
      if (!ok) {
        // Finish running the test.
        this.done();
      }
    }
    return this;
  };

  // Records an assertion and triggers the `assertion` event. The first
  // argument passed to each event handler is an object containing three
  // properties: `actual` is the actual value passed to the assertion,
  // `expected` is the expected value, and `message` is the assertion message.
  Spec.Test.prototype.assert = function(actual, expected, message) {
    this.assertions++;
    return this.trigger('assertion', {
      'actual': actual,
      'expected': expected,
      'message': message
    });
  };

  // The opposite of `.assert()`; records a failure and triggers the `failure`
  // event.
  Spec.Test.prototype.fail = function(actual, expected, message) {
    this.failures++;
    return this.trigger('failure', {
      'actual': actual,
      'expected': expected,
      'message': message
    });
  };

  // Tests whether `value` is truthy. To test strictly for the boolean `true`,
  // use `.equal()` instead. The optional assertion `message` is passed to each
  // event handler, and defaults to the name of the assertion (e.g., `ok`).
  Spec.Test.prototype.ok = function(value, message) {
    return this[value ? 'assert' : 'fail'](value, true, message != null ?
      message : 'ok');
  };

  // Tests whether `actual` is *identical* to `expected`, as determined by the
  // `===` operator.
  Spec.Test.prototype.equal = function(actual, expected, message) {
    return this[actual === expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'equal');
  };

  // Tests for *strict* inequality (`actual !== expected`).
  Spec.Test.prototype.notEqual = function(actual, expected, message) {
    return this[actual !== expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'notEqual');
  };

  // Tests for *loose* or coercive equality (`actual == expected`).
  Spec.Test.prototype.looseEqual = function(actual, expected, message) {
    return this[actual == expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'looseEqual');
  };

  // Tests for *loose* inequality (`actual != expected`).
  Spec.Test.prototype.notLooseEqual = function(actual, expected, message) {
    return this[actual != expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'notLooseEqual');
  };

  // Tests for deep equality and equivalence, as determined by the result of
  // the `eq()` function.
  Spec.Test.prototype.deepEqual = function(actual, expected, message) {
    return this[eq(actual, expected, []) ? 'assert' : 'fail'](actual,
      expected, message != null ? message : 'deepEqual');
  };

  // Tests for deep inequality.
  Spec.Test.prototype.notDeepEqual = function(actual, expected, message) {
    return this[eq(actual, expected, []) ? 'fail' : 'assert'](actual,
      expected, message != null ? message : 'notDeepEqual');
  };

  // Tests whether the function `block` throws an error. Both `expected` and
  // `message` are optional; if `expected` is neither a validation function nor
  // a RegExp and the `message` is omitted, the value of `expected` is used as
  // the message.
  Spec.Test.prototype.raises = function(block, expected, message) {
    var ok = false, isFunction = typeof expected == 'function',
    isRegExp = expected && toString.call(expected) == '[object RegExp]';
    if (!(isFunction || isRegExp) && message == null) {
      // The message was passed as the second argument.
      message = expected;
      expected = null;
    }
    if (typeof block == 'function') {
      try {
        block();
      } catch (error) {
        if (expected == null) {
          ok = true;
        } else if (isRegExp) {
          ok = expected.test(error);
        } else if (isFunction) {
          // Pass the error as the first argument to the validation function.
          ok = expected.call(this, error, this);
        }
      }
    }
    return this.ok(ok, message != null ? message : 'raises');
  };

  // Completes a test with an optional expected number of `assertions`. This
  // method *must* be called at the end of each test.
  Spec.Test.prototype.done = function(assertions) {
    if (typeof assertions == 'number' && assertions > -1) {
      assertions = Math.ceil(assertions);
      // Verify that the expected number of assertions were executed.
      if (assertions !== this.assertions) {
        this.fail(this.assertions, assertions, 'done');
      }
    }
    this.isRunning = false;
    return this.trigger('teardown');
  };
}).call(typeof exports == 'object' && exports || this);