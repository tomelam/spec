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
  // Convenience aliases.
  var toString = Object.prototype.toString, slice = Array.prototype.slice,

  // Creates a new spec.
  Spec = this.Spec = function(name) {
    return new Spec.prototype.constructor(name);
  },

  // Internal method; recursively compares two objects.
  eq = function(left, right, stack) {
    // Based on work by Jeremy Ashkenas, Philippe Rathe, and Mark Miller.
    var type, className, key, size, sizeRight, result;
    // Identical objects and values.
    if (left === right) {
      // 0 === -0, but the two aren't equal.
      return left !== 0 || 1 / left === 1 / right;
    }
    // `null` and `undefined` values.
    if (left == null) {
      // Strict comparison; `null == undefined`.
      return left === right;
    }
    // Compare [[Class]] names.
    className = toString.call(left);
    if (className !== toString.call(right)) {
      return false;
    }
    switch (className) {
      // Compare strings, booleans, dates, and numbers by value.
      case '[object String]':
      case '[object Number]':
      case '[object Date]':
      case '[object Boolean]':
        // Primitives and their corresponding object wrappers are equal.
        left = left.valueOf();
        right = right.valueOf();
        // `NaN`s are non-reflexive.
        return left !== left ? right !== right : left === right;
      // Compare RegExps by their source patterns and flags.
      case '[object RegExp]':
        return left.source === right.source && left.global === right.global &&
        // The sticky (`y`) flag is Firefox-specific.
        left.ignoreCase === right.ignoreCase && left.sticky === right.sticky &&
        left.multiline === right.multiline;
      // Compare functions by identity.
      case '[object Function]':
        return left === right;
      case '[object Array]':
        // Compare lengths to determine if a deep comparison is necessary.
        if (left.length !== right.length) {
          return false;
        }
    }
    // Recursively compare objects and arrays.
    type = typeof left;
    if (type === 'object' && typeof right === type) {
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
      // Once the object has been traversed, remove it from the stack.
      stack.pop();
      return result;
    }
    return false;
  };

  // The current version of Spec.
  Spec.version = '0.9.8';

  // Module for adding, removing, and firing custom events.
  Spec.Events = function() {};

  // Binds an event handler.
  Spec.Events.prototype.bind = function(event, callback) {
    var events = this.events || (this.events = {}), callbacks;
    if (event != null && typeof callback === 'function') {
      if (!(callbacks = events[event])) {
        // Avoid creating a handler registry for single-handler events.
        events[event] = callback;
      } else if (callbacks && typeof callbacks.push === 'function') {
        // Add the event handler to an existing handler registry.
        callbacks.push(callback);
      } else {
        // Binding a second event handler; create the registry.
        events[event] = [callbacks, callback];
      }
    }
    return this;
  };

  // Binds a one-time event handler.
  Spec.Events.prototype.one = function(event, callback) {
    var target = this, onTrigger;
    if (event != null && typeof callback === 'function') {
      // Triggers the one-time handler.
      onTrigger = function() {
        target.unbind(event, onTrigger);
        callback.apply(this, arguments);
      };
      target.bind(event, onTrigger);
    }
    return target;
  };

  // Removes a previously-bound event handler.
  Spec.Events.prototype.unbind = function(event, callback) {
    var events = this.events, callbacks, length;
    if (event == null && callback === event || !events) {
      // Create or clear the event registry.
      this.events = {};
    } else if (event != null && (callbacks = events[event])) {
      // Optimize for single-handler events.
      if (callback == null || typeof callbacks === 'function' &&
      callbacks === callback) {
        delete events[event];
      } else {
        // Remove the handler from the event handler registry.
        length = callbacks.length;
        while (length--) {
          if (callbacks[length] === callback) {
            callbacks.splice(length, 1);
          }
        }
        // Remove empty handler registries.
        if (!callbacks.length) {
          delete events[event];
        }
      }
    }
    return this;
  };

  // Trigger all bound handlers for the given event.
  Spec.Events.prototype.trigger = function(event) {
    var events = this.events, callbacks, callback, index, length, data;
    if (event != null && events && (callbacks = events[event])) {
      // Optimize for single-handler events.
      if (typeof callbacks === 'function') {
        // Optimize for 3 or fewer arguments. Based on work by Jeremy Martin.
        switch (arguments.length) {
          case 1:
            callbacks.call(this, this);
            break;
          case 2:
            callbacks.call(this, arguments[1], this);
            break;
          case 3:
            callbacks.call(this, arguments[1], arguments[2], this);
            break;
          default:
            // Pass all extra arguments to the event handler.
            (data = slice.call(arguments, 1)).push(this);
            callbacks.apply(this, data);
        }
      } else {
        // Pass the event target as the last argument to each handler.
        (data = slice.call(arguments, 1)).push(this);
        // Clone the handler registry before executing any handlers.
        callbacks = callbacks.slice(0);
        for (index = 0, length = callbacks.length; index < length; index++) {
          // Execute each event handler.
          callback = index in callbacks && callbacks[index];
          if (typeof callback === 'function') {
            callback.apply(this, data);
          }
        }
      }
    }
    return this;
  };

  // Mix in the custom events module.
  Spec.prototype = new Spec.Events();

  // Creates a new spec.
  (Spec.prototype.constructor = function(name) {
    this.name = name != null ? name : 'Anonymous Spec';
    this.length = 0;
  }).prototype = Spec.prototype;

  // Adds a test to the spec.
  Spec.prototype.test = function(name, test) {
    this[this.length++] = new Spec.Test(name, test);
    return this;
  };

  // Invokes a method with optional arguments for each test in the spec.
  Spec.prototype.invoke = function(name) {
    var data = slice.call(arguments, 1), index, length, test, method;
    for (index = 0, length = this.length; index < length; index++) {
      test = index in this && this[index];
      if (test && typeof (method = test[name]) === 'function') {
        method.apply(test, data);
      }
    }
    return this;
  };

  // Runs each test, triggering events as needed.
  Spec.prototype.run = function() {
    var spec = this, index, length, onSetup, onAssertion, onFailure,
    onError, onTeardown;
    // Avoid race conditions caused by multiple invocations.
    if (!spec.isRunning) {
      spec.isRunning = true;
      // Summary and currently running test.
      index = spec.assertions = spec.failures = spec.errors = 0;
      length = spec.length;
      // Triggered at the start of each test.
      onSetup = function(test) {
        // Bind the helper event handlers.
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
          // All tests have finished running.
          spec.isRunning = false;
          spec.trigger('complete');
        }
      };
      // Finish setting up and begin running the tests.
      spec.invoke('one', 'setup', onSetup).trigger('start')[index].run();
    }
    return this;
  };

  // Wraps a test function with several convenience methods and assertions.
  Spec.Test = function(name, test) {
    // Names are optional.
    if (typeof name === 'function' && test == null) {
      test = name;
      name = null;
    }
    this.name = name != null ? name : 'Anonymous Test';
    this.test = typeof test === 'function' ? test : null;
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
        if ((ok = typeof this.test === 'function')) {
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

  // Records an assertion and triggers the `assertion` event.
  Spec.Test.prototype.assert = function(actual, expected, message) {
    this.assertions++;
    return this.trigger('assertion', {
      'actual': actual,
      'expected': expected,
      'message': message
    });
  };

  // Records a failure and triggers the `failure` event.
  Spec.Test.prototype.fail = function(actual, expected, message) {
    this.failures++;
    return this.trigger('failure', {
      'actual': actual,
      'expected': expected,
      'message': message
    });
  };

  // Tests whether a value is truthy.
  Spec.Test.prototype.ok = function(value, message) {
    // To test strictly for the boolean `true`, use `.equal()` instead.
    return this[value ? 'assert' : 'fail'](value, true, message != null ?
      message : 'ok');
  };

  // Tests for strict equality (`===`).
  Spec.Test.prototype.equal = function(actual, expected, message) {
    return this[actual === expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'equal');
  };

  // Tests for strict inequality (`!==`).
  Spec.Test.prototype.notEqual = function(actual, expected, message) {
    return this[actual !== expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'notEqual');
  };

  // Tests for loose or coercive equality (`==`).
  Spec.Test.prototype.looseEqual = function(actual, expected, message) {
    return this[actual == expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'looseEqual');
  };

  // Tests for loose inequality (`!=`).
  Spec.Test.prototype.notLooseEqual = function(actual, expected, message) {
    return this[actual != expected ? 'assert' : 'fail'](actual, expected,
      message != null ? message : 'notLooseEqual');
  };

  // Tests for deep equality and equivalence.
  Spec.Test.prototype.deepEqual = function(actual, expected, message) {
    return this[eq(actual, expected, []) ? 'assert' : 'fail'](actual,
      expected, message != null ? message : 'deepEqual');
  };

  // Tests for deep inequality.
  Spec.Test.prototype.notDeepEqual = function(actual, expected, message) {
    return this[eq(actual, expected, []) ? 'fail' : 'assert'](actual,
      expected, message != null ? message : 'notDeepEqual');
  };

  // Expects a function to throw an error.
  Spec.Test.prototype.raises = function(block, expected, message) {
    var ok = false, isFunction = expected && typeof expected === 'function',
    isRegExp = expected && toString.call(expected) === '[object RegExp]';
    if (!(isFunction || isRegExp) && message == null) {
      // The message was passed as the second argument.
      message = expected;
      expected = null;
    }
    if (typeof block === 'function') {
      try {
        block();
      } catch (error) {
        ok = expected == null;
        if (isRegExp) {
          ok = expected.test(error);
        } else if (isFunction) {
          ok = expected.call(this, error, this);
        }
      }
    }
    return this.ok(ok, message != null ? message : 'raises');
  };

  // Finishes running a test.
  Spec.Test.prototype.done = function(assertions) {
    if (typeof assertions === 'number' && assertions > -1) {
      assertions = Math.ceil(assertions);
      // Verify that the expected number of assertions were executed.
      if (assertions !== this.assertions) {
        this.fail(this.assertions, assertions, 'done');
      }
    }
    this.isRunning = false;
    return this.trigger('teardown');
  };
}).call(typeof exports === 'object' && exports || this);
