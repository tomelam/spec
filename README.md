Spec
====

**Spec** is an event-driven unit testing library. It provides several convenience methods for writing unit tests, and includes a configurable test runner that allows you to create routines for setting up and tearing down tests, handling assertions, failures, and errors, and logging test results.

Spec is environment and framework-agnostic: it has no external dependencies, and is compatible with web browsers, [CommonJS](http://www.commonjs.org/) environments, and JavaScript engines. It is also capable of testing both synchronous and asynchronous code.

## Downloads

**Current Version**: [1.0.0rc4](http://kitcambridge.github.com/spec/lib/spec.js)

If you're a [Node](http://nodejs.org/) user, Spec is available on [npm](http://npmjs.org/):

    $ npm install spec

The [annotated source code](http://kitcambridge.github.com/spec/docs/index.html) is available for your perusal.

## Compatibility

Spec has been **tested** with the following web browsers, CommonJS environments, and JavaScript engines.

### Web Browsers

- Windows [Internet Explorer](http://www.microsoft.com/windows/internet-explorer), version 6.0 and higher
- Mozilla [Firefox](http://www.mozilla.com/firefox), version 1.0 and higher
- Apple [Safari](http://www.apple.com/safari), version 2.0 and higher
- Google [Chrome](http://www.google.com/chrome), version 1.0 and higher
- [Opera](http://www.opera.com) 7.02 and higher
- [Mozilla](http://www.mozilla.org/projects/browsers.html) 1.0, [Netscape](http://browser.netscape.com/releases) 6.2.3, and [SeaMonkey](http://www.seamonkey-project.org/) 1.0 and higher

### CommonJS Environments

- Node 0.2.6 and higher
- [Narwhal](http://narwhaljs.org/) 0.3.2 and higher
- [RingoJS](http://ringojs.org/) 0.4 and higher

### JavaScript Engines

- Mozilla [SpiderMonkey](http://www.mozilla.org/js/spidermonkey), version 1.5.0 and higher
- Mozilla [Rhino](http://www.mozilla.org/rhino) 1.5R5 and higher
- WebKit [JSC](https://trac.webkit.org/wiki/JSC)
- Google [V8](http://code.google.com/p/v8)

## Contributing to Spec

Check out a working copy of the Spec source code with [Git](http://git-scm.com/):

    $ git clone git://github.com/kitcambridge/spec.git

If you'd like to contribute a feature or bug fix, you can [fork](http://help.github.com/forking/) Spec, commit your changes, and [send a pull request](http://help.github.com/pull-requests/). Please avoid submitting patches that are application- or environment-specific; Spec doesn't try to cover every possible testing scenario. Please make sure to update the unit tests in the `test` directory as well.

Alternatively, you may use the [GitHub issue tracker](http://github.com/kitcambridge/spec/issues) to submit bug reports and feature requests. For the former, please make sure that you detail how to reproduce the bug, *including the environments that exhibit it*.

### Coding Guidelines

In addition to the following [Prototype-inspired](http://prototypejs.org/contribute) guidelines, please follow the conventions already established in the code.

- **Spacing**: Use two spaces for indentation. No tabs.
- **Naming**: Keep variable and method names concise but descriptive. `index` and `callback` are preferable to `i` and `fn`.
- **Functions**: Use [named function expressions](http://kangax.github.com/nfe/) to aid in debugging. Avoid anonymous functions.
- **Comments**: Significant changes and new methods should be annotated with comments.
- **Lint**: Make sure that your changes pass [JavaScript Lint](http://javascriptlint.com/). A configuration file is included in the repository; to check the source code for problems, run `jsl -conf jsl.conf`.

### Contributors

- [John-David Dalton](http://allyoucanleet.com/)
- [Mathias Bynens](http://mathiasbynens.be/)

## MIT License

Copyright &copy; 2011-2012 [Kit Cambridge](http://kitcambridge.github.com).

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.