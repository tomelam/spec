Spec
====

**Spec** is a JavaScript unit testing library. It provides several convenience methods for writing unit tests, and includes an event-driven test runner. This allows you to create custom routines for setting up and tearing down tests, handling assertions, failures, and errors, and logging test results.

Spec is environment and framework-agnostic: it has no external dependencies, and is compatible with web browsers, [CommonJS](http://www.commonjs.org/) implementations, and JavaScript engines. It is also capable of testing both synchronous and asynchronous code.

The [annotated source code](http://kitgoncharov.github.com/Spec/docs/spec.html) and [example spec](http://kitgoncharov.github.com/Spec/examples/spec.html) are available for your perusal.

## Using Spec

You can either [**download** the latest version](http://kitgoncharov.github.com/Spec/spec.js) of Spec from GitHub, or **install** it via [npm](http://npmjs.org):

    $ npm install spec

### Web Browsers

Spec has been tested with the following web browsers:

* Microsoft [Internet Explorer](http://www.microsoft.com/windows/internet-explorer) for Windows, version 5.5 and higher
* Mozilla [Firefox](http://www.mozilla.com/firefox), version 1.5 and higher
* Apple [Safari](http://www.apple.com/safari), version 2.0 and higher
* Google [Chrome](http://www.google.com/chrome), version 1.0 and higher
* [Opera](http://www.opera.com) 7.54 and higher
* [Mozilla](http://www.mozilla.org/projects/browsers.html) 1.7.2, [Netscape](http://browser.netscape.com/releases) 7.2, and [SeaMonkey](http://www.seamonkey-project.org/) 1.0 and higher
* [Konqueror](http://www.konqueror.org) 3.4.3 and higher

#### Example

    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>Sample Spec</title>
      </head>
      <body>
        <script src="/path/to/spec.js"></script>
        <script>
          var spec = Spec('Sample Spec');
          spec.bind('start', function() {
            // ...
          });
          // ...
          spec.test('Sample Test', function() {
            // ...
          });
          // ...
          spec.run();
        </script>
      </body>
    </html>

### CommonJS Implementations

Spec has been tested with the following CommonJS implementations:

* [Node](http://nodejs.org/) 0.2.6 and higher
* [Narwhal](http://narwhaljs.org/) 0.3.2 and higher
* [RingoJS](http://ringojs.org/) 0.4 and higher

#### Example

    var Spec = require('spec').Spec, spec = Spec('Sample Spec');
    spec.bind('start', function() {
      // ...
    });
    // ...
    spec.test('Sample Test', function() {
      // ...
    });
    // ...
    spec.run();

### JavaScript Engines

Spec has been tested with the following JavaScript engines:

* Mozilla [SpiderMonkey](http://www.mozilla.org/js/spidermonkey), version 1.5.0 and higher
* Mozilla [Rhino](http://www.mozilla.org/rhino) 1.7R1 and higher
* WebKit [JSC](https://trac.webkit.org/wiki/JSC)
* Google [V8](http://code.google.com/p/v8)

#### Example

    load('/path/to/spec.js');
    var spec = Spec('Sample Spec');
    spec.bind('start', function() {
      // ...
    });
    // ...
    spec.test('Sample Test', function() {
      // ...
    });
    // ...
    spec.run();

## Contributing to Spec

Check out a working copy of the Spec source code with [Git](http://git-scm.com/):

    $ git clone git://github.com/kitgoncharov/Spec.git

If you'd like to contribute a feature or bug fix, you can [fork](http://help.github.com/forking/) Spec, commit your changes, and [send a pull request](http://help.github.com/pull-requests/). Please avoid submitting patches that are application- or environment-specific; Spec doesn't try to cover every possible testing scenario.

Alternatively, you may use the [GitHub issue tracker](http://github.com/kitgoncharov/Spec/issues) to submit bug reports and feature requests. For the former, please make sure that you detail how to reproduce the bug, *including the environments that exhibit it*.

### Coding Guidelines

In addition to the following [Prototype-inspired](http://prototypejs.org/contribute) guidelines, please follow the conventions already established in the code.

- **Spacing**: Use two spaces, not tabs, for indentation. Avoid lines longer than 80 characters; if necessary, break statements across multiple lines.
- **Naming**: Keep variable and method names concise but descriptive. `index` and `callback` are preferable to `i` and `fn`.
- **Comments**: Significant changes and new methods should be annotated with single-line comments.
- **Performance**: Don't overuse abstractions or slow down critical code to add a feature of marginal utility.
- **Lint**: Make sure that your changes pass [JavaScript Lint](http://javascriptlint.com/). A configuration file is included in the repository; run `jsl -conf jsl.conf` from the command line to check the source code for problems.

### Contributors

* [John-David Dalton](http://allyoucanleet.com/)
* [Mathias Bynens](http://mathiasbynens.be/)

## MIT License

Copyright &copy; 2011 [Kit Goncharov](http://kitgoncharov.github.com).

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.