/*!
 * Spec unit testing library
 * http://github.com/kitgoncharov/Spec
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
    if (left === right) return left !== 0 || 1 / left == 1 / right;
    // A strict comparison is necessary because `null == undefined`.
    if (left == null) return left === right;
    // Compare `[[Class]]` names (see the ECMAScript 5 spec, section 15.2.4.2).
    if ((className = toString.call(left)) != toString.call(right)) return false;
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
        return left != left ? right != right : left === right;
      // Compare regular expressions.
      case '[object RegExp]':
        return left.source == right.source && left.global == right.global && left.multiline == right.multiline && left.ignoreCase == right.ignoreCase;
      // Compare functions.
      case '[object Function]':
        return left == right;
      case '[object Array]':
        // Compare lengths to determine if a deep comparison is necessary.
        if (left.length != right.length) return false;
    }
    // Recursively compare objects and arrays.
    if (typeof left == 'object') {
      // Ensure that the object has not already been traversed and compared.
      size = stack.length;
      // Assume equality for cyclic structures.
      while (size--) if (stack[size] == left) return true;
      // Add the object to the stack of traversed objects.
      stack.push(left);
      result = true;
      size = sizeRight = 0;
      for (key in left) {
        // Count the expected number of properties.
        size++;
        // Deep compare each member.
        if (!(result = key in right && eq(left[key], right[key], stack))) break;
      }
      // Ensure that the objects have the same number of properties.
      if (result) {
        for (key in right) {
          // Break as soon as the expected number of properties is greater.
          if (++sizeRight > size) break;
        }
        result = size == sizeRight;
      }
      // Remove the object from the stack once the deep comparison is complete.
      stack.pop();
      return result;
    }
    return false;
  };

  // The current version of Spec. Keep in sync with `package.json`.
  Spec.version = '0.9.9';

  // Custom Events
  // -------------

  // Methods for adding, removing, and firing custom events. You can `bind` and
  // `unbind` event handlers; `trigger`-ing an event executes its handlers in
  // succession.
  Spec.Events = function() {
    this.events = {};
  };

  // Binds an event handler. The `callback` function will be invoked each time
  // the `event`, specified by a string identifier, is fired.
  Spec.Events.prototype.bind = function(event, callback) {
    // Create the event registry if it doesn't exist.
    var callbacks;
    if (event != null && typeof callback == 'function') {
      if (!(callbacks = this.events[event])) {
        // Single-handler event; avoid creating a handler registry.
        this.events[event] = callback;
      } else if (callbacks && typeof callbacks.push == 'function') {
        // Multiple-handler event; add the handler to the registry.
        callbacks.push(callback);
      } else {
        // Convert a single-handler event into a multiple-handler event.
        this.events[event] = [callbacks, callback];
      }
    }
    return this;
  };

  // Removes a previously-bound event handler. If the `callback` function is
  // omitted, all handlers for the `event` are removed. If both the event and
  // handler are omitted, *all* event handlers are removed.
  Spec.Events.prototype.unbind = function(event, callback) {
    var callbacks, length;
    if (event == null && callback == null) {
      // Clear the event registry.
      this.events = {};
    } else if (event != null && (callbacks = this.events[event])) {
      // Omitted handler or single-handler event.
      if (callback == null || typeof callbacks == 'function' && callbacks == callback) {
        delete this.events[event];
      } else {
        // Remove the handler from the event handler registry.
        length = callbacks.length;
        while (length--) if (callbacks[length] == callback) callbacks.splice(length, 1);
        // Remove empty handler registries.
        if (!callbacks.length) delete this.events[event];
      }
    }
    return this;
  };

  // Triggers an event, firing all bound event handlers. The `event` may be
  // either a string identifier or an object with a `type` property.
  Spec.Events.prototype.trigger = function(event) {
    var callbacks, callback, index, length;
    if (event != null && this.events) {
      // Convert a string identifier to an event object.
      if (typeof event != 'object') event = {
        'type': event
      };
      if ('type' in event && (callbacks = this.events[event.type])) {
        if (!event.target) event.target = this;
        if (typeof callbacks == 'function') {
          // Trigger a single-handler event.
          callbacks.call(this, event);
        } else {
          // Clone the handler registry before triggering any handlers.
          callbacks = slice.call(callbacks, 0);
          // Trigger each event handler.
          for (index = 0, length = callbacks.length; index < length; index++) if (typeof (callback = index in callbacks && callbacks[index]) == 'function') callback.call(this, event);
        }
      }
    }
    return this;
  };

  // Specs
  // -----

  // Add support for custom events.
  Spec.prototype = new Spec.Events();

  // Creates a new spec. The `name` is optional.
  (Spec.prototype.constructor = function(name) {
    Spec.Events.call(this);
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
      if (test && typeof (method = test[name]) == 'function') method.apply(test, parameters);
    }
    return this;
  };

  // Successively runs all tests in the spec.
  Spec.prototype.run = function() {
    var spec = this, index, length, onSetup, onAssertion, onFailure, onTeardown;
    if (!spec.active) {
      // Avoid race conditions caused by multiple invocations.
      spec.active = true;
      // Create the aggregate spec summary.
      index = spec.assertions = spec.failures = 0;
      length = spec.length;
      // Triggered at the start of each test.
      onSetup = function(event) {
        // Bind the helper event handlers and trigger the spec's `setup` event.
        event.target.bind('teardown', onTeardown).bind('assertion', onAssertion).bind('failure', onFailure).unbind('setup', onSetup);
        spec.trigger(event);
      };
      // Triggered when an assertion (`ok`, `equal`, etc.) succeeds.
      onAssertion = function(event) {
        spec.assertions++;
        spec.trigger(event);
      };
      // Triggered when an assertion fails.
      onFailure = function(event) {
        spec.failures++;
        spec.trigger(event);
      };
      // Triggered at the end of each test.
      onTeardown = function(event) {
        // Unbind the helper event handlers.
        event.target.unbind('teardown', onTeardown).unbind('assertion', onAssertion).unbind('failure', onFailure);
        spec.trigger(event);
        if (++index < length && index in spec) {
          // Run the next test.
          spec[index].run();
        } else {
          // Finish running the spec.
          spec.active = false;
          spec.trigger('complete');
        }
      };
      // Bind the `onSetup` event handler and begin running the tests.
      spec.invoke('bind', 'setup', onSetup).trigger('start')[index].run();
    }
    return spec;
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
    Spec.Events.call(this);
    this.name = name != null ? name : 'Anonymous Test';
    this.test = typeof test == 'function' ? test : null;
  };

  // Add support for custom events.
  Spec.Test.prototype = new Spec.Events();
  Spec.Test.prototype.constructor = Spec.Test;

  // Runs the test.
  Spec.Test.prototype.run = function() {
    if (!this.active) {
      // Avoid race conditions.
      this.active = true;
      this.assertions = this.failures = 0;
      this.trigger('setup');
      if (typeof this.test == 'function') {
        // Pass the wrapper as the first argument to the test function.
        this.test(this);
      } else {
        // Invalid test function; skip running the test.
        this.done();
      }
    }
    return this;
  };

  // Records an assertion and triggers the `assertion` event. The event object
  // passed to each event handler contains three additional properties:
  // `actual` is the actual value passed to the assertion, `expected` is the
  // expected value, and `message` is the assertion message.
  Spec.Test.prototype.assert = function(actual, expected, message) {
    // Only record the assertion if the test is running.
    if (this.active) {
      this.assertions++;
      this.trigger({
        'type': 'assertion',
        'actual': actual,
        'expected': expected,
        'message': message
      });
    }
    return this;
  };

  // The opposite of `.assert()`; records a failure and triggers the `failure`
  // event.
  Spec.Test.prototype.fail = function(actual, expected, message) {
    // Only record the failure if the test is running.
    if (this.active) {
      this.failures++;
      return this.trigger({
        'type': 'failure',
        'actual': actual,
        'expected': expected,
        'message': message
      });
    }
  };

  // Tests whether `value` is truthy. To test strictly for the boolean `true`,
  // use `.equal()` instead. The optional assertion `message` is passed to each
  // event handler, and defaults to the name of the assertion (e.g., `ok`).
  Spec.Test.prototype.ok = function(value, message) {
    return this[value ? 'assert' : 'fail'](value, true, message != null ? message : 'ok');
  };

  // Tests whether `actual` is *identical* to `expected`, as determined by the
  // `===` operator.
  Spec.Test.prototype.equal = function(actual, expected, message) {
    return this[actual === expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'equal');
  };

  // Tests for *strict* inequality (`actual !== expected`).
  Spec.Test.prototype.notEqual = function(actual, expected, message) {
    return this[actual !== expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'notEqual');
  };

  // Tests for *loose* or coercive equality (`actual == expected`).
  Spec.Test.prototype.looseEqual = function(actual, expected, message) {
    return this[actual == expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'looseEqual');
  };

  // Tests for *loose* inequality (`actual != expected`).
  Spec.Test.prototype.notLooseEqual = function(actual, expected, message) {
    return this[actual != expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'notLooseEqual');
  };

  // Tests for deep equality and equivalence, as determined by the result of
  // the `eq()` function.
  Spec.Test.prototype.deepEqual = function(actual, expected, message) {
    return this[eq(actual, expected, []) ? 'assert' : 'fail'](actual, expected, message != null ? message : 'deepEqual');
  };

  // Tests for deep inequality.
  Spec.Test.prototype.notDeepEqual = function(actual, expected, message) {
    return this[eq(actual, expected, []) ? 'fail' : 'assert'](actual, expected, message != null ? message : 'notDeepEqual');
  };

  // Tests whether the function `block` throws an error. Both `expected` and
  // `message` are optional; if `expected` is neither a validation function nor
  // a RegExp and the `message` is omitted, the value of `expected` is used as
  // the message.
  Spec.Test.prototype.raises = function(block, expected, message) {
    var ok = false, isFunction = typeof expected == 'function', isRegExp = expected && toString.call(expected) == '[object RegExp]';
    // The message was passed as the second argument.
    if (!isFunction && !isRegExp && message == null) {
      message = expected;
      expected = null;
    }
    if (typeof block == 'function') {
      try {
        block();
      } catch (error) {
        ok = expected == null;
        if (isRegExp) {
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
    if (this.active) {
      // Avoid race conditions.
      this.active = false;
      // Verify that the expected number of assertions were executed.
      if (typeof assertions == 'number' && assertions > -1 && (assertions = Math.ceil(assertions)) != this.assertions) this.fail(this.assertions, assertions, 'done');
      this.trigger('teardown');
    }
    return this;
  };
}).call(typeof exports == 'object' && exports || this);