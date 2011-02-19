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
  var toString = {}.toString, slice = [].slice,

  // Creates a new spec. The spec `name` is optional.
  Spec = this.Spec = function(name) {
    this.name = typeof name == 'string' && name || 'Anonymous Spec';
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
        // Primitives and their corresponding object wrappers are equal.
        return left + '' == right + '';
      case '[object Number]':
      case '[object Date]':
      case '[object Boolean]':
        left = +left;
        right = +right;
        // `NaN`s are non-reflexive.
        return left != left ? right != right : left == right;
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
      // Ensure that both objects have the same number of properties.
      if (result) {
        // Break as soon as the expected number of properties is greater.
        for (key in right) if (++sizeRight > size) break;
        result = size == sizeRight;
      }
      // Remove the object from the stack once the deep comparison is complete.
      stack.pop();
      return result;
    }
    return false;
  };

  // The current version of Spec. Keep in sync with `package.json`.
  Spec.version = '1.0.0rc1';

  // Specs
  // -----

  Spec.prototype = {
    'constructor': Spec,

    // Adds a new `test` function to the spec. The test `name` is optional.
    'add': function(name, test) {
      this.push(new Spec.Test(name, test));
      return this;
    },

    // Array methods.
    'pop': [].pop,
    'push': [].push,
    'reverse': [].reverse,
    'shift': [].shift,
    'sort': [].sort,
    'unshift': [].unshift,

    // Successively runs each test in the spec.
    'run': function() {
      var spec = this, onTestEvent, index, length;
      // Create the aggregate spec summary.
      spec.assertions = spec.failures = spec.errors = 0;
      // Internal method called every time a test triggers an event.
      onTestEvent = function(event) {
        var test = event.target, type = event.type;
        // Proxy the triggered event.
        spec.trigger(event);
        if (type == 'teardown') {
          // Update the spec summary.
          spec.assertions += test.assertions;
          spec.failures += test.failures;
          spec.errors += test.errors;
          // Unbind the helper event listener.
          test.unbind('all', onTestEvent);
          // Remove the completed test and run the next test.
          if ((test = spec.shift()) && typeof test.run == 'function') {
            test.run();
          } else {
            // Ensure that the spec is empty.
            if (!spec.length) delete spec[0];
            // Finish running the spec.
            spec.trigger('complete');
          }
        }
      };
      // Bind the helper event listener and run the tests.
      for (index = 0, length = spec.length; index < length; index++) spec[index].bind('all', onTestEvent);
      spec.trigger('start').shift().run();
      return spec;
    }
  };

  // Tests
  // -----

  // Wraps a `test` function with several convenience methods and assertions. The
  // test `name` is optional.
  Spec.Test = function(name, test) {
    if (typeof name == 'function' && test == null) {
      test = name;
    } else {
      this.name = typeof name == 'string' && name || 'Anonymous Test';
    }
    this.test = typeof test == 'function' ? test : null;
  };

  Spec.Test.prototype = {
    'constructor': Spec.Test,

    // Runs the test.
    'run': function() {
      var ok = typeof this.test == 'function';
      this.assertions = this.failures = this.errors = 0;
      this.trigger('setup');
      try {
        // Pass the wrapper as the first argument to the test function.
        if (ok) this.test(this);
      } catch (error) {
        ok = false;
        this.errors++;
        this.trigger({
          'type': 'error',
          'error': error
        });
      } finally {
        // Invalid test function or error; finish running the test.
        if (!ok) this.done();
      }
      return this;
    },

    // Records an assertion and triggers the `assertion` event. The event object
    // passed to each listener contains three additional properties: `actual` is
    // the actual value passed to the assertion, `expected` is the expected value,
    // and `message` is the assertion message.
    'assert': function(actual, expected, message) {
      // Only record the assertion if the test is running.
      this.assertions++;
      return this.trigger({
        'type': 'assertion',
        'actual': actual,
        'expected': expected,
        'message': message
      });
    },

    // The opposite of `.assert()`; records a failure and triggers the
    // `failure` event.
    'fail': function(actual, expected, message) {
      this.failures++;
      return this.trigger({
        'type': 'failure',
        'actual': actual,
        'expected': expected,
        'message': message
      });
    },

    // Tests whether `value` is truthy. To test strictly for the boolean `true`,
    // use `.equal()` instead. The optional assertion `message` is passed to each
    // event listener, and defaults to the name of the assertion (e.g., `ok`).
    'ok': function(value, message) {
      return this[value ? 'assert' : 'fail'](value, true, message != null ? message : 'ok');
    },

    // Tests whether `actual` is **identical** to `expected`, as determined by the `===` operator.
    'equal': function(actual, expected, message) {
      return this[actual === expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'equal');
    },

    // Tests for **strict** inequality (`actual !== expected`).
    'notEqual': function(actual, expected, message) {
      return this[actual !== expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'notEqual');
    },

    // Tests for **loose** inequality (`actual != expected`).
    'looseEqual': function(actual, expected, message) {
      return this[actual == expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'looseEqual');
    },

    // Tests for **loose** inequality (`actual != expected`).
    'notLooseEqual': function(actual, expected, message) {
      return this[actual != expected ? 'assert' : 'fail'](actual, expected, message != null ? message : 'notLooseEqual');
    },

    // Tests for deep equality and equivalence, as determined by the `eq()` function.
    'deepEqual': function(actual, expected, message) {
      return this[eq(actual, expected, []) ? 'assert' : 'fail'](actual, expected, message != null ? message : 'deepEqual');
    },

    // Tests for deep inequality.
    'notDeepEqual': function(actual, expected, message) {
      return this[eq(actual, expected, []) ? 'fail' : 'assert'](actual, expected, message != null ? message : 'notDeepEqual');
    },

    // Tests whether the function `block` throws an error. Both `expected` and
    // `message` are optional; if the `message` is omitted and `expected` is not
    // a RegExp or validation function, the value of `expected` is used as the message.
    'raises': function(block, expected, message) {
      var ok = false, isRegExp = expected && toString.call(expected) == '[object RegExp]', isFunction = !isRegExp && typeof expected == 'function';
      // The message was passed as the second argument.
      if (!isFunction && !isRegExp && message == null) {
        message = expected;
        expected = null;
      }
      if (typeof block == 'function') {
        try {
          block();
        } catch (error) {
          if (expected == null || (isRegExp && expected.test(error)) || (isFunction && expected.call(this, error, this))) {
            ok = true;
          } else {
            this.errors++;
            return this.trigger({
              'type': 'error',
              'error': error
            });
          }
        }
      }
      return this.ok(ok, message != null ? message : 'raises');
    },

    // Completes a test with an optional expected number of `assertions`. This
    // method **must** be called at the end of each test.
    'done': function(assertions) {
      // Verify that the expected number of assertions were executed.
      if (typeof assertions == 'number' && assertions > -1 && (assertions = Math.ceil(assertions)) != this.assertions) this.fail(this.assertions, assertions, 'done');
      return this.trigger('teardown');
    }
  };

  // Custom Events
  // -------------

  // Methods for adding, removing, and firing custom events. You can `bind` and
  // `unbind` event listeners; `trigger`-ing an event executes its listeners in
  // succession.

  // Binds an event listener. The `listener` will be invoked each time the event
  // `type`, specified by a string identifier, is fired. Listeners bound to the `all`
  // event will be invoked when *any* event is triggered; listeners bound to the
  // `error` event will be invoked when a triggered listener throws an error.
  Spec.prototype.bind = Spec.Test.prototype.bind = function(type, listener) {
    // Create the event registry if it doesn't exist.
    var events = typeof this.events == 'object' && this.events || (this.events = {});
    // Add the event listener to the listener registry.
    if (type != null && typeof listener == 'function') (events[type] || (events[type] = [])).push(listener);
    return this;
  };

  // Removes a previously-bound event listener. If the `listener` function is omitted,
  // all listeners for the event `type` will be removed. If both the event and listener
  // are omitted, *all* event listeners will be removed.
  Spec.prototype.unbind = Spec.Test.prototype.unbind = function(type, listener) {
    var events = this.events, listeners, length;
    if (typeof events == 'object' && events) {
      if (type == null && listener == null) {
        // Remove all event listeners.
        this.events = {};
      } else if (type != null && (listeners = events[type]) && (length = listeners.length)) {
        // Remove the listener from the event listener registry.
        while (length--) if (listeners[length] == listener) listeners.splice(length, 1);
        // Remove the listener registry if it is empty or the listener was omitted.
        if (listener == null || !listeners.length) delete events[type];
      }
    }
    return this;
  };

  // Triggers an event, specified by either a string identifier or an event
  // object with a `type` property.
  Spec.prototype.trigger = Spec.Test.prototype.trigger = function(event) {
    var events = this.events, type, listeners, listener, index, length;
    if (event != null && typeof events == 'object' && events) {
      // Convert a string identifier into an event object.
      if (typeof event != 'object') event = {'type': event};
      type = event.type;
      // Capture a reference to the current event target.
      if (!('target' in event)) event.target = this;
      if ((listeners = type != null && type != 'all' && events[type]) && (length = listeners.length)) {
        // Clone the event listener registry.
        listeners = slice.call(listeners, 0);
        // Execute each event listener.
        for (index = 0; index < length; index++) {
          if (typeof (listener = index in listeners && listeners[index]) == 'function') {
            // Wrap each invocation in a `try...catch` statement to ensure that all subsequent listeners are executed.
            try {
              // Prevent subsequent listeners from firing if the listener explicitly returns `false`.
              if (listener.call(this, event) === false) break;
            } catch (error) {
              // Trigger the `error` event if a listener throws an error.
              if (type != 'error' && events.error && events.error.length) this.trigger({
                'type': 'error',
                'error': error
              });
            }
          }
        }
      }
      // Trigger the special `all` event.
      if ((listeners = events.all) && (length = listeners.length)) {
        listeners = slice.call(listeners, 0);
        for (index = 0; index < length; index++) {
          if (typeof (listener = index in listeners && listeners[index]) == 'function') {
            try {
              if (listener.call(this, event) === false) break;
            } catch (error) {
              if (type != 'error' && events.error && events.error.length) this.trigger({
                'type': 'error',
                'error': error
              });
            }
          }
        }
      }
    }
    return this;
  };
}).call(typeof exports == 'object' && exports || this);