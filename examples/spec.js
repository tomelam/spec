(function() {

  // Create a new spec.
  var spec = Spec('Miniatures Unit Tests'), escapable, escapes, quote, serialize, stringify = typeof JSON == 'object' && JSON && JSON.stringify, toString = Object.prototype.toString;

  // ECMAScript 5-compliant `JSON.stringify` fallback.
  if (typeof stringify != 'function' || stringify(void 0) !== void 0) {
    // Matches control characters, double quotes, and the escape character.
    escapable = /[\x00-\x1f"\\]/g;
    // A hash of escape sequences for control characters.
    escapes = {
      '\b': '\\b',
      '\t': '\\t',
      '\n': '\\n',
      '\f': '\\f',
      '\r': '\\r',
      '"': '\\"',
      '\\': '\\\\'
    };
    // Replaces a control character with its corresponding escape sequence.
    quote = function(value) {
      var result = '"', index, lastIndex = escapable.lastIndex = 0, match;
      value = '' + value;
      // Walk the input string.
      while (match = escapable.exec(value)) {
        index = match.index;
        match = match[0];
        // Append all characters before the control character.
        result += value.slice(lastIndex, index);
        // Update the RegExp's `lastIndex` property.
        lastIndex = escapable.lastIndex = index + match.length;
        // Append and cache the escape sequence.
        result += escapes[match] || (escapes[match] = ('\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4)));
      }
      // Append the remainder of the input string.
      if (lastIndex < value.length) result += value.slice(lastIndex);
      return result + '"';
    };
    // Recursively serializes an object. Based on work by Tobie Langel.
    serialize = function(key, value, stack) {
      var type, className, length, results, member, month, date, hours, minutes, seconds;
      value = value[key];
      if (typeof value == 'object') {
        // Fallback for environments that don't implement `Date#toJSON`.
        if (toString.call(value) == '[object Date]' && !('toJSON' in value) && typeof value.toJSON != 'function') {
          if (isFinite(+value)) {
            // Use `Date#toISOString` if available.
            if (typeof value.toISOString == 'function') {
              value = value.toISOString();
            } else {
              // See section 15.9.1.15 of the ES5 spec for the ISO date format.
              month = value.getUTCMonth() + 1;
              date = value.getUTCDate();
              hours = value.getUTCHours();
              minutes = value.getUTCMinutes();
              seconds = value.getUTCSeconds();
              // Months, dates, hours, minutes, and seconds should have two digits; milliseconds should have three digits.
              value = value.getUTCFullYear() + '-' + (month < 10 ? '0' + month : month) + '-' + (date < 10 ? '0' + date : date) + 'T' + (hours < 10 ? '0' + hours : hours) + ':' + (minutes < 10 ? '0' + minutes : minutes) + ':' + (seconds < 10 ? '0' + seconds : seconds) + '.' + ('000' + value.getUTCMilliseconds()).slice(-3) + 'Z';
            }
          } else {
            value = null;
          }
        } else if (typeof value.toJSON == 'function') {
          // Call the object's `toJSON` method to obtain a replacement value.
          value = value.toJSON(key);
        }
      }
      // Get the object's internal [[Class]] name.
      className = value != null && toString.call(value);
      // Convert numbers, strings, and booleans to primitives.
      if (className == '[object Number]' || className == '[object String]' || className == '[object Boolean]') value = value.valueOf();
      type = typeof value;
      // Serialize `Infinity`, `NaN`, and `null` values as `"null"`.
      if (type == 'number' && !isFinite(value) || value === null) return 'null';
      switch (type) {
        // `true`, `false`, and numbers are represented as such.
        case 'boolean':
          return value ? 'true' : 'false';
        case 'number':
          return '' + value;
        // Double-quote strings and escape all control characters.
        case 'string':
          return quote(value);
        // Recursively serialize arrays and objects.
        case 'object':
          // Ensure that the object is not a cyclic structure.
          length = stack.length;
          while (length--) if (stack[length] == value) throw new TypeError('Cyclic structure.');
          // Add the object to the stack of serialized objects.
          stack.push(value);
          results = [];
          if (className == '[object Array]') {
            length = value.length;
            while (length--) {
              // Serialize each member.
              member = serialize(length, value, stack);
              results[length] = member === void 0 ? 'null' : member;
            }
            results = '[' + results.join(',') + ']';
          } else {
            for (length in value) {
              member = serialize(length, value, stack);
              // Skip members that can't be serialized.
              if (member !== void 0) results.push(quote(length) + ':' + member);
            }
            results = '{' + results.join(',') + '}';
          }
          // Once the object has been serialized, remove it from the stack.
          stack.pop();
          return results;
      }
    };
    // Returns a JSON string from a JavaScript value.
    stringify = function(value) {
      // See section 15.12.3 of the ES5 spec.
      return serialize('', {'': value}, []);
    };
  }

  // Bind the event handlers.
  spec.bind('start', function() {
    // `start` is triggered before any tests are run.
    console.log('Started spec `' + this.name + '`.');
  });

  spec.bind('setup', function(test, spec) {
    // `setup` is triggered at the start of each test.
    console.log('Started test `' + test.name + '`.');
  });

  spec.bind('assertion', function(data, test) {
    // `assertion` is triggered when an assertion succeeds.
    console.log('Assertion: ' + data.message + '.');
  });

  spec.bind('failure', function(data) {
    // `failure` is triggered when an assertion fails.
    console.log('Failure: ' + data.message + '. Expected: ' + stringify(data.expected) + '. Actual: ' + stringify(data.actual) + '.');
  });

  spec.bind('teardown', function(test) {
    // `teardown` is triggered at the end of each test.
    console.log('Finished test `' + test.name + '`. ' + test.assertions + ' assertions, ' + test.failures + ' failures.');
  });

  spec.bind('complete', function(spec) {
    // `complete` is triggered once all tests have finished running.
    console.log('Finished spec `' + spec.name + '`.');
    console.log(this.length + ' specs, ' + this.assertions + ' assertions, ' + this.failures + ' failures.');
  });

  spec.test('ajax', function(test) {
    Miniatures.ajax({
      'url': 'spec.html',
      'complete': function(transport) {
        test.ok(transport.responseText);
        test.done(1);
      }
    });
  });

  spec.test('sortBy', function(test) {
    var data = [{
      'name': 'John-David Dalton',
      'nickname': 'jddalton'
    }, {
      'name': 'Aaron Beal',
      'nickname': 'adbeal'
    }, {
      'name': 'Kit Goncharov',
      'nickname': 'ksgoncharov'
    }, {
      'name': 'Maddy Jalbert',
      'nickname': 'mcjalbert'
    }];

    this.deepEqual(Miniatures.sortBy(data, function(value) {
      return value.nickname.length;
    }), [{
      'name': 'Aaron Beal',
      'nickname': 'adbeal'
    }, {
      'name': 'John-David Dalton',
      'nickname': 'jddalton'
    }, {
      'name': 'Maddy Jalbert',
      'nickname': 'mcjalbert'
    }, {
      'name': 'Kit Goncharov',
      'nickname': 'ksgoncharov'
    }]);

    this.done();
  });

  spec.run();

}());