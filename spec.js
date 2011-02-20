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
  // Specs
  // -----
  
  // Specs are event-driven collections of related unit tests. Using custom
  // events, you can create routines for setting up and tearing down tests,
  // handling assertions, failures, and errors, and logging test results.
  
  // Creates a new spec. The `name` is optional.
  function Spec(name) {
    this.name = typeof name == 'string' && name || 'Anonymous Spec';
  }
  
  // The current version of Spec. Keep in sync with `package.json`.
  Spec.version = '1.0.0rc1';
  
  // Adds a new `test` function to the spec. The `name` is optional.
  Spec.prototype.add = function(name, test) {
    this.push(new Spec.Test(name, test));
    return this;
  };
  
  // Successively runs each test in the spec.
  Spec.prototype.run = function(name, test) {
    var spec = this, index, length;
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
        // Unbind the helper event listener.
        target.unbind('all', onTestEvent);
        // Remove the completed test and run the next test.
        if ((target = spec.shift()) && typeof target.run == 'function') {
          target.run();
        } else {
          // Ensure that the spec is empty.
          if (!spec.length) delete spec[0];
          // Finish running the spec.
          spec.trigger('complete');
        }
      }
    }
    // Bind the helper event listener and run the tests.
    for (index = 0, length = spec.length; index < length; index++) spec[index].bind('all', onTestEvent);
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
  
  // The internal `eq()` function recursively compares two objects. Based on
  // work by Jeremy Ashkenas, Philippe Rathe, and Mark Miller.
  var toString = {}.toString;
  function eq(left, right, stack) {
    var className, key, size, sizeRight, result;
    // Identical objects and values. `0 === -0`, but they aren't equal.
    if (left === right) return left != 0 || 1 / left == 1 / right;
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
  }
  
  // The `Spec.Test` constructor wraps a `test` function with several convenience
  // methods and assertions. The `name` is optional.
  Spec.Test = function(name, test) {
    if (typeof name == 'function' && test == null) {
      test = name;
    } else {
      this.name = typeof name == 'string' && name || 'Anonymous Test';
    }
    this.test = typeof test == 'function' ? test : null;
  };
  
  // Runs the test.
  Spec.Test.prototype.run = function() {
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
  
  // Tests whether `value` is truthy. To test strictly for the boolean `true`,
  // use `.equal()` instead. The optional assertion `message` is passed to each
  // event listener, and defaults to the name of the assertion (e.g., `ok`).
  Spec.Test.prototype.ok = function(value, message) {
    var event = {
      'actual': value,
      'expected': true,
      'message': typeof message == 'string' && message || 'ok'
    };
    if (value) {
      this.assertions++;
      event.type = 'assertion';
    } else {
      this.failures++;
      event.type = 'failure';
    }
    return this.trigger(event);
  };
  
  // Tests whether `actual` is **identical** to `expected`, as determined by the `===` operator.
  Spec.Test.prototype.equal = function(actual, expected, message) {
    var event = {
      'actual': actual,
      'expected': expected,
      'message': typeof message == 'string' && message || 'equal'
    };
    if (actual === expected) {
      this.assertions++;
      event.type = 'assertion';
    } else {
      this.failures++;
      event.type = 'failure';
    }
    return this.trigger(event);
  };
  
  // Tests for **strict** inequality (`actual !== expected`).
  Spec.Test.prototype.notEqual = function(actual, expected, message) {
    var event = {
      'actual': actual,
      'expected': expected,
      'message': typeof message == 'string' && message || 'notEqual'
    };
    if (actual !== expected) {
      this.assertions++;
      event.type = 'assertion';
    } else {
      this.failures++;
      event.type = 'failure';
    }
    return this.trigger(event);
  };
  
  // Tests for **loose** inequality (`actual != expected`).
  Spec.Test.prototype.looseEqual = function(actual, expected, message) {
    var event = {
      'actual': actual,
      'expected': expected,
      'message': typeof message == 'string' && message || 'looseEqual'
    };
    if (actual == expected) {
      this.assertions++;
      event.type = 'assertion';
    } else {
      this.failures++;
      event.type = 'failure';
    }
    return this.trigger(event);
  };
  
  // Tests for **loose** inequality (`actual != expected`).
  Spec.Test.prototype.notLooseEqual = function(actual, expected, message) {
    var event = {
      'actual': actual,
      'expected': expected,
      'message': typeof message == 'string' && message || 'notLooseEqual'
    };
    if (actual != expected) {
      this.assertions++;
      event.type = 'assertion';
    } else {
      this.failures++;
      event.type = 'failure';
    }
    return this.trigger(event);
  };
  
  // Tests for deep equality and equivalence, as determined by the `eq()` function.
  Spec.Test.prototype.deepEqual = function(actual, expected, message) {
    var event = {
      'actual': actual,
      'expected': expected,
      'message': typeof message == 'string' && message || 'deepEqual'
    };
    if (eq(actual, expected, [])) {
      this.assertions++;
      event.type = 'assertion';
    } else {
      this.failures++;
      event.type = 'failure';
    }
    return this.trigger(event);
  };
  
  // Tests for deep inequality.
  Spec.Test.prototype.notDeepEqual = function(actual, expected, message) {
    var event = {
      'actual': actual,
      'expected': expected,
      'message': typeof message == 'string' && message || 'notDeepEqual'
    };
    if (eq(actual, expected, [])) {
      this.failures++;
      event.type = 'failure';
    } else {
      this.assertions++;
      event.type = 'assertion';
    }
    return this.trigger(event);
  };
  
  // Tests whether the function `block` throws an error. Both `expected` and
  // `message` are optional; if the `message` is omitted and `expected` is not
  // a RegExp or validation function, the value of `expected` is used as the message.
  Spec.Test.prototype.raises = function(block, expected, message) {
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
          return this.trigger({'type': 'error', 'error': error});
        }
      }
    }
    return this.ok(ok, typeof message == 'string' && message || 'raises');
  };
  
  // Completes a test with an optional expected number of `assertions`. This
  // method **must** be called at the end of each test.
  Spec.Test.prototype.done = function(assertions) {
    // Verify that the expected number of assertions were executed.
    if (typeof assertions == 'number' && assertions > -1 && (assertions = Math.ceil(assertions)) != this.assertions) {
      this.failures++;
      this.trigger({
        'type': 'failure',
        'actual': this.assertions,
        'expected': assertions,
        'message': 'done'
      });
    }
    return this.trigger('teardown');
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
    if (typeof type == 'string' && type && typeof listener == 'function') (events[type] || (events[type] = [])).push(listener);
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
      } else if (typeof type == 'string' && type && (listeners = events[type]) && (length = listeners.length)) {
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
    var events = this.events, isEvent = typeof event == 'object', type, listeners, listener, index, length;
    if ((isEvent || typeof event == 'string') && event && typeof events == 'object' && events) {
      // Convert a string identifier into an event object.
      if (!isEvent) event = {'type': event};
      type = event.type;
      // Capture a reference to the current event target.
      if (!('target' in event)) event.target = this;
      if ((listeners = typeof type == 'string' && type != 'all' && events[type]) && (length = listeners.length)) {
        // Clone the event listener registry.
        listeners = listeners.slice(0);
        // Execute each event listener.
        for (index = 0; index < length; index++) {
          if (typeof (listener = index in listeners && listeners[index]) == 'function') {
            // Wrap each invocation in a `try...catch` statement to ensure that all subsequent listeners are executed.
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
      if ((listeners = events.all) && (length = listeners.length)) {
        listeners = listeners.slice(0);
        for (index = 0; index < length; index++) {
          if (typeof (listener = index in listeners && listeners[index]) == 'function') {
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
}).call(typeof exports == 'object' && exports || this);