/*!
 * Spec unit testing library
 * http://github.com/kitcambridge/spec
 *
 * Copyright 2011-2012, Kit Cambridge
 * http://kitcambridge.github.com
 *
 * Released under the MIT License.
*/

;(function (root, Spec) {
  if (typeof define == "function" && define["amd"]) {
    // Export Spec for asynchronous module loaders.
    define(["exports"], Spec);
  } else {
    // Export for CommonJS environments, web browsers, and JavaScript engines.
    Spec = Spec(typeof exports == "object" && exports || (root["Spec"] = {
      // **noConflict** restores the original value of the `Spec` variable and
      // returns a reference to the Spec object.
      "noConflict": (function (original) {
        function noConflict() {
          root["Spec"] = original;
          // `noConflict` can't be invoked more than once.
          delete Spec.noConflict;
          return Spec;
        }
        return noConflict;
      })(root["Spec"])
    }));
  }
})(this, function (exports) {
  "use strict";

  // The current version of Spec. Keep in sync with `package.json`.
  exports.version = "1.0.0rc4";

  // Utility Methods.
  // ----------------

  // `Object::toString` exposes the internal `[[Class]]` name of an object.
  var getClass = {}.toString, isPropertyOf = {}.hasOwnProperty,

  // `null` is aliased as `nil` to prevent a global variable leak by the Closure
  // Compiler.
  nil = null,

  // **Spec.Environment** stores information about the current environment.
  Environment = exports.Environment = {
    // Indicates whether the `Object::hasOwnProperty` function is supported.
    "isPropertyOf": getClass.call(isPropertyOf) == "[object Function]",
    // Indicates whether the JScript `[[DontEnum]]` bug is present.
    "dontEnum": false,
    // Indicates whether the Safari 2 shadowed property enumeration bug is
    // present.
    "shadowEnum": false,
    // Indicates whether `undefined` elements in arrays are treated as elisions
    // (JScript 5.x spec, section 2.1.26).
    "undefinedElisions": !(0 in [void 0]),
    // Indicates whether Node's `process.nextTick` function is supported.
    "nextTick": typeof process == "object" && process != nil && typeof process.nextTick == "function",
    // Indicates whether the `setTimeout` function is supported.
    "setTimeout": typeof setTimeout != "undefined",
    // Indicates whether Mozilla's LiveConnect APIs are supported.
    "java": typeof java != "undefined" && java != nil && getClass.call(java) == "[object JavaPackage]"
  },

  // **all** determines whether the callback returns `true` for all object
  // members.
  all = exports.all = (function () {
    var size = 0, memo, property, all;

    // Tests for bugs in the current environment's `for...in` algorithm. The
    // `valueOf` property inherits the non-enumerable flag from `Object::` in
    // JScript.
    function Properties() {
      this.valueOf = 0;
    }
    // Safari 2 enumerates shadowed properties twice.
    Properties.prototype.valueOf = 0;

    // **isPropertyOf** determines if a property is a direct property of the
    // specified object.
    if (!Environment.isPropertyOf && (memo = { "__proto__": nil }, !("toString" in memo))) {
      // Simulate `Object::hasOwnProperty` in Safari 2.
      Environment.isPropertyOf = true;
      isPropertyOf = function isPropertyOf(property) {
        // Capture and break the object's prototype chain. See the ES 5.1 spec,
        // section 8.6.2.
        var original = this.__proto__, result;
        // The parenthesized expression prevents an unsafe transformation by the
        // Closure Compiler.
        result = property in (this.__proto__ = nil, this);
        // Restore the original prototype chain.
        this.__proto__ = original;
        return result;
      };
    }

    // Iterate over a new instance of the `Properties` class.
    memo = new Properties();
    for (property in memo) {
      // Ignore all other properties inherited from `Object::`.
      if (isPropertyOf.call(memo, property)) {
        size += 1;
      }
    }

    memo = nil;

    // Normalize the iteration algorithm.
    if (!size) {
      // A list of non-enumerable properties inherited from `Object::`.
      memo = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
      // JScript ignores shadowed non-enumerable properties.
      //
      // ---------------------------------------------------
      Environment.dontEnum = true;
      all = function all(object, callback) {
        var property, length;
        for (property in object) {
          if (isPropertyOf.call(object, property) && !callback(property, object[property], object)) {
            return false;
          }
        }
        // Manually invoke the callback for each non-enumerable property.
        for (length = memo.length; length--;) {
          property = memo[length];
          if (isPropertyOf.call(object, property) && !callback(property, object[property], object)) {
            return false;
          }
        }
        return true;
      };
    } else if (size == 2) {
      // Safari 2 enumerates shadowed properties twice.
      //
      // ----------------------------------------------
      Environment.shadowEnum = true;
      all = function all(object, callback) {
        // Create a set of iterated properties. The `prototype` property is not
        // enumerated due to cross-environment inconsistencies.
        var memo = {}, isFunction = getClass.call(object) == "[object Function]", property;
        for (property in object) {
          // Store each property name to prevent double enumeration.
          if (!(isFunction && property === "prototype") && !isPropertyOf.call(memo, property) && (memo[property] = 1) && isPropertyOf.call(object, property) && !callback(property, object[property], object)) {
            return false;
          }
        }
        return true;
      };
    } else {
      // No bugs detected; use the standard `for...in` algorithm.
      //
      // --------------------------------------------------------
      all = function all(object, callback) {
        var property, isFunction = getClass.call(object) == "[object Function]", isConstructor;
        for (property in object) {
          if (!(isFunction && property === "prototype") && isPropertyOf.call(object, property) && !(isConstructor = property === "constructor") && !callback(property, object[property], object)) {
            return false;
          }
        }
        // Manually invoke the callback for the `constructor` property due to
        // cross-environment inconsistencies.
        return (isConstructor || isPropertyOf.call(object, "constructor")) ? !!callback("constructor", object.constructor, object) : true;
      };
    }
    return all;
  })(),

  // **equals** recursively compares two objects.
  equals = exports.equals = (function () {
    // Comparison algorithm derived from work by Jeremy Ashkenas and Philippe
    // Rathe.
    function eq(left, right, stack) {
      var className, size, result;
      // Identical objects are equivalent.
      //
      // ---------------------------------
      if (left === right) {
        // `0` and `-0` are identical, but they aren't equivalent. See the
        // ECMAScript Harmony `egal` proposal.
        return left != 0 || (1 / left == 1 / right);
      }
      // `null` and `undefined` are compared by identity.
      //
      // ------------------------------------------------
      if (left == nil) {
        return left === right;
      }
      className = getClass.call(left);
      if (className != getClass.call(right)) {
        return false;
      }
      switch (className) {
        // Strings, numbers, dates, and booleans are compared by value.
        // Primitives and their corresponding object wrappers are equivalent;
        // thus, `"5"` is equivalent to `new String("5")`.
        //
        // ------------------------------------------------------------------
        case "[object String]":
          return String(left) == String(right);
        case "[object Number]":
          left = +left;
          right = +right;
          // `NaN`s are equivalent, but non-reflexive. An `egal` comparison is
          // performed for other numeric values.
          return left != left ? right != right : (left ? left == right : (1 / left == 1 / right));
        // Coerce dates and booleans to numeric primitive values. Dates are
        // compared by their millisecond representations; invalid dates are not
        // equivalent.
        //
        // --------------------------------------------------------------------
        case "[object Date]":
        case "[object Boolean]":
          return +left == +right;
        // RegExps are compared by their source patterns, flags, and
        // last-matched index.
        //
        // ---------------------------------------------------------
        case "[object RegExp]":
          return left.source == right.source &&
                 left.global == right.global &&
                 left.multiline == right.multiline &&
                 left.ignoreCase == right.ignoreCase &&
                 left.lastIndex == right.lastIndex;
      }
      if (typeof left != "object" || typeof right != "object") {
        return false;
      }
      // Assume equality for cyclic structures. The algorithm for detecting
      // cyclic structures is adapted from ES 5.1 section 15.12.3, abstract
      // operation `JO`. This is a linear search; performance is inversely
      // proportional to the number of unique nested objects.
      for (size = stack.length; size--;) {
        if (stack[size] == left) {
          return true;
        }
      }
      // Add the first object to the stack of traversed objects.
      stack.push(left);
      result = true;
      // Recursively compare objects and arrays.
      //
      // ---------------------------------------
      if (className == "[object Array]") {
        // Compare array lengths to determine if a deep comparison is necessary.
        size = left.length;
        result = size == right.length;
        if (result) {
          // Deep compare the contents, ignoring non-numeric properties.
          while (size--) {
            // Ensure commutative equality for sparse arrays.
            if (!(result = (size in left == size in right) && eq(left[size], right[size], stack))) {
              break;
            }
          }
        }
      } else {
        size = 0;
        // Deep compare objects.
        result = all(left, function (key, value) {
          // Count the expected number of properties.
          size += 1;
          // Deep compare each own object member.
          return isPropertyOf.call(right, key) && eq(value, right[key], stack);
        });
        // Ensure that both objects contain the same number of properties.
        if (result) {
          all(right, function () {
            return size--;
          });
          result = !size;
        }
      }
      // Remove the first object from the stack of traversed objects.
      stack.pop();
      return result;
    }

    // Define the top-level `equals` function.
    //
    // ---------------------------------------
    function equals() {
      for (var index = 0, length = arguments.length; index < length - 1;) {
        // Apply the comparison function left-to-right until all the provided
        // arguments have been consumed.
        if (!eq(arguments[index], arguments[index += 1], [])) {
          return false;
        }
      }
      return true;
    }

    return equals;
  })(),

  // **defer** attempts to execute a callback function asynchronously in supported
  // environments.
  defer;

  // `process.nextTick` executes a function asynchronously in Node.
  //
  // --------------------------------------------------------------
  if (Environment.nextTick) {
    defer = function defer(callback, context) {
      // `process.nextTick` is an efficient alternative to `setTimeout(..., 0)`.
      // As of Node 0.6.9, neither `process.nextTick` nor `setTimeout` isolate
      // execution; if the `callback` throws an exception, subsequent deferred
      // callbacks **will not execute**. This is an unfortunate incompatibility
      // with both the `setTimeout` function exposed in Browsers and Phantom,
      // and the Java `Timer` API exposed via LiveConnect in Rhino.
      function run() {
        callback.call(context);
      }
      process.nextTick(run);
    };
  // Browsers and Phantom provide the `setTimeout` function.
  //
  // -------------------------------------------------------
  } else if (Environment.setTimeout) {
    defer = function defer(callback, context) {
      function run() {
        callback.call(context);
      }
      setTimeout(run, 0);
    };
  // Mozilla Rhino's LiveConnect interface exposes the Java `Timer` API for
  // executing tasks in a background thread.
  //
  // ----------------------------------------------------------------------
  } else if (Environment.java) {
    defer = function defer(callback, context) {
      var timer = new java.util.Timer();
      function run() {
        // Terminate the background thread once the task runs. If the thread
        // is not terminated, the Rhino process will persist even after
        // execution is completed.
        timer.cancel();
        callback.call(context);
      }
      // Schedule the timer task for background execution. A new scheduler is
      // created for each task to ensure that exceptions do not leak between
      // tasks.
      timer.schedule(new java.util.TimerTask(new java.lang.Runnable({ "run": run })), 0);
    };
  // Execute the callback function synchronously in other environments.
  //
  // ------------------------------------------------------------------
  } else {
    defer = function defer(callback, context) {
      callback.call(context);
    };
  }

  // Export the `defer` function.
  exports.defer = defer;

  // Custom Events
  // -------------

  // `Spec.Events` provides an interface for managing custom events. You can
  // add and remove individual event handlers; triggering an event executes its
  // handlers in succession. Based on work by Jeremy Ashkenas.

  exports.Events = Events;
  function Events() {
    this.events = {};
  }

  // **addListener**, aliased as **on**, attaches a handler function, specified
  // by the `callback` argument, to an `event`. The callback will be invoked
  // whenever the event, specified by a string identifier, is fired. If the
  // optional `context` argument is provided, the `callback` will be bound to
  // it. Callbacks attached to the special `all` event will be invoked for
  // **all** triggered events.
  Events.prototype.on = Events.prototype.addListener = addListener;
  function addListener(events, callback, context) {
    var index, length, callbacks, target, previous, event;
    events = events.split(/\s+/);
    if (callback) {
      for (index = 0, length = events.length; index < length; index += 1) {
        event = events[index];
        callbacks = this.events[event];
        target = callbacks ? callbacks.previous : {};
        target.next = previous = {};
        target.context = context;
        target.callback = callback;
        // Create a new event target node.
        this.events[event] = {
          "previous": previous,
          "next": callbacks ? callbacks.next : target
        };
      }
    }
    return this;
  }

  // **removeListener** removes a previously-bound event handler. If the
  // `callback` is omitted, all handlers for the event type will be removed. If
  // both the event type *and* handler are omitted, **all** event handlers will
  // be removed. If the `context` is omitted, all versions of the handler,
  // including those bound to different contexts, will be removed.
  Events.prototype.removeListener = removeListener;
  function removeListener(events, callback, context) {
    var index, event, length, target, previous;
    if (!events) {
      // Remove all callbacks.
      this.events = {};
    } else {
      for (index = 0, events = events.split(/\s+/), length = events.length; index < length; index += 1) {
        event = events[index];
        if ((target = this.events[event])) {
          // Remove the callback registry.
          delete this.events[event];
          if (callback && target) {
            for (previous = target.previous; (target = target.next) != previous;) {
              // Create a new registry, omitting the specified callbacks.
              if (target.callback != callback || (context && target.context != context)) {
                this.on(event, target.callback, target.context);
              }
            }
          }
        }
      }
    }
    return this;
  }

  // **removeAllListeners** removes *all* registered handlers for an `event`,
  // or all handlers for all events if the `event` is omitted. This method is
  // deprecated; it is provided only for compatibility with v1.0.0rc3.
  Events.prototype.removeAllListeners = function (events) {
    return this.removeListener(events);
  };

  // **once** registers a one-time event handler for the specified `event`. The
  // handler is invoked only the first time the `event` is triggered, after
  // which it is removed. This method is deprecated.
  Events.prototype.once = function (events, callback) {
    function onEvent(event) {
      this.removeListener(events, onEvent, this);
      return callback.call(this, onEvent);
    }
    return this.on(events, onEvent, this);
  };

  // **emit** fires an event, specified by either a string identifier or an
  // event object with a `type` property.
  Events.prototype.emit = emit;
  function emit(event) {
    var target, previous, all, error;
    // Convert a string identifier into an event object.
    if (typeof event == "string" || getClass.call(event) == "[object String]") {
      event = { "type": event };
    }
    // Capture a reference to the current event target.
    if (!isPropertyOf.call(event, "target")) {
      event.target = this;
    }
    // Capture a reference to the callback registry for the `all` event.
    all = event.type != "all" && this.events.all;
    if ((target = this.events[event.type])) {
      for (previous = target.previous; (target = target.next) != previous;) {
        // Execute the callbacks in succession.
        try {
          target.callback.call(target.context || this, event);
        } catch (exception) {
          error = exception;
          // Re-throw exceptions asynchronously, allowing all subsequent
          // callbacks to fire.
          exports.defer(function () {
            throw error;
          });
        }
      }
    }
    // Fire the `all` event.
    if (all) {
      for (previous = all.previous; (all = all.next) != previous;) {
        try {
          all.callback.call(all.context || this, event);
        } catch (exception) {
          error = exception;
          exports.defer(function () {
            throw error;
          });
        }
      }
    }
    return this;
  };

  // Suites
  // ------

  // Suites are event-driven collections of unit tests. Using custom events, you
  // can create routines for setting up and tearing down tests, handling
  // assertions and failures, and logging test results.

  exports.Suite = Suite;

  // Creates a new suite with an optional `name`.
  function Suite(name) {
    Events.call(this);
    if (name != nil) {
      this.name = name;
    }
    this.length = 0;
  }

  // The default suite name.
  Suite.prototype.name = "Anonymous Suite";

  // Add support for custom events.
  Suite.prototype = new Events();
  Suite.prototype.constructor = Suite;

  // Array methods.
  Suite.prototype.join = [].join;
  Suite.prototype.pop = [].pop;
  Suite.prototype.push = [].push;
  Suite.prototype.reverse = [].reverse;
  Suite.prototype.shift = [].shift;
  Suite.prototype.sort = [].sort;
  Suite.prototype.splice = [].splice;
  Suite.prototype.unshift = [].unshift;

  // Shuffles the suite using a Fisher-Yates shuffle.
  Suite.prototype.shuffle = shuffle;
  function shuffle() {
    for (var value, index, length = this.length >>> 0; length;) {
      index = Math.floor(Math.random() * length);
      value = this[--length];
      this[length] = this[index];
      this[index] = value;
    }
    return this;
  };

  // Adds a test to the suite. The test name is optional.
  Suite.prototype.addTest = addTest;
  function addTest(name, test) {
    this.push(new Test(name, test));
    return this;
  };

  // Returns the index of the next available test relative to the given
  // `position`, or `null` if no additional tests are available.
  Suite.prototype.index = index;
  function index(position) {
    var length = this.length >>> 0, test;
    position = position < 0 ? length + position : (position || 0);
    for (; position < length; position += 1) {
      test = position in this && this[position];
      if (test && typeof test.constructor == "function" && test instanceof Test) {
        return position;
      }
    }
    return nil;
  };

  // Runs the suite.
  Suite.prototype.run = runSuite;
  function runSuite() {
    // Create the spec summary.
    var suite = this, position = suite.assertions = suite.failures = 0, target;
    // Internal event handler invoked each time a test emits an event.
    function onEvent(event) {
      var target = event.target;
      // Proxy the fired event.
      suite.emit(event);
      switch (event.type) {
        // Update the suite summary.
        case "assertion":
          suite.assertions += 1;
          break;
        case "failure":
          suite.failures += 1;
          break;
        case "teardown":
          // Unbind the internal event handler.
          target.removeListener("all", onEvent);
          if ((position = suite.index(position += 1)) != nil) {
            target = suite[position];
            defer(target.on("all", onEvent).run, target);
          } else {
            suite.emit("complete");
          }
      }
    }
    // Begin running the unit tests.
    suite.emit("start");
    // Bind the internal event handler to the first test.
    if ((position = suite.index(position)) != nil) {
      target = suite[position];
      defer(target.on("all", onEvent).run, target);
    } else {
      // Finish running the suite.
      suite.emit("complete");
    }
    return suite;
  };

  // Tests
  // -----

  // Wraps a test function with convenience methods and assertions.
  exports.Test = Test;
  function Test(name, test) {
    Events.call(this);
    if (name && test == nil) {
      test = name;
      name = nil;
    }
    if (name != nil) {
      this.name = name;
    }
    this.test = test;
    // Bind the helper event handler.
    this.on("all", this.onEvent, this);
  }

  // Add support for custom events.
  Test.prototype = new Events();
  Test.prototype.constructor = Test;

  // The default test name.
  Test.prototype.name = "Anonymous Test";

  // An event handler invoked each time a test emits an event.
  Test.prototype.onEvent = onTestEvent;
  function onTestEvent(event) {
    var target = event.target, expected;
    switch (event.type) {
      case "setup":
        target.assertions = target.failures = 0;
        break;
      case "assertion":
        target.assertions += 1;
        break;
      case "failure":
        target.failures += 1;
        break;
      case "teardown":
        expected = event.expected;
        // Verify that the expected number of assertions were executed.
        if ((typeof expected == "number" || getClass.call(expected) == "[object Number]") && expected != target.assertions) {
          target.emit({
            "type": "failure",
            "actual": target.assertions,
            "expected": expected,
            "message": "done"
          });
        }
    }
  };

  // **assert** creates a new assertion method with the given `name`. If the
  // provided `callback` function returns a falsy value, the assertion fails.
  Test.assert = assert;
  function assert(name, callback) {
    function assertion(actual, expected, message) {
      return this.ok(callback.call(this, actual, expected), {
        "actual": actual,
        "expected": expected,
        "message": message == nil ? name : message
      });
    }
    return assertion;
  };

  // Runs the test.
  Test.prototype.run = runTest;
  function runTest() {
    this.emit("setup");
    // Pass the wrapper as the first argument to the test function.
    this.test(this);
    return this;
  };

  // **ok** tests whether an `expression` is truthy. The optional `message`
  // defaults to the name of the current assertion (e.g., `ok`).
  Test.prototype.ok = ok;
  function ok(expression, event) {
    if (Object(event) !== event) {
      event = {
        "actual": expression,
        "expected": true,
        "message": event == nil ? "ok" : event
      };
    }
    // Note: To test for the boolean `true`, use the `strictEqual` assertion.
    event.type = expression ? "assertion" : "failure";
    return this.emit(event);
  };

  // **notOk** tests whether an `expression` is falsy.
  Test.prototype.notOk = notOk;
  function notOk(expression, message) {
    return this.ok(!expression, message == nil ? "notOk" : message);
  };

  // **equal** tests whether `actual` is **equal** to `expected`, as determined
  // by the `==` operator.
  Test.prototype.equal = assert("equal", assertEqual);
  function assertEqual(actual, expected) {
    return actual == expected;
  }

  // **notEqual** tests for **loose** or coercive inequality.
  Test.prototype.notEqual = assert("notEqual", assertNotEqual);
  function assertNotEqual(actual, expected) {
    return actual != expected;
  }

  // **strictEqual** tests for **strict** equality (`actual === expected`).
  Test.prototype.strictEqual = assert("strictEqual", assertStrictEqual);
  function assertStrictEqual(actual, expected) {
    return actual === expected;
  }

  // **notStrictEqual** tests for strict inequality.
  Test.prototype.notStrictEqual = assert("notStrictEqual", assertStrictNotEqual);
  function assertStrictNotEqual(actual, expected) {
    return actual !== expected;
  }

  // **deepEqual** tests for deep equality and equivalence, as determined by the
  // `Spec.equals` function.
  Test.prototype.deepEqual = assert("deepEqual", exports.equals);

  // **notDeepEqual** tests for deep inequality.
  Test.prototype.notDeepEqual = assert("notDeepEqual", assertNotDeepEqual);
  function assertNotDeepEqual(actual, expected) {
    return !exports.equals(actual, expected);
  }

  // Ensures that the `callback` function throws an exception.
  Test.prototype.error = assertError;
  function assertError(callback, expected, message) {
    var ok = false, isRegExp = expected && getClass.call(expected) == "[object RegExp]", isFunction = !isRegExp && typeof expected == "function";
    // Invalid expected value; the message was passed as the second argument.
    if (!isFunction && !isRegExp && message == nil) {
      message = expected;
      expected = nil;
    }
    try {
      callback();
    } catch (exception) {
      ok = expected == nil || (isRegExp && expected.test(exception)) || (isFunction && expected.call(this, exception, this));
    }
    return this.ok(ok, message == nil ? "error" : message);
  };

  // Ensures that the `callback` function does not throw any exceptions.
  Test.prototype.noError = assertNoError;
  function assertNoError(callback, message) {
    var ok = true;
    try {
      callback();
    } catch (exception) {
      ok = false;
    }
    return this.ok(ok, message == nil ? "noError" : message);
  };

  // **done** completes a test with an optional number of expected `assertions`.
  // This method **must** be called at the end of each test.
  Test.prototype.done = done;
  function done(assertions) {
    return this.emit({
      "type": "teardown",
      "expected": assertions
    });
  };
});