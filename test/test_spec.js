/*!
 * Spec Unit Tests
 * http://github.com/kitcambridge/spec
*/

(function (root) {
  "use strict";

  // Detect asynchronous module loaders and CommonJS environments.
  var isLoader = typeof define == "function" && !!define.amd,
  isModule = typeof require == "function" && typeof exports == "object" && exports && !isLoader,

  // Weak object inferences for detecting browsers and JS engines.
  isBrowser = "window" in root && root.window == root && typeof root.navigator != "undefined",
  isEngine = !isBrowser && !isModule && typeof root.load == "function",

  // Internal: Loads a module.
  load = function load(module, path) {
    return root[module] || (isModule ? require(path) : isEngine ?
      // Normalize the file extension.
      (root.load(path.replace(/\.js$/, "") + ".js"), root[module]) : null);
  },

  // Load Spec and the Newton utility library.
  Spec = load("Spec", "../lib/spec"), Newton = load("Newton", "../lib/newton"),

  // `undefined`, `NaN`, and `Infinity` are defined locally in case the global
  // versions are overwritten.
  undefined, NaN = 0 / 0, Infinity = 1 / 0,

  // Create the unit test suite.
  testSuite = Spec.testSuite = new Spec.Suite("Spec Unit Tests");

  // Create and attach the logger event handler.
  testSuite.on("all", isBrowser ? Newton.createReport("suite") : Newton.createConsole(function (value) {
    if (typeof console != "undefined" && console.log) {
      console.log(value);
    } else if (typeof print == "function" && !isBrowser) {
      // In browsers, the global `print` function prints the current page.
      print(value);
    } else {
      throw value;
    }
  }));

  testSuite.addTest("Newton.serializeQuery", function () {
    var parameters = { "stuff[]": ["$", "a", ";"] };

    this.strictEqual(Newton.serializeQuery({}), "", "Empty object");
    this.strictEqual(Newton.serializeQuery({ "key": [] }), "", "Empty array value");
    this.strictEqual(Newton.serializeQuery({ "foo": {}, "bar": {} }), "", "Unrecognized values should be omitted");

    this.equal(Newton.serializeQuery(Newton.parseQuery("a=b")), "a=b", "`serializeQuery` is the inverse of `parseQuery`");
    this.deepEqual(Newton.parseQuery(Newton.serializeQuery(parameters)), parameters, "`parseQuery` is the inverse of `serializeQuery`");

    this.equal(Newton.serializeQuery({ "key#": "value" }), "key%23=value", "Parameter containing a URI control character");
    this.equal(Newton.serializeQuery({ "key": "value#" }), "key=value%23", "Value containing a URI control character");
    this.equal(Newton.serializeQuery({ "key": undefined }), "key", "`undefined` value");
    this.equal(Newton.serializeQuery({ "key": null }), "key", "`null` value");
    this.equal(Newton.serializeQuery({ "key": 0 }), "key=0", "Numeric value");
    this.equal(Newton.serializeQuery({ "key": true }), "key=true", "Boolean value");

    this.equal(Newton.serializeQuery({ "color": ["r", "g", "b"] }), "color=r&color=g&color=b", "Array value containing string elements");
    this.equal(Newton.serializeQuery({ "key": [null, undefined] }), "key&key", "Array value containing `null` and `undefined` elements");
    this.equal(Newton.serializeQuery({ "color": ["r", null, "g", undefined, 0] }), "color=r&color&color=g&color&color=0", "Array value containing various elements");

    this.equal(Newton.serializeQuery(parameters), "stuff%5B%5D=%24&stuff%5B%5D=a&stuff%5B%5D=%3B", "Parameter and array elements containing URI control characters");
    this.equal(Newton.serializeQuery({ "toString": "value", "valueOf": null }), "toString=value&valueOf", "Shadowed property names should be permitted as parameters");

    this.done(16);
  });

  testSuite.addTest("Newton.parseQuery", function () {
    var result = { "a": null, "b": "c" }, message = "Parameter collection containing empty values";

    this.deepEqual(Newton.parseQuery(""), {}, "Empty query string");
    this.deepEqual(Newton.parseQuery("foo?"), {}, "Empty query string as part of a URL");
    this.deepEqual(Newton.parseQuery("foo?a&b=c"), result, "Query string as part of a URL");
    this.deepEqual(Newton.parseQuery("foo?a&b=c#fragment"), result, "Query string with URL and fragment");
    this.deepEqual(Newton.parseQuery("a;b=c", ";"), result, "Custom `separator` argument");

    this.deepEqual(Newton.parseQuery("a"), { "a": null }, "Parameter without a value");
    this.deepEqual(Newton.parseQuery("a=b&=c"), { "a": "b" }, "Value without a parameter");
    this.deepEqual(Newton.parseQuery("a=b&c="), { "a": "b", "c": "" }, "Empty value");

    this.deepEqual(Newton.parseQuery(Newton.serializeQuery(Newton.parseQuery("a=b&c"))), { "a": "b", "c": null }, "cross-convert containing an undefined value");
    this.deepEqual(Newton.parseQuery("a%20b=c&d=e%20f&g=h"), { "a b": "c", "d": "e f", "g": "h" }, "Keys and values should be properly decoded");
    this.deepEqual(Newton.parseQuery("a=b=c=d"), { "a": "b=c=d" }, "Value containing multiple `=` characters");
    this.deepEqual(Newton.parseQuery("&a=b&&&c=d"), { "a": "b", "c": "d" }, "Consecutive `&` separators should be ignored");
    this.deepEqual(Newton.parseQuery("col=r&col=g&col=b"), { "col": ["r", "g", "b"] }, "Identical parameter values should be aggregated into an array");
    this.deepEqual(Newton.parseQuery("toString=value&valueOf"), { "toString": "value", "valueOf": null }, "Shadowed property names should be permitted as parameters");

    this.deepEqual(Newton.parseQuery("c=r&c=&c=b"), { "c": ["r", "", "b"] }, message);
    this.deepEqual(Newton.parseQuery("c=&c=blue"), { "c": ["", "blue"] }, message);
    this.deepEqual(Newton.parseQuery("c=blue&c="), { "c": ["blue", ""] }, message);

    this.done(17);
  });

  // Utility methods.
  // ----------------

  testSuite.addTest("Spec.forOwn", function (test) {
    // A constructor function with direct and inherited properties that trigger
    // the JScript `[[DontEnum]]` bug.
    var Class = function Class() {
      // The `valueOf` and `toString` properties shadow properties on the
      // prototype.
      this.length = 1;
      this.valueOf = 2;
      this.toString = 3;
    }, result;

    // All prototype properties shadow corresponding `Object.prototype`
    // properties.
    Class.prototype = {
      "constructor": 4,
      "toString": 5,
      "toLocaleString": 6,
      "isPrototypeOf": 7,
      "propertyIsEnumerable": 8,
      "hasOwnProperty": 9
    };

    // Test callback function arguments.
    Spec.forOwn(new Class(), function (key, value, object) {
      test.equal(value, object[key], "The callback function should accept `key`, `value`, and `object` arguments");
      return false;
    });

    // Test enumeration of direct instance properties.
    result = 0;
    Spec.forOwn(new Class(), function (key, value) {
      result += 1;
      switch (key) {
        case "length":
          test.equal(value, 1, "The direct `length` property should be enumerated");
          break;
        case "valueOf":
          test.equal(value, 2, "The direct `valueOf` property should be enumerated");
          break;
        case "toString":
          test.equal(value, 3, "The shadowed `toString` property should be enumerated once");
          break;
        default:
          test.ok(false, Newton.substitute("Unexpected member. Property: %o. Value: %o.", key, value));
          return false;
      }
    });
    test.equal(result, 3, "The `Class` instance should contain three direct properties");

    // Test enumeration of direct prototype properties.
    result = 0;
    Spec.forOwn(Class.prototype, function (key, value) {
      result += 1;
      switch (key) {
        case "constructor":
          return test.equal(value, 4, "The direct `constructor` prototype property should be enumerated");
        case "toString":
          return test.equal(value, 5, "The direct `toString` prototype property should be enumerated");
        case "toLocaleString":
          return test.equal(value, 6, "The direct `toLocaleString` prototype property should be enumerated");
        case "isPrototypeOf":
          return test.equal(value, 7, "The direct `isPrototypeOf` prototype property should be enumerated");
        case "propertyIsEnumerable":
          return test.equal(value, 8, "The direct `propertyIsEnumerable` prototype property should be enumerated");
        case "hasOwnProperty":
          return test.equal(value, 9, "The direct `hasOwnProperty` prototype property should enumerated");
        default:
          test.ok(false, Newton.substitute("Unexpected member. Property: %o. Value: %o.", key, value));
          return false;
      }
    });
    test.equal(result, 6, "The `Class` prototype should contain six direct properties");

    // `Spec.forOwn` normalizes the enumeration of the `prototype` property
    // across environments.
    result = true;
    Spec.forOwn(Class, function (key) {
      return (result = key != "prototype");
    });
    test.ok(result, "The `prototype` property of a function should not be enumerated");

    test.done(13);
  });

  testSuite.addTest("Spec.equals", function () {
    var left, right, expected = 93, First = function First() {
      this.toString = 1;
    }, Second = function Second() {
      this.toString = 1;
    };

    First.prototype.toString = 1;
    Second.prototype.toString = 2;

    // Transitivity.
    this.ok(Spec.equals([1, "2"], [new Number(1), new String("2")], [1, "2"]), "The comparison algorithm should be transitive");

    // Basic equality and identity comparisons.
    this.ok(Spec.equals(null, null), "`null` should be equal to `null`");
    this.ok(Spec.equals(), "`undefined` should be equal to `undefined`");

    this.notOk(Spec.equals(0, -0), "`0` should not be equal to `-0`");
    this.notOk(Spec.equals(-0, 0), "Commutative equality should be implemented for `0` and `-0`");
    this.notOk(Spec.equals(null, undefined), "`null` should not be equal to `undefined`");
    this.notOk(Spec.equals(undefined, null), "Commutative equality should be implemented for `null` and `undefined`");

    // Strings.
    this.ok(Spec.equals("Maddy", "Maddy"), "Identical string primitives should be equal");
    this.ok(Spec.equals(new String("Maddy"), "Maddy"), "String primitives and their corresponding object wrappers should be equal");
    this.ok(Spec.equals("Maddy", new String("Maddy")), "Commutative equality should be implemented for strings");
    this.ok(Spec.equals(new String("Maddy"), new String("Maddy")), "String objects with identical primitive values should be equal");

    this.notOk(Spec.equals(new String("Maddy"), new String("Kit")), "String objects with different primitive values should not be equal");
    this.notOk(Spec.equals(new String("Maddy"), "Kit"), "String objects and primitives with different values should not be equal");
    this.notOk(Spec.equals(new String("Maddy"), { "toString": function () { return "Maddy"; } }), "String objects and objects with a custom `toString` method should not be equal");
    this.notOk(Spec.equals(new String("John-David"), { "valueOf": function () { return "John-David"; } }), "String objects and objects with a custom `valueOf` method should not be equal");

    // Numbers and `NaN`.
    this.ok(Spec.equals(75, 75), "Identical number primitives should be equal");
    this.ok(Spec.equals(75, new Number(75)), "Number primitives and their corresponding object wrappers should be equal");
    this.ok(Spec.equals(new Number(75), 75), "Commutative equality should be implemented for numbers");
    this.ok(Spec.equals(new Number(75), new Number(75)), "Number objects with identical primitive values should be equal");
    this.ok(Spec.equals(NaN, NaN), "`NaN` should be equal to `NaN`");
    this.ok(Spec.equals(NaN, new Number(NaN)), "`NaN` literals and their corresponding object wrappers should be equal");

    this.notOk(Spec.equals(new Number(-0), new Number(0)), "`0` and `-0` number objects should not be equal");
    this.notOk(Spec.equals(0, new Number(-0)), "Commutative equality should be implemented for `0` and `-0` number objects");
    this.notOk(Spec.equals(new Number(75), new Number(63)), "Number objects with different primitive values should not be equal");
    this.notOk(Spec.equals(new Number(63), { "valueOf": function () { return 63; } }), "Number objects and objects with a `valueOf` method should not be equal");
    this.notOk(Spec.equals(61, NaN), "A number primitive should not be equal to `NaN`");
    this.notOk(Spec.equals(new Number(79), NaN), "A number object should not be equal to `NaN`");
    this.notOk(Spec.equals(Infinity, NaN), "`Infinity` should not be equal to `NaN`");

    // Booleans.
    this.ok(Spec.equals(true, true), "Identical boolean primitives should be equal");
    this.ok(Spec.equals(true, new Boolean(true)), "Boolean primitives and their corresponding object wrappers should be equal");
    this.ok(Spec.equals(new Boolean(true), true), "Commutative equality should be implemented for booleans");
    this.ok(Spec.equals(new Boolean(), new Boolean()), "Boolean objects with identical primitive values should be equal");
    this.notOk(Spec.equals(new Boolean(true), new Boolean()), "Boolean objects with different primitive values should not be equal");

    // Common type coercions.
    this.notOk(Spec.equals(true, new Boolean(false)), "Boolean objects should not be equal to the boolean primitive `true`");
    this.notOk(Spec.equals("75", 75), "String and number primitives with like values should not be equal");
    this.notOk(Spec.equals(new Number(63), new String(63)), "String and number objects with like values should not be equal");
    this.notOk(Spec.equals(75, "75"), "Commutative equality should be implemented for like string and number values");
    this.notOk(Spec.equals(0, ""), "Number and string primitives with like values should not be equal");
    this.notOk(Spec.equals(1, true), "Number and boolean primitives with like values should not be equal");
    this.notOk(Spec.equals(new Boolean(false), new Number(0)), "Boolean and number objects with like values should not be equal");
    this.notOk(Spec.equals(false, new String("")), "Boolean primitives and string objects with like values should not be equal");
    this.notOk(Spec.equals(7732152e5, new Date(1994, 6, 3)), "Dates and their corresponding numeric primitive values should not be equal");

    // Dates
    this.ok(Spec.equals(new Date(1994, 6, 3), new Date(1994, 6, 3)), "Date objects referencing identical times should be equal");
    this.notOk(Spec.equals(new Date(1994, 6, 3), new Date(1993, 5, 2)), "Date objects referencing different times should not be equal");
    this.notOk(Spec.equals(new Date(1993, 5, 2), { "getTime": function () { return 7390008e5; } }), "Date objects and objects with a `getTime` method should not be equal");
    this.notOk(Spec.equals(new Date(1993, 5, 2), { "toString": function () { return 7390008e5; } }), "Date objects and objects with a `toString` method should not be equal");
    this.notOk(Spec.equals(new Date(1993, 5, 2), { "valueOf": function () { return 7390008e5; } }), "Date objects and objects with a `valueOf` method should not be equal");

    // Opera 7 normalizes dates with invalid time values to represent the
    // current date.
    left = new Date("Maddy");
    if (!isFinite(left)) {
      expected += 1;
      this.notOk(Spec.equals(left, new Date("Maddy")), "Invalid dates should not be equal");
    }

    // Functions.
    this.notOk(Spec.equals(First, Second), "Different functions with identical bodies and source code representations should not be equal");

    // RegExps.
    this.ok(Spec.equals(/(?:)/gim, /(?:)/gim), "RegExps with equivalent patterns and flags should be equal");
    this.notOk(Spec.equals(/(?:)/g, /(?:)/gi), "RegExps with equivalent patterns and different flags should not be equal");
    this.notOk(Spec.equals(/Maddy/gim, /Kit/gim), "RegExps with different patterns and equivalent flags should not be equal");
    this.notOk(Spec.equals(/(?:)/gi, /(?:)/g), "Commutative equality should be implemented for RegExps");
    this.notOk(Spec.equals(/Kit/g, {
      "source": "Kit",
      "global": true,
      "ignoreCase": false,
      "multiline": false,
      "lastIndex": 0
    }), "RegExps and RegExp-like objects should not be equal");
    left = /(?:)/gim;
    left.lastIndex = 1;
    this.notOk(Spec.equals(left, /(?:)/gim), "RegExps with different `lastIndex` values should not be equal");

    // Empty arrays and objects.
    this.ok(Spec.equals({}, {}), "Empty object literals should be equal");
    this.ok(Spec.equals([], []), "Empty array literals should be equal");
    this.ok(Spec.equals([{}], [{}]), "Empty nested arrays and objects should be equal");
    this.notOk(Spec.equals({}, []), "Object literals and array literals should not be equal");
    this.notOk(Spec.equals([], {}), "Commutative equality should be implemented for objects and arrays");
    this.notOk(Spec.equals({ "length": 0 }, []), "Array-like objects and arrays should not be equal");
    this.notOk(Spec.equals([], { "length": 0 }), "Commutative equality should be implemented for array-like objects");

    // Multi-dimensional arrays.
    this.ok(Spec.equals([1, "Kit", true], [1, "Kit", true]), "Arrays containing identical primitives should be equal");
    this.ok(Spec.equals([(/Maddy/g), new Date(1994, 6, 3)], [(/Maddy/g), new Date(1994, 6, 3)]), "Arrays containing equivalent elements should be equal");
    left = [new Number(47), new Boolean(), new String("Kit"), (/Maddy/), new Date(1993, 5, 2), ["running", "biking", "programming"], { "a": 47 }];
    right = [new Number(47), false, "Kit",( /Maddy/), new Date(1993, 5, 2), ["running", "biking", new String("programming")], { "a": new Number(47) }];
    this.ok(Spec.equals(left, right), "Arrays containing nested arrays and objects should be compared recursively");

    // Overwrite the methods defined in ES 5.1 section 15.4.4.
    left.forEach = left.map = left.filter = left.every = left.indexOf = left.lastIndexOf = left.some = left.reduce = left.reduceRight = null;
    right.join = right.pop = right.reverse = right.shift = right.slice = right.splice = right.concat = right.sort = right.unshift = null;

    // Array elements and properties.
    this.ok(Spec.equals(left, right), "Arrays containing equivalent elements and different non-numeric properties should be equal");
    left.push("White Rocks");
    this.notOk(Spec.equals(left, right), "Arrays of different lengths should not be equal");
    left.push("East Boulder");
    right.push("Gunbarrel Ranch", "Teller Farm");
    this.notOk(Spec.equals(left, right), "Arrays of identical lengths containing different elements should not be equal");

    // Sparse arrays.
    this.ok(Spec.equals(Array(3), Array(3)), "Sparse arrays of identical lengths should be equal");
    this.notOk(Spec.equals(Array(3), Array(6)), "Sparse arrays of different lengths should not be equal");

    // According to section 2.1.26 of the Microsoft ES 3 spec, JScript 5.x and
    // earlier will treat `undefined` elements in arrays as elisions. The
    // following tests will fail in IE <= 8.
    if (!Spec.Environment.undefinedElisions) {
      expected += 2;
      this.notOk(Spec.equals(Array(3), [undefined, undefined, undefined]), "Sparse and dense arrays should not be equal");
      this.notOk(Spec.equals([undefined, undefined, undefined], Array(3)), "Commutative equality should be implemented for sparse and dense arrays");
    }

    // Simple objects.
    this.ok(Spec.equals({ "a": "Maddy", "b": 1, "c": true }, { "a": "Maddy", "b": 1, "c": true }), "Objects containing identical primitives should be equal");
    this.ok(Spec.equals({ "a": /Kit/g, b: new Date(1993, 5, 2) }, { "a": /Kit/g, "b": new Date(1993, 5, 2) }), "Objects containing equivalent members should be equal");
    this.notOk(Spec.equals({ "a": 63, "b": 75 }, {"a": 61, "b": 55 }), "Objects of identical sizes with different values should not be equal");
    this.notOk(Spec.equals({ "a": 63, "b": 75 }, { "a": 61, "c": 55 }), "Objects of identical sizes with different property names should not be equal");
    this.notOk(Spec.equals({ "a": 1, "b": 2 }, { "a": 1 }), "Objects of different sizes should not be equal");
    this.notOk(Spec.equals({ "a": 1 }, { "a": 1, "b": 2 }), "Commutative equality should be implemented for objects");
    this.notOk(Spec.equals({ "x": 1, "y": undefined }, { "x": 1, "z": 2 }), "Objects with identical keys and different values should not be equivalent");

    // `left` contains nested objects and arrays.
    left = {
      "name": new String("Kit Cambridge"),
      "age": 18,
      "developer": true,
      "hobbies": [new String("running"), "biking", "programming"],
      "coords": {
        "intersection": ["75th Street", new String("East Boulder Trail")],
        "latitude": 40.07,
        "longitude": new Number(-105.178)
      }
    };

    // `right` contains equivalent nested objects and arrays.
    right = {
      "name": "Kit Cambridge",
      "age": new Number(18),
      "developer": new Boolean(true),
      "hobbies": ["running", "biking", new String("programming")],
      "coords": {
        "intersection": [new String("75th Street"), "East Boulder Trail"],
        "latitude": new Number(40.07),
        "longitude": -105.178
      }
    };
    this.ok(Spec.equals(left, right), "Objects with nested equivalent members should be compared recursively");

    // Override `Object.prototype` properties.
    left.constructor = left.hasOwnProperty = left.isPrototypeOf = left.propertyIsEnumerable = left.toString = left.toLocaleString = left.valueOf = null;
    right.constructor = right.hasOwnProperty = right.isPrototypeOf = right.propertyIsEnumerable = null;

    // Test inherited and direct properties.
    this.notOk(Spec.equals(left, right), "Objects with different own properties should not be equal");
    right.toString = right.toLocaleString = right.valueOf = null;
    this.ok(Spec.equals(left, right), "Objects with identical own properties should be equal");

    // Instances.
    this.ok(Spec.equals(new First(), new First()), "Object instances should be equal");
    this.ok(Spec.equals(new First(), new Second()), "Objects with different constructors and identical own properties should be equal");
    this.ok(Spec.equals({ "toString": new Number(1) }, new First()), "Object instances and objects sharing equivalent properties should be equal");
    this.notOk(Spec.equals({ "toString": 2 }, new Second()), "The prototype chain of objects should not be examined");

    // Circular arrays.
    (left = []).push(left);
    (right = []).push(right);
    this.ok(Spec.equals(left, right), "Arrays containing circular references should be equal");
    left.push(new String("Kit"));
    right.push("Kit");
    this.ok(Spec.equals(left, right), "Arrays containing circular references and equivalent properties should be equal");
    left.push("John-David");
    right.push(new String("Maddy"));
    this.notOk(Spec.equals(left, right), "Arrays containing circular references and different properties should not be equal");

    // Circular objects.
    left = { "abc": null };
    right = { "abc": null };
    left.abc = left;
    right.abc = right;
    this.ok(Spec.equals(left, right), "Objects containing circular references should be equal");
    left.def = new Number(75);
    right.def = 75;
    this.ok(Spec.equals(left, right), "Objects containing circular references and equivalent properties should be equal");
    left.def = 75;
    right.def = new Number(63);
    this.notOk(Spec.equals(left, right), "Objects containing circular references and different properties should not be equal");

    // Cyclic structures.
    left = [{ "abc": null }];
    right = [{ "abc": null }];
    (left[0].abc = left).push(left);
    (right[0].abc = right).push(right);
    this.ok(Spec.equals(left, right), "Cyclic structures should be equal");
    left[0].def = new String("Kit");
    right[0].def = "Kit";
    this.ok(Spec.equals(left, right), "Cyclic structures containing equivalent properties should be equal");
    left[0].def = "Kit";
    right[0].def = new String("Maddy");
    this.notOk(Spec.equals(left, right), "Cyclic structures containing different properties should not be equal");

    // Complex circular references.
    left = { "foo": { "b": { "foo": { "c": { "foo": null } } } } };
    right = { "foo": { "b": { "foo": { "c": { "foo": null } } } } };
    left.foo.b.foo.c.foo = left;
    right.foo.b.foo.c.foo = right;
    this.ok(Spec.equals(left, right), "Cyclic structures with nested and identically-named properties should be equal");

    this.done(expected);
  });

  testSuite.addTest("Spec.defer", function (test) {
    Spec.defer(function () {
      test.ok(true, "`defer` should defer execution in supported environments");
      Spec.defer(function () {
        // Nested calls will execute synchronously in supported envrionments.
        test.ok(true, "Nested `defer` calls should be supported");
        test.done(2);
      });
    });
  });

  // Custom events. Unit tests adapted from Backbone.
  // ------------------------------------------------

  testSuite.addTest("Events#on, emit", function (test) {
    var events = new Spec.Events();

    // Test event handler arguments.
    events.on("arguments", function (event) {
      test.strictEqual(Object(event), event, "The event handler function should be called with the event object as its argument");
      test.equal(event.type, "arguments", "The event type should reference the name of the current event");
      test.equal(event.target, this, "The event target should refer to the current object if an explicit `target` property was not specified");
    }).emit("arguments");

    // Test event object properties.
    events.on("object", function (event) {
      test.equal(event.target, 123, "An explicit `target` property should override the default event target");
      test.equal(event.message, "How quickly daft jumping zebras vex", "Custom event object properties are permitted");
    }).emit({
      "type": "object",
      "target": 123,
      "message": "How quickly daft jumping zebras vex"
    });

    events.size = 0;
    events.on("test", function () {
      this.size += 1;
    }).emit("test");

    this.equal(events.size, 1, "The `size` property should be incremented once after the `test` event is fired");
    events.emit("test").emit("test").emit("test").emit("test");
    this.equal(events.size, 5, "The `size` property should be incremented once each time the `test` event is fired");

    events.on("second");
    this.notOk(events.events.second, "Calling `on` without an event handler argument should not modify the event registry");

    this.done(8);
  });

  testSuite.addTest("Events:all", function (test) {
    var events = new Spec.Events();
    events.size = 0;
    events.on("all", function (event) {
      this.size += 1;
      switch (event.type) {
        case "first":
          test.ok(true, "The `first` event should be fired");
          break;
        case "second":
          test.equal(event.message, 1, "The custom `message` property should be passed as part of the `second` event object");
          break;
        case "third":
          test.equal(event.message, "How quickly daft jumping zebras vex", "The messages passed to the `second` and `third` events should differ");
          break;
        default:
          test.ok(false, Newton.substitute("Unexpected event fired: `%o`.", event));
      }
    }).emit("first").emit({
      "type": "second",
      "message": 1
    }).emit({
      "type": "third",
      "message": "How quickly daft jumping zebras vex"
    });
    test.equal(events.size, 3, "The `size` property should be incremented each time an event is fired");

    events.size = 0;
    events.removeListener("all").on("all", function () {
      events.size += 1;
    }).emit("all");
    test.equal(events.size, 1, "The `all` event should not be fired twice if it is explicitly fired");

    test.done(5);
  });

  testSuite.addTest("Events#removeListener", function () {
    var events = new Spec.Events();
    events.size = 0;
    events.on("test", function () {
      events.size += 1;
    }).emit("test").removeListener("test").emit("test");
    this.equal(events.size, 1, "The `size` property should have only been incremented once, after which the event handler is removed");
    this.ok(Newton.isEmpty(events.events), "The event registry should be empty");
    this.done(2);
  });

  testSuite.addTest("Events: Multiple event handlers", function () {
    var events = new Spec.Events();
    events.counterA = events.counterB = 0;
    function callback() {
      events.counterA += 1;
    }
    events.on("test", callback).on("test", function () {
      events.counterB += 1;
    }).emit("test").removeListener("test", callback).emit("test");
    this.equal(events.counterA, 1, "The `counterA` property should have only been incremented once");
    this.equal(events.counterB, 2, "The `counterB` property should have been incremented twice");
    this.done(2);
  });

  testSuite.addTest("Events: Remove a firing event handler", function () {
    var events = new Spec.Events();
    events.size = 0;
    function callback() {
      events.size += 1;
      events.removeListener("test", callback);
    }
    events.on("test", callback).emit("test").emit("test").emit("test");
    this.equal(events.size, 1, "The `size` property should have only been incremented once");
    this.ok(Newton.isEmpty(events.events.event), "The event handler should have been removed");
    this.done(2);
  });

  testSuite.addTest("Events:one", function () {
    var events = new Spec.Events();
    events.counterA = events.counterB = 0;
    function first() {
      events.counterA += 1;
      events.removeListener("one", first);
    }
    function second() {
      events.counterB += 1;
      events.removeListener("one", second);
    }
    events.on("one", first).on("one", second).emit("one").emit("one").emit("one");
    this.equal(events.counterA, 1, "The `counterA` property should have only been incremented once");
    this.equal(events.counterB, 1, "The `counterB` property should have only been incremented once");
    this.done(2);
  });

  testSuite.addTest("Events: `context`", function (test) {
    var events = new Spec.Events();
    function Context() {}
    Context.prototype.assert = function () {
      test.ok(true, "`this` should be bound to the event handler");
    };
    events.on("context", function () {
      this.assert();
    }, new Context());
    events.emit("context");
    test.done(1);
  });

  testSuite.addTest("Events#emit, removeListener", function (test) {
    var events = new Spec.Events();
    events.size = 0;
    function first() {
      events.size += 1;
      events.removeListener("test", first);
      events.emit("test");
    }
    function second() {
      events.size += 1;
    }
    events.on("test", first).on("test", second).emit("test");
    test.equal(events.size, 3, "The `size` property should have been incremented three times");
    test.done(1);
  });

  testSuite.addTest("Events: Modifications to the event registry should not affect firing events", function () {
    var events = new Spec.Events(), size = 0;
    function callback() {
      size += 1;
    }
    events.on("test", function () {
      events.on("test all", callback);
    }).emit("test");
    this.notOk(size, "`on` invocations should not affect the behavior of `emit`");
    events.removeListener().on("test", function () {
      events.removeListener("test all", callback);
    }).on("test all", callback).emit("test");
    this.equal(size, 2, "`removeListener` invocations should not affect the behavior of `emit`");
    this.done(2);
  });

  // Suites.
  // -------

  testSuite.addTest("Suite#run", function (test) {
    var suite = new Spec.Suite(), events = [];
    this.equal(suite.name, Spec.Suite.prototype.name, "The default suite name should be used if one is not specified");
    suite.addTest("Test 1", function () {
      this.ok(true).done(1);
    }).addTest("Test 2", function () {
      this.ok(false).done(2);
    });
    suite.on("all", function (event) {
      if (event.type != "complete") {
        events.push([event.type, event.target]);
      }
    }).on("complete", function () {
      var results = [["start", suite],
        // Test 1.
        ["setup", suite[0]], ["assertion", suite[0]], ["teardown", suite[0]],
        // Test 2.
        ["setup", suite[1]], ["failure", suite[1]], ["failure", suite[1]], ["teardown", suite[1]]
      ];
      test.deepEqual(events, results, "Events should be fired as the suite runs");
      test.done(2);
    });
    suite.run();
  });

  testSuite.addTest("Suite#addTest, index", function () {
    var suite = new Spec.Suite();
    suite.addTest("Test 1", function () {});
    this.ok(suite[0], "A named test should have been added to the suite");

    suite.addTest(function () {});
    this.ok(suite[1], "An anonymous test should have been added to the suite");
    this.equal(suite[1].name, Spec.Test.prototype.name, "The default test name should be used if one is not specified");
    this.equal(suite.length, 2, "Adding tests to the suite should update its `length` property");

    suite.push(null, undefined, false, {});
    suite.addTest("Test 3", function () {});
    this.equal(suite.length, 7, "Pushing elements onto the suite should update its `length` property");
    this.equal(suite.index(), 0, "Calling `index` without any arguments should return the index of the first valid test");
    this.equal(suite.index(2), 6, "Calling `index` with a position at which a test does not exist should return the index of the next valid test");
    this.equal(suite.index(-2), 6, "Calling `index` with a negative number should return the index of the first valid test relative to the end of the suite");
    this.equal(suite.index(7), null, "`index` should return `null` if the given position is out of bounds");
    this.done(9);
  });

  // Tests.
  // ------

  testSuite.addTest("Test:setup, teardown", function (self) {
    new Spec.Test(function (test) {
      self.equal(this.message, "Pack my box with five dozen liquor jugs", "The `setup` event should have created a `message` property");
      this.message = "How quickly daft jumping zebras vex";
      this.done();
    }).on("setup", function (event) {
      self.equal(this, event.target, "The `setup` event target should be set correctly");
      this.message = "Pack my box with five dozen liquor jugs";
    }).on("teardown", function (event) {
      self.equal(this, event.target, "The `teardown` event target should be set correctly");
      self.equal(this.message, "How quickly daft jumping zebras vex", "The `teardown` event should reflect changes made to the test");
    }).run();

    this.done(4);
  });

  // Assertions.
  // -----------

  testSuite.addTest("Test.assert", function (test) {
    var context = {
      "message": "test",
      "ok": function (expression, event) {
        test.ok(expression, "The value returned by the assertion function should be passed to the `ok` function");
        test.strictEqual(Object(event), event, "An event object should be passed as the second argument to the `ok` function");
        test.equal(event.message, context.message, "The `message` property of the event object should contain the name of the assertion if a `message` argument is not provided");
        test.equal(event.actual, 10, "The `actual` property of the event object should contain contain the actual value");
        test.equal(event.expected, 10, "The `expected` property of the event object should contain contain the expected value");
      }
    }, assertion = Spec.Test.assert("test", function (actual, expected) {
      test.equal(this, context, "The context of the assertion function should be set to its parent context");
      test.equal(actual, 10, "The `actual` value should be passed to the assertion function");
      test.equal(expected, 10, "The `expected` value should be passed to the assertion function");
      return actual == expected;
    });

    // Perform the test without a custom `message` argument. The message should
    // default to the name of the assertion.
    assertion.call(context, 10, 10);

    // Repeat the test with a custom `message` argument.
    context.message = "value";
    assertion.call(context, 10, 10, "value");

    test.done(16);
  });

  // **ok** tests whether an expression is truthy; **notOk** tests whether an
  // expression is falsy.
  testSuite.addTest("Test#ok, notOk", function () {
    this.ok(true, "`true` should be truthy");
    this.ok("Test", "Non-empty strings should be truthy");
    this.ok(new Number(0), "Number objects should be truthy");
    this.ok(new Boolean(false), "Boolean objects should be truthy");
    this.ok([], "Empty arrays should be truthy");
    this.ok({}, "Empty objects should be truthy");
    this.ok(-1, "Negative numbers should be truthy");

    this.notOk(false, "`false` should be falsy");
    this.notOk("", "The empty string should be falsy");
    this.notOk(0, "`0` should be falsy");
    this.notOk(null, "`null` should be falsy");
    this.notOk(undefined, "`undefined` should be falsy");
    this.notOk(NaN, "`NaN` should be falsy");

    this.done(13);
  });

  // **equal** tests whether two values should be equal using the *coercive* equality
  // algorithm; **notEqual** tests whether two values are different using the
  // same algorithm.
  testSuite.addTest("Test#equal, notEqual", function () {
    this.equal(0, 0, "`0` and `0` should be equal");
    this.equal("a", "a", "Comparing two strings");
    this.equal(null, null, "`null` values should be equal");

    // Common type coercions.
    this.equal(null, undefined, "`null` and `undefined` values should be equal");
    this.equal(undefined, null, "`undefined` and `null` values should be equal");
    this.equal(0, "0", "`0` and `'0'` should be equal");
    this.equal("1", 1, "`'1'` and `1` should be equal");
    this.equal(false, 0, "`false` and `0` should be equal");
    this.equal(true, 1, "`true` and `1` should be equal");
    this.equal("1", true, "`'1'` and `true` should be equal");
    this.equal(false, "0", "`false` and `'0'` should be equal");
    this.equal(1, new Number(1), "Numeric primitives and their corresponding object wrappers should be equal");
    this.equal([], "", "An empty array should be equal to the empty string");
    this.equal(new String("hello"), "hello", "String object wrappers and their primitive equivalents should be equal");

    this.notEqual({ 1: 2, 3: 4 }, { 1: 2, 3: 4 }, "Two cloned objects should not be equal");
    this.notEqual(true, false, "`true` and `false` should not be equal");
    this.notEqual(false, null, "`false` and `null` should not be equal");
    this.notEqual("hello", "bye", "Two string primitives with different values should not be equal");
    this.notEqual(0, 1, "Two different numbers should not be equal");
    this.notEqual(10, "15", "10 and `'15'` should not be equal");
    this.notEqual(NaN, NaN, "Two `NaN` values should not be equal");
    this.notEqual(new String("hello"), new String("hello"), "Two string object wrappers should not be equal");
    this.notEqual({}, {}, "Two empty object literals should not be equal");
    this.notEqual([], [], "Two empty array literals should not be equal");
    this.notEqual({}, [], "Array and object literals should not be equal");

    this.done(25);
  });

  // **strictEqual** and **notStrictEqual** use the *strict* equality algorithm.
  testSuite.addTest("Test#strictEqual, notStrictEqual", function () {
    var value = { "a": "b" };

    this.strictEqual(0, 0, "`0` and `0` should be strictly equal");
    this.strictEqual("a", "a", "Two string values with identical values should be strictly equal");
    this.strictEqual("", "", "Two empty strings should be strictly equal");
    this.strictEqual(undefined, undefined, "Two `undefined` values should be strictly equal");
    this.strictEqual(null, null, "Two `null` values should be strictly equal");
    this.strictEqual(true, true, "Two `true` values should be strictly equal");
    this.strictEqual(false, false, "Two `false` values should be strictly equal");
    this.strictEqual(value, value, "Identical object references should be strictly equal");

    this.notStrictEqual(NaN, NaN, "Two `NaN` values should not be strictly equal");
    this.notStrictEqual({ 1: 2, 3: 4 }, { 1: 2, 3: 4 }, "Two cloned objects should not be strictly equal");
    this.notStrictEqual(null, undefined, "`null` and `undefined` values should not be strictly equal");
    this.notStrictEqual(undefined, null, "`undefined` and `null` values should not be strictly equal");
    this.notStrictEqual(0, "0", "`0` and `'0'` should not be strictly equal");
    this.notStrictEqual("1", 1, "`'1'` and `1` should not be strictly equal");
    this.notStrictEqual(false, 0, "`false` and `0` should not be strictly equal");
    this.notStrictEqual(true, 1, "`true` and `1` should not be strictly equal");
    this.notStrictEqual("1", true, "`'1'` and `true` should not be strictly equal");
    this.notStrictEqual(false, "0", "`false` and `'0'` should not be strictly equal");
    this.notStrictEqual(1, new Number(1), "Numeric primitives and their corresponding object wrappers should not be strictly equal");
    this.notStrictEqual([], "", "An empty array should be equal to the empty string");
    this.notStrictEqual(new String("hello"), "hello", "String object wrappers and their primitive equivalents should not be strictly equal");

    this.done(21);
  });

  testSuite.addTest("Test#error, noError", function (test) {
    var expected;

    // Returns a function that throws an instance of the given `exception`
    // constructor.
    function create(exception) {
      return function () {
        throw exception("Yikes!");
      };
    }

    this.error(create(TypeError), function (exception, context) {
      test.equal(this, context, "The context of the callback function should be equivalent to the value of the `context` argument");
      test.equal(context, test, "The value of the `context` argument should be the current test");
      test.equal(typeof exception, "object", "The caught exception should be passed as the first argument to the callback function");
      return exception.name == "TypeError" && exception.message == "Yikes!";
    }, "A callback function may be used to validate the thrown exception");

    this.noError(function () {
      return 1;
    }, "`noError` should ensure that the given callback function does not throw an exception");

    this.noError(function () {
      new Spec.Test(function () {
        this.noError(create(Error)).done(0);
      }).on("assertion", function () {
        test.ok(false, "An `assertion` event should not be fired");
      }).on("failure", function () {
        test.ok(true, "A `failure` event should be fired");
      }).run();
    }, "`noError` should catch any thrown exceptions");

    // A `failure` event should be fired if the validation function or
    // RegExp doesn't match the thrown exception.
    expected = 0;
    new Spec.Test(function () {
      this.error(create(TypeError), function (exception) {
        return exception.name == "SyntaxError";
      });
      this.error(create(Error), function (exception) {
        return exception.message == "Ack!";
      });
      this.done(0);
    }).on("assertion", function () {
      test.ok(false, "An `assertion` event should not be fired");
    }).on("failure", function () {
      expected += 1;
    }).run();
    this.equal(expected, 2, "Two `failure` events should have been fired");

    this.done(8);
  });

  // Shuffle the tests to ensure that state leakage does not occur.
  testSuite.shuffle();

  // Run or export the tests.
  if (isLoader) {
    define(function () {
      return testSuite;
    });
  } else if (!isBrowser && (!isModule || (typeof module == "object" && module == require.main))) {
    testSuite.run();
  }
})(this);