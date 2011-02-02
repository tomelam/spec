(function() {

  // Create a new spec.
  var spec = Spec('Miniatures Unit Tests');

  // Bind the event handlers.
  spec.bind('start', function() {
    // `start` is triggered before any tests are run.
    console.log('Started spec `%s`.', this.name);
  });

  spec.bind('setup', function(test, spec) {
    // `setup` is triggered at the start of each test.
    console.log('Started test `%s`.', test.name);
  });

  spec.bind('assertion', function(data, test) {
    // `assertion` is triggered when an assertion succeeds.
    console.info('Assertion: %s.', data.message);
  });

  spec.bind('failure', function(data) {
    // `failure` is triggered when an assertion fails.
    console.error('Failure: %s. Expected: %o. Actual: %o.', data.message,
      data.expected, data.actual);
  });

  spec.bind('teardown', function(test) {
    // `teardown` is triggered at the end of each test.
    console.log('Finished test `%s`. %i assertions, %i failures.',
      test.name, test.assertions, test.failures);
  });

  spec.bind('complete', function(spec) {
    // `complete` is triggered once all tests have finished running.
    console.log('Finished spec `%s`.', spec.name);
    console.info('%i tests, %i assertions, %i failures.', this.length,
      this.assertions, this.failures);
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