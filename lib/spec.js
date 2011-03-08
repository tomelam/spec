/*! Spec unit testing library
 * http://github.com/kitgoncharov/Spec
 *
 * Copyright 2011, Kit Goncharov
 * http://kitgoncharov.github.com
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
  Spec.version = '1.0.0rc2';

  Spec.prototype.name = 'Anonymous Spec';

  // Adds a new `test` function to the spec. The `name` is optional.
  Spec.prototype.add = function(name, test) {
    this.push(new Test(name, test));
    return this;
  };

  // Successively runs each test in the spec.
  Spec.prototype.run = function() {
    var spec = this, length = spec.length;
    // Create the aggregate spec summary.
    spec.assertions = spec.failures = spec.errors = 0;
    // Internal event listener invoked every time a test triggers an event.
    function onTestEvent(event) {
      var target = event.target, type = event.type;
      // Proxy the triggered event.
      spec.trigger(event);
      if (type == 'teardown') {
        // Update the spec summary.
        spec.assertions += target.assertions;
        spec.failures += target.failures;
        spec.errors += target.errors;
        // Remove the internal event listener.
        target.detach('all', onTestEvent);
        // Remove the completed test and run the next test.
        if ((target = spec.shift())) {
          target.run();
        } else {
          // Ensure that the spec is empty.
          if (!spec.length) delete spec[0];
          // Finish running the spec.
          spec.trigger('complete');
        }
      }
    }
    // Attach the internal event listener and begin running the tests.
    while (length--) spec[length].on('all', onTestEvent);
    spec.trigger('start').shift().run();
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
    this.trigger('setup');
    try {
      // Pass the wrapper as the first argument to the test function.
      if (ok) this.test(this);
    } catch (error) {
      this.errors++;
      this.trigger({'type': 'error', 'error': error});
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
    return this.trigger(event);
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
    return this.trigger('teardown');
  };

  // Custom Events
  // -------------

  // Methods for adding, removing, and firing custom events. You can add and remove event
  // listeners; triggering an event executes its listeners in succession.

  // Adds an event listener. The `listener` will be invoked each time the event `type`,
  // specified by a string identifier, is fired. Listeners attached to the `all` event
  // will be invoked when *any* event is triggered, while those attached to the `error`
  // event will be invoked when a triggered listener throws an error.
  Spec.prototype.on = Test.prototype.on = function(type, listener) {
    // Create the event registry if it doesn't exist.
    var events = this.events || (this.events = {});
    // Add the event listener to the listener registry.
    if (typeof type == 'string' && typeof listener == 'function') (events[type] || (events[type] = [])).push(listener);
    return this;
  };

  // Removes a previously-attached event listener. If the `listener` function is omitted,
  // all listeners for the event `type` will be removed. If both the event and listener are
  // omitted, *all* event listeners will be removed.
  Spec.prototype.detach = Test.prototype.detach = function(type, listener) {
    var events = this.events || (this.events = {}), listeners, length;
    if (type == null && listener == null) {
      // Remove all event listeners.
      this.events = {};
    } else if (typeof type == 'string' && (listeners = events[type]) && (length = listeners.length)) {
      // Remove the listener from the event listener registry.
      while (length--) if (listeners[length] == listener) listeners.splice(length, 1);
      // Remove the listener registry if it is empty or the listener was omitted.
      if (listener == null || !listeners.length) delete events[type];
    }
    return this;
  };

  // Triggers an event, specified by either a string identifier or an event object with a
  // `type` property.
  Spec.prototype.trigger = Test.prototype.trigger = function(event) {
    var events = this.events || (this.events = {}), listener, listeners, type, index, length;
    // Convert a string identifier into an event object.
    if (typeof event == 'string') event = {'type': event};
    if (typeof (type = event && event.type) == 'string') {
      // Capture a reference to the current event target.
      if (!('target' in event)) event.target = this;
      if ((listeners = events[type]) && (length = listeners.length)) {
        // Clone the event listener registry.
        listeners = listeners.slice(0);
        // Execute each listener.
        for (index = 0; index < length; index++) {
          if (typeof (listener = listeners[index]) == 'function') {
            // Wrap each invocation in a `try...catch` statement to ensure that all
            // subsequent listeners are executed.
            try {
              // Prevent subsequent listeners from firing if the listener explicitly returns `false`.
              if (listener.call(this, event) === false) break;
            } catch (error) {
              // Trigger the `error` event if a listener throws an error.
              if (type != 'error' && events.error && events.error.length) this.trigger({'type': 'error', 'error': error});
            }
          }
        }
      }
      // Trigger the special `all` event.
      if (type != 'all' && (listeners = events.all) && (length = listeners.length)) {
        listeners = listeners.slice(0);
        for (index = 0; index < length; index++) {
          if (typeof (listener = listeners[index]) == 'function') {
            try {
              if (listener.call(this, event) === false) break;
            } catch (error) {
              if (type != 'error' && events.error && events.error.length) this.trigger({'type': 'error', 'error': error});
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