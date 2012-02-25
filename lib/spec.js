/*! Spec unit testing library
 * http://github.com/kitcambridge/Spec
 *
 * Copyright 2011-2012, Kit Cambridge
 * http://kitcambridge.github.com
 *
 * Released under the MIT License.
*/

(function() {
  // Specs
  // -----

  // Specs are event-driven collections of related unit tests. Using custom events, you can
  // create routines for setting up and tearing down tests, handling assertions, failures,
  // and errors, and logging test results.

  // Creates a new spec. The `name` is optional.
  function Spec(name) {
    if (typeof name == 'string' && name) this.name = name;
  }

  // The current version of Spec. Keep in sync with `package.json`.
  Spec.version = '1.0.0rc3';

  Spec.prototype.name = 'Anonymous Spec';

  // Adds a new `test` function to the spec. The `name` is optional.
  Spec.prototype.addTest = function(name, test) {
    this.push(new Test(name, test));
    return this;
  };

  // Successively runs each test in the spec.
  Spec.prototype.run = function() {
    // Create the aggregate spec summary.
    var spec = this, index = spec.assertions = spec.failures = spec.errors = 0, length = spec.length, test;
    // Internal callback invoked every time a test emits an event.
    function onEvent(event) {
      var target = event.target;
      // Proxy the emitted event.
      spec.emit(event);
      switch (event.type) {
        // Update the spec summary.
        case 'assertion':
          spec.assertions++;
          break;
        case 'failure':
          spec.failures++;
          break;
        case 'error':
          spec.errors++;
          break;
        case 'teardown':
          // Remove the event callback.
          target.removeListener('all', onEvent);
          // Run the next test.
          if ((target = spec[++index]) instanceof Test) {
            target.on('all', onEvent).run();
          } else {
            // Finish running the spec.
            spec.emit('complete');
          }
      }
    }
    spec.emit('start');
    if (length && (test = spec[index]) instanceof Test) {
      // Begin running the tests.
      test.on('all', onEvent).run();
    } else {
      spec.emit('complete');
    }
    return spec;
  };

  // Array methods.
  Spec.prototype.pop = [].pop;
  Spec.prototype.push = [].push;
  Spec.prototype.reverse = [].reverse;
  Spec.prototype.shift = [].shift;
  Spec.prototype.sort = [].sort;
  Spec.prototype.unshift = [].unshift;

  // Tests
  // -----

  // The internal `eq()` function recursively compares two objects. Based on work by Jeremy
  // Ashkenas, Philippe Rathe, and Mark Miller.
  var getClass = {}.toString;
  function eq(left, right, stack) {
    var className, property, result, size, sizeRight;
    // Identical objects and values. `0 === -0`, but they aren't equal.
    if (left === right) return left != 0 || 1 / left == 1 / right;
    // A strict comparison is necessary because `null == undefined`.
    if (left == null) return left === right;
    // Compare `[[Class]]` names (see the ECMAScript 5 spec, section 15.2.4.2).
    if ((className = getClass.call(left)) != getClass.call(right)) return false;
    switch (className) {
      // Compare strings, numbers, dates, and booleans by value.
      case '[object String]':
        return left + '' == right + '';
      case '[object Number]':
      case '[object Date]':
      case '[object Boolean]':
        // Primitives and their corresponding object wrappers are equal.
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
    }
    // Recursively compare objects and arrays.
    if (typeof left == 'object') {
      // Assume equality for cyclic structures.
      size = stack.length;
      while (size--) if (stack[size] == left) return true;
      // Add the object to the stack of traversed objects.
      stack.push(left);
      result = true;
      size = sizeRight = 0;
      if (className == '[object Array]') {
        // Compare array lengths to determine if a deep comparison is necessary.
        size = left.length;
        result = size == right.length;
        // Deep compare each element.
        if (result) while (size--) if (size in left) if (!(result = size in right && eq(left[size], right[size], stack))) break;
      } else {
        for (property in left) {
          // Count the expected number of properties.
          size++;
          // Deep compare each member.
          if (!(result = property in right && eq(left[property], right[property], stack))) break;
        }
        // Ensure that both objects have the same number of properties.
        if (result) {
          // Break as soon as the expected number of properties is greater.
          for (property in right) if (++sizeRight > size) break;
          result = size == sizeRight;
        }
      }
      // Remove the object from the stack once the comparison is complete.
      stack.pop();
      return result;
    }
    return false;
  }

  // The `Spec.Test` constructor wraps a `test` function with several convenience methods
  // and assertions. The `name` is optional.
  Spec.Test = Test;
  function Test(name, test) {
    if (typeof name == 'function' && test == null) test = name;
    if (typeof name == 'string' && name) this.name = name;
    if (typeof test == 'function') this.test = test;
  }

  Test.prototype.name = 'Anonymous Test';
  Test.prototype.test = null;

  // Runs the test.
  Test.prototype.run = function() {
    var ok = typeof this.test == 'function';
    this.assertions = this.failures = this.errors = 0;
    this.emit('setup');
    try {
      // Pass the wrapper as the first argument to the test function.
      if (ok) this.test(this);
    } catch (error) {
      this.errors++;
      this.emit({
        'type': 'error',
        'error': error
      });
      ok = false;
    } finally {
      // Invalid test function or error; finish running the test.
      if (!ok) this.done();
    }
    return this;
  };

  // Tests whether `expression` is truthy. The `message`, `actual`, and `expected`
  // arguments are optional. `message` specifies the assertion message, and defaults to
  // the name of the current assertion (e.g., `ok`). `actual` and `expected` contain the
  // actual and expected values passed to the assertion, respectively, allowing you to
  // create custom assertions.
  Test.prototype.ok = function(expression, message, actual, expected) {
    var length = arguments.length, event = {
      'actual': length > 2 ? actual : expression,
      'expected': length > 3 ? expected : true,
      'message': typeof message == 'string' && message || 'ok'
    };
    // Note: To test strictly for the boolean value `true`, use `equal()` instead.
    if (expression) {
      this.assertions++;
      event.type = 'assertion';
    } else {
      this.failures++;
      event.type = 'failure';
    }
    return this.emit(event);
  };

  // Tests whether `actual` is **identical** to `expected`, as determined by the `===`
  // operator.
  Test.prototype.equal = function(actual, expected, message) {
    return this.ok(actual === expected, typeof message == 'string' && message || 'equal', actual, expected);
  };

  // Tests for **strict** inequality (`actual !== expected`).
  Test.prototype.notEqual = function(actual, expected, message) {
    return this.ok(actual !== expected, typeof message == 'string' && message || 'notEqual', actual, expected);
  };

  // Tests for loose or **coercive** equality (`actual == expected`).
  Test.prototype.looseEqual = function(actual, expected, message) {
    return this.ok(actual == expected, typeof message == 'string' && message || 'looseEqual', actual, expected);
  };

  // Tests for **loose** inequality (`actual != expected`).
  Test.prototype.notLooseEqual = function(actual, expected, message) {
    return this.ok(actual != expected, typeof message == 'string' && message || 'notLooseEqual', actual, expected);
  };

  // Tests for deep equality and equivalence, as determined by the `eq()` function.
  Test.prototype.deepEqual = function(actual, expected, message) {
    return this.ok(eq(actual, expected, []), typeof message == 'string' && message || 'deepEqual', actual, expected);
  };

  // Tests for deep inequality.
  Test.prototype.notDeepEqual = function(actual, expected, message) {
    return this.ok(!eq(actual, expected, []), typeof message == 'string' && message || 'notDeepEqual', actual, expected);
  };

  // Ensures that the `block` throws an error. Both `expected` and `message` are optional;
  // if the `message` is omitted and `expected` is not a RegExp or validation function,
  // the `expected` value is used as the message.
  Test.prototype.error = function(block, expected, message) {
    var ok = typeof block == 'function', isRegExp = expected && getClass.call(expected) == '[object RegExp]', isFunction = !isRegExp && typeof expected == 'function', actual;
    // The message was passed as the second argument.
    if (!isFunction && !isRegExp && message == null) {
      message = expected;
      expected = null;
    }
    if (ok) {
      try {
        block();
        ok = false;
      } catch (error) {
        actual = error;
        ok = expected == null || (isRegExp && expected.test(actual)) || (isFunction && expected.call(this, actual, this));
      }
    }
    return this.ok(ok, typeof message == 'string' && message || 'error');
  };

  // Ensures that the `block` does not throw any errors.
  Test.prototype.noError = function(block, message) {
    var ok = typeof block == 'function', actual;
    if (ok) {
      try {
        block();
      } catch (error) {
        ok = false;
        actual = error;
      }
    }
    return this.ok(ok, typeof message == 'string' && message || 'noError');
  };

  // Completes a test with an optional expected number of `assertions`. This method
  // **must** be called at the end of each test.
  Test.prototype.done = function(assertions, message) {
    // Verify that the expected number of assertions were executed.
    if (typeof assertions == 'number') this.ok(this.assertions == assertions, typeof message == 'string' && message || 'done', this.assertions, assertions);
    return this.emit('teardown');
  };

  // Custom Events
  // -------------

  // Methods for adding, removing, and firing custom events. You can add and remove
  // callbacks for each event; emitting an event executes its callbacks in succession.
  
  // Registers a `callback` function for an `event`. The `callback` will be invoked
  // whenever the `event`, specified by a string identifier, is emitted. If the `event`
  // is `'all'`, the callback will be invoked for all emitted events; if the `event` is
  // `'error'`, the callback will be invoked whenever an emitted event throws an error.
  Spec.prototype.on = Spec.prototype.addListener = Test.prototype.on = Test.prototype.addListener = function(event, callback) {
    // Create the event registry if it doesn't exist.
    var events = this.events || (this.events = {});
    // Add the callback to the callback registry.
    if (typeof event == 'string' && typeof callback == 'function') (events[event] || (events[event] = [])).push(callback);
    return this;
  };

  // Removes a previously-registered `callback` function for an `event`.
  Spec.prototype.removeListener = Test.prototype.removeListener = function(event, callback) {
    var events = this.events || (this.events = {}), callbacks, length;
    if (typeof event == 'string' && typeof callback == 'function' && (callbacks = events[event]) && (length = callbacks.length)) {
      // Remove the callback from the callback registry.
      while (length--) if (callbacks[length] == callback) callbacks.splice(length, 1);
      // Clean up empty callback registries.
      if (!callbacks.length) delete events[event];
    }
    return this;
  };
  
  // Removes all registered callback functions for an `event`, or all callbacks for all
  // events if the `event` is omitted.
  Spec.prototype.removeAllListeners = Test.prototype.removeAllListeners = function(event) {
    if (event == null) {
      // Clear the event registry.
      this.events = {};
    } else if (typeof event == 'string' && this.events) {
      // Remove an event's callback registry.
      delete this.events[event];
    }
    return this;
  };
  
  // Registers a one-time `callback` for the specified `event`. The callback is invoked
  // only the first time the `event` is emitted, after which it is removed.
  Spec.prototype.once = Test.prototype.once = function(event, callback) {
    var target = this, onEvent;
    if (typeof event == 'string' && typeof callback == 'function') {
      onEvent = function(event) {
        target.removeListener(event.type, onEvent);
        return callback.call(target, event);
      };
      target.on(event, onEvent);
    }
    return this;
  };

  // Emits an `event`, specified by either a string identifier or an event object with a
  // `type` property.
  Spec.prototype.emit = Test.prototype.emit = function(event) {
    var events = this.events || (this.events = {}), callback, callbacks, type, index, length;
    // Convert a string identifier into an event object.
    if (typeof event == 'string') event = {
      'type': event
    };
    if (typeof (type = event && event.type) == 'string') {
      // Capture a reference to the current event target.
      if (!('target' in event)) event.target = this;
      if ((callbacks = events[type]) && (length = callbacks.length)) {
        // Clone the event callback registry.
        callbacks = callbacks.slice(0);
        // Execute each callback.
        for (index = 0; index < length; index++) {
          if (typeof (callback = callbacks[index]) == 'function') {
            // Wrap each invocation in a `try...catch` statement to ensure that all
            // subsequent callbacks are executed.
            try {
              // Prevent subsequent callbacks from executing if the callback explicitly
              // returns `false`.
              if (callback.call(this, event) === false) break;
            } catch (error) {
              // Emit the `error` event if a callback throws an error.
              if (type != 'error') this.emit({
                'type': 'error',
                'error': error
              });
            }
          }
        }
      }
      // Emit the special `all` event.
      if (type != 'all' && (callbacks = events.all) && (length = callbacks.length)) {
        callbacks = callbacks.slice(0);
        for (index = 0; index < length; index++) {
          if (typeof (callback = callbacks[index]) == 'function') {
            try {
              if (callback.call(this, event) === false) break;
            } catch (error) {
              if (type != 'error') this.emit({
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

  // Expose the `Spec` function.
  this.Spec = Spec;
}).call(typeof this.exports == 'object' && this.exports || this);