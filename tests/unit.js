/* Spec Unit Tests */

// Load Spec.
var Spec;
if (typeof require == 'function' && typeof exports == 'object' && exports) {
  // CommonJS implementation (Node, Ringo, etc.).
  Spec = require('../spec').Spec;
} else if (typeof load == 'function') {
  // JavaScript engine (Mozilla Rhino, JSC, V8, etc.).
  load('../spec.js');
}

if (typeof Spec != 'function') throw new Error('Spec is required to run the unit tests.');

(function() {
  var Tests = Spec.Tests = new Spec('Spec Unit Tests'), stringify = typeof JSON == 'object' && JSON && JSON.stringify;

  if (typeof stringify != 'function') {
    throw new Error('...');
    // ...
  }

  // Bind the event handlers.
  Tests.bind('start', function() {
    // Triggered before any tests are run.
    console.log('Started spec `' + this.name + '`.');
  }).bind('setup', function(event) {
    // Triggered at the start of each test.
    console.log('Started test `' + event.target.name + '`.');
  }).bind('assertion', function(event) {
    // Triggered when a test assertion succeeds.
    console.log('Assertion: ' + event.message + '.');
  }).bind('failure', function(event) {
    // Triggered when an assertion fails.
    console.log('Failure: ' + event.message + '. Expected: ' + stringify(event.expected) + '. Actual: ' + stringify(event.actual) + '.');
  }).bind('error', function(event) {
    // Triggered when a test or an event listener throws an error.
    console.log('Error: ' + stringify(event.error));
  }).bind('teardown', function(event) {
    // Triggered at the end of each test.
    console.log('Finished test `' + event.target.name + '`. ' + event.target.assertions + ' assertions, ' + event.target.failures + ' failures, ' + event.target.errors + ' errors.');
  }).bind('complete', function() {
    // Triggered once all tests have finished running.
    console.log('Finished spec `' + this.name + '`. ' + this.assertions + ' assertions, ' + this.failures + ' failures, ' + this.errors + ' errors.');
  });

  Tests.add('Spec::bind', function() {
    // ...
    this.done(0);
  }).add('Spec::unbind', function() {
    // ...
    this.done(0);
  }).add('Spec::trigger', function() {
    // ...
    this.done(0);
  }).add('Spec::add', function() {
    // ...
    this.done(0);
  }).add('Spec::run', function() {
    // ...
    this.done(0);
  }).add('Spec::Array Methods', function() {
    // ...
    this.done(0);
  });

  Tests.add('Test::run', function() {
    // ...
    this.done(0);
  }).add('Test::ok', function() {
    // ...
    this.done(0);
  }).add('Test::equal', function() {
    // ...
    this.done(0);
  }).add('Test::notEqual', function() {
    // ...
    this.done(0);
  }).add('Test::looseEqual', function() {
    // ...
    this.done(0);
  }).add('Test::notLooseEqual', function() {
    // ...
    this.done(0);
  }).add('Test::deepEqual', function() {
    // ...
    this.done(0);
  }).add('Test::notDeepEqual', function() {
    // ...
    this.done(0);
  }).add('Test::raises', function() {
    // ...
    this.done(0);
  }).add('Test::done', function() {
    // ...
    this.done(0);
  }).add('Test::bind', function() {
    // ...
    this.done(0);
  }).add('Test::unbind', function() {
    // ...
    this.done(0);
  }).add('Test::trigger', function() {
    // ...
    this.done(0);
  });

  // Run the tests.
  Tests.run();
}());