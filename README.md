Spec
====

Spec is an event-driven JavaScript unit testing library. It provides several convenience methods and assertions for writing unit tests, and can test both synchronous and asynchronous code. Spec's test runner delegates to user-defined custom events, allowing you to create routines for setting up and tearing down tests, handling assertions, failures, and errors, and logging test results. Additionally, Spec is environment and framework-agnostic: it has no external dependencies, and is compatible with web browsers, CommonJS implementations, and JavaScript engines.

## Events

The `Spec.Events` module provides methods for adding, removing, and firing **custom events**. All specs and tests inherit from this module.

- `bind(event, callback)`: Binds a **callback** function, invoked each time the **event** is triggered.
- `one(event, callback)`: Binds a one-time **callback** function, removed when the **event** is triggered.
- `unbind([event], [callback])`: Removes a previously-bound **callback** function. If the callback is omitted, all callbacks for the **event** are removed. If both arguments are omitted, *all* event callbacks are removed.
- `trigger(event, [*arguments])`: Invokes all callbacks for the given **event**. Subsequent **arguments** are passed to each callback.

## Specs

The `Spec` function creates a new **spec**, or collection of related unit tests. Specs provide methods for adding, manipulating, and running tests.

- `test([name], test)`: Adds a new **test** function to the spec. The **name** is optional.
- `invoke(name, [*arguments])`: Invokes the method **name** with optional **arguments** for each test in the spec.
- `run()`: Successively runs all tests in the spec.

### Events

- `start(spec)`: Triggered before any tests are run. `spec` references the current spec.
- `setup(test, spec)`: Triggered at the start of each test. `test` references the current test.
- `assertion(data, test, spec)`: Triggered when a test assertion, such as `ok`, `equal`, or `deepEqual`, succeeds. `data` is an object with three properties: `actual` contains the actual value passed to the assertion, `expected` contains the expected value, and `message` contains the assertion message.
- `failure(data, test, spec)`: Triggered when an assertion fails.
- `error(error, test, spec)`: Triggered when a test throws an error. The error is passed as the first argument.
- `teardown(test, spec)`: Triggered at the end of each test.
- `complete(spec)`: Triggered once all tests have finished running.

## Tests

The `Spec.Test` constructor wraps a test function with several convenience methods and assertions.

### Assertions and Methods

- `run()`: Runs the test.
- `assert(actual, expected, message)`: Records an assertion and triggers the `assertion` event.
- `fail(actual, expected, message)`: Records a failure and triggers the `failure` event.
- `ok(value, [message])`: Tests whether `value` is truthy. *Note*: To test strictly for the boolean `true`, use `equal()` instead. The default message is the name of the assertion (e.g., `ok`).
- `equal(actual, expected, [message])`: Tests whether `actual` is identical to `expected`, as determined by the `===` operator.
- `notEqual(actual, expected, [message])`: Tests for strict inequality (`actual !== expected`).
- `looseEqual(actual, expected, [message])`: Tests for **loose** or coercive equality (`actual == expected`).
- `notLooseEqual(actual, expected, [message])`: Tests for loose inequality (`actual != expected`).
- `deepEqual(actual, expected, [message])`: Tests for deep equality and **equivalence**.
- `notDeepEqual(actual, expected, [message])`: Tests for deep inequality.
- `raises(block, [expected, message])`: Tests whether `block` throws an error. `expected` may be omitted, or specify a validation RegExp or function.
- `done([assertions])`: Completes the test. `expected` may optionally specify the expected number of assertions. This method **must** be called at the end of each test.

### Events

- `setup(test)`: Triggered before the test function is called.
- `assertion(data, test)`: Triggered when an assertion succeeds.
- `failure(data, test)`: Triggered when an assertion fails.
- `error(error, test`: Triggered when the test function throws an error.
- `teardown(test)`: Triggered when `done` is called.

## Contributing to Spec

Check out a working copy of the Spec source code with [Git](http://git-scm.com):

    $ git clone git://github.com/kitgoncharov/spec.git

If you'd like to contribute a feature or bug fix, you can [fork](http://help.github.com/forking) Spec, commit your changes, and [send a pull request](http://help.github.com/pull-requests). Please avoid submitting patches that are application- or environment-specific; Spec doesn't try to cover every possible testing scenario.

Alternatively, you may use the [issue tracker](http://github.com/kitgoncharov/spec/issues) to submit bug reports and feature requests. For the former, please make sure that you detail how to reproduce the bug, *including the environments that exhibit it*.

### Coding Guidelines

In addition to the following [Prototype-inspired](http://prototypejs.org/contribute) guidelines, please follow the conventions already established in the code.

- **Spacing**: Two spaces are used for indentation. No tabs. Avoid lines longer than 80 characters; if necessary, break statements across multiple lines.
- **Naming**: Please use concise but descriptive variable and method names. `index` and `callback` are preferable to `i` and `fn`.
- **Comments**: Significant contributions should be annotated with single-line comments. No block comments.
- **Performance**: Avoid overusing abstractions, or slowing down critical code to add a feature of marginal utility.
- **Lint**: A configuration file for [JavaScript Lint](http://javascriptlint.com) is included in the repository. From the command line, run `jsl -conf jsl.conf` to check the source code for errors.

### Contributors

* [John-David Dalton](http://allyoucanleet.com)

## MIT License

Copyright &copy; 2011 [Kit Goncharov](http://kitgoncharov.github.com).

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.