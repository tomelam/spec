Spec
====

**Spec** is an event-driven JavaScript unit testing library. It provides several convenience methods and assertions for writing unit tests, and can test both synchronous and asynchronous code. Spec's test runner delegates to user-defined custom events, allowing you to create routines for setting up and tearing down tests, handling assertions, failures, and errors, and logging test results. Additionally, Spec is environment and framework-agnostic: it has no external dependencies, and is compatible with web browsers, CommonJS implementations, and JavaScript engines.

The [annotated source code](http://kitgoncharov.github.com/spec/docs/spec.html) and [example spec](http://kitgoncharov.github.com/spec/examples/spec.html) are available for your perusal.

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
* [Mathias Bynens](http://mathiasbynens.be)

## MIT License

Copyright &copy; 2011 [Kit Goncharov](http://kitgoncharov.github.com).

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.