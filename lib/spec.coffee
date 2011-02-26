# Spec unit testing library
# http://github.com/kitgoncharov/Spec

# Copyright 2011, Kit Goncharov
# http://kitgoncharov.github.com

# Released under the MIT License.

# Specs
# -----

# Specs are event-driven collections of related unit tests. Using custom events, you can
# create routines for setting up and tearing down tests, handling assertions, failures,
# and errors, and logging test results.

(exports ? this).Spec = class
  # The current version of Spec. Keep in sync with `package.json`.
  @version = '1.0.0rc1'

  # Creates a new spec. The `name` is optional.
  constructor: (name) -> @name = typeof name is 'string' and name or 'Anonymous Spec'

  # Adds a new `test` function to the spec. The `name` is optional.
  add: (name, test) ->
    @push new Test(name, test)
    @

  # Successively runs each test in the spec.
  run: ->
    # Create the aggregate spec summary.
    @assertions = @failures = @errors = 0
    # Internal event listener invoked every time a test triggers an event.
    onTestEvent = (event) =>
      {target, type} = event
      # Proxy the triggered event.
      @trigger event
      if type is 'teardown'
        # Update the spec summary.
        @assertions += target.assertions
        @failures += target.failures
        @errors += target.errors
        # Unbind the helper event listener.
        @unbind 'all', onTestEvent
        # Remove the completed test and run the next test.
        if (target = @shift()) and typeof target.run is 'function'
          target.run()
        else
          # Ensure that the spec is empty.
          delete @[0] unless @length
          # Finish running the spec.
          @trigger 'complete'
    # Bind the helper event listener and run the tests.
    test.bind('all', onTestEvent) for test in @
    @trigger('start').shift().run()
    @

  # Array methods.
  {pop: @::pop, push: @::push, reverse: @::reverse, shift: @::shift, sort: @::sort, unshift: @::unshift} = []

  # Tests
  # -----

  # The internal `eq()` function recursively compares two objects. Based on work by Jeremy
  # Ashkenas, Philippe Rathe, and Mark Miller.
  getClass = {}.toString
  eq = (left, right, stack) ->
    # Identical objects and values. `0 === -0`, but they aren't equal.
    return left isnt 0 or 1 / left is 1 / right if left is right
    # A strict comparison is necessary because `null == undefined`.
    return left is right unless left?
    # Compare `[[Class]]` names (see the ECMAScript 5 spec, section 15.2.4.2).
    return false if (className = getClass.call(left)) isnt getClass.call(right)
    switch className
      # Compare strings, numbers, dates, and booleans by value.
      when '[object String]' then return left + '' is right + ''
      when '[object Number]', '[object Date]', '[object Boolean]'
        # Primitives and their corresponding object wrappers are equal.
        left = +left; right = +right
        # `NaN`s are non-reflexive.
        return left isnt left and right isnt right or left is right
      # Compare regular expressions.
      when '[object RegExp]' then return left.source is right.source and left.global is right.global and left.multiline is right.multiline and left.ignoreCase is right.ignoreCase
      # Compare functions.
      when '[object Function]' then return left is right
      # Compare array lengths to determine if a deep comparison is necessary.
      when '[object Array]' then return false if left.length isnt right.length
    # Recursively compare objects and arrays.
    if typeof left is 'object'
      # Assume equality for cyclic structures.
      return true for object in stack when object is left
      # Add the object to the stack of traversed objects.
      stack.push left
      result = true; size = sizeRight = 0
      for property, member of left
        # Count the expected number of properties.
        size++
        # Deep compare each member.
        break if not result = property of right and eq(member, right[property], stack)
      # Ensure that both objects have the same number of properties.
      if result
        # Break as soon as the expected number of properties is greater.
        break for key of right when ++sizeRight > size
        result = size is sizeRight
      # Remove the object from the stack once the comparison is complete.
      stack.pop()
      return result
    false

  @Test = class Test
    # The `Spec.Test` class wraps a `test` function with several convenience methods
    # and assertions. The `name` is optional.
    constructor: (name, test) ->
      if typeof name is 'function' and not test?
        test = name
        name = null
      @name = typeof name is 'string' and name or 'Anonymous Test'
      @test = if typeof test is 'function' then test else null

    # Runs the test.
    run: ->
      ok = typeof @test is 'function'
      @assertions = @failures = @errors = 0
      @trigger 'setup'
      try
        # Pass the wrapper as the first argument to the test function.
        @test(@) if ok
      catch error
        @errors++
        @trigger type: 'error', error: error
        ok = false
      finally
        # Invalid test function or error; finish running the test.
        @done() unless ok
      @

    # Tests whether `expression` is truthy. The optional `data` argument may specify either
    # an assertion message or an object with three properties: `actual` contains the actual
    # value passed to the assertion, `expected` contains the expected value, and `message`
    # contains the assertion message. The message defaults to the name of the current
    # assertion (e.g., `ok`). You can use this method to create custom assertions.
    ok: (expression, data) ->
      isData = typeof data is 'object' and data
      # Convert a data object into an event object.
      event = actual: (if isData and 'actual' of data then data.actual else expression), expected: (if isData and 'expected' of data then data.expected else true), message: (if isData then data.message else data)
      event.message = 'ok' unless typeof event.message is 'string' and event.message
      # Note: To test strictly for the boolean value `true`, use `equal()` instead.
      if expression
        @assertions++
        event.type = 'assertion'
      else
        @failures++
        event.type = 'failure'
      @trigger event

    # Tests whether `actual` is **identical** to `expected`, as determined by the `is`
    # operator.
    equal: (actual, expected, message) -> @ok actual is expected, actual: actual, expected: expected, message: typeof message is 'string' and message or 'equal'

    # Tests for **strict** inequality (`actual isnt expected`).
    notEqual: (actual, expected, message) -> @ok actual isnt expected, actual: actual, expected: expected, message: typeof message is 'string' and message or 'notEqual'

    # Tests for loose or **coercive** equality (`actual == expected`).
    looseEqual: (actual, expected, message) -> @ok `actual == expected`, actual: actual, expected: expected, message: typeof message is 'string' and message or 'looseEqual'

    # Tests for **loose** inequality (`actual != expected`).
    notLooseEqual: (actual, expected, message) -> @ok `actual != expected`, actual: actual, expected: expected, message: typeof message is 'string' and message or 'notLooseEqual'

    # Tests for deep equality and equivalence, as determined by the `eq()` function.
    deepEqual: (actual, expected, message) -> @ok eq(actual, expected, []), actual: actual, expected: expected, message: typeof message is 'string' and message or 'deepEqual'

    # Tests for deep inequality.
    notDeepEqual: (actual, expected, message) -> @ok not eq(actual, expected, []), actual: actual, expected: expected, message: typeof message is 'string' and message or 'notDeepEqual'

    # Tests whether the function `block` throws an error. Both `expected` and `message`
    # are optional; if the `message` is omitted and `expected` is not a RegExp or
    # validation function, the `expected` value is used as the message.
    raises: (block, expected, message) ->
      ok = false
      isRegExp = expected and getClass.call(expected) is '[object RegExp]'
      isFunction = not isRegExp and typeof expected is 'function'
      # The message was passed as the second argument.
      unless isFunction and isRegExp and message?
        message = expected
        expected = null
      if typeof block is 'function'
        try
          block()
        catch error
          if not expected? or (isRegExp and expected.test(error)) or (isFunction and expected.call(@, error, @))
            ok = true
          else
            @errors++
            return @trigger type: 'error', error: error
      @ok ok, actual: block, expected: expected, message: typeof message is 'string' and message or 'raises'

    # Completes a test with an optional expected number of `assertions`. This method
    # **must** be called at the end of each test.
    done: (assertions) ->
      # Verify that the expected number of assertions were executed.
      if typeof assertions is 'number' and assertions > -1 and (assertions = Math.ceil(assertions)) isnt @assertions
        @failures++
        @trigger type: 'failure', actual: @assertions, expected: assertions, message: 'done'
      @trigger 'teardown'

  # Custom Events
  # -------------

  # Methods for adding, removing, and firing custom events. You can `bind` and `unbind`
  # event listeners; `trigger`-ing an event executes its listeners in succession.

  # Binds an event listener. The `listener` will be invoked each time the event `type`,
  # specified by a string identifier, is fired. Listeners bound to the `all` event will be
  # invoked when *any* event is triggered; listeners bound to the `error` event will be
  # invoked when a triggered listener throws an error.
  @::bind = Test::bind = (type, listener) ->
    # Create the event registry if it doesn't exist.
    @events = {} unless typeof @events is 'object' and @events
    # Add the event listener to the listener registry.
    (@events[type] ||= []).push listener if typeof type is 'string' and type and typeof listener is 'function'
    @

  # Removes a previously-bound event listener. If the `listener` function is omitted, all
  # listeners for the event `type` will be removed. If both the event and listener are
  # omitted, *all* event listeners will be removed.
  @::unbind = Test::unbind = (type, listener) ->
    if typeof @events is 'object' and @events
      # Remove all event listeners.
      @events = {} unless type? and listener?
      if typeof type is 'string' and type and (listeners = @events[type]) and (length = listeners.length)
        # Remove the listener from the event listener registry.
        listeners.splice(length, 1) while length-- when listeners[length] is listener
        # Remove the listener registry if it is empty or the listener was omitted.
        delete @events[type] unless listener? or listeners.length
    @

  # Triggers an event, specified by either a string identifier or an event object with a
  # `type` property.
  @::trigger = Test::trigger = (event) ->
    isEvent = typeof event is 'object'
    if (isEvent or typeof event is 'string') and event and typeof @events is 'object' and @events
      # Convert a string identifier into an event object.
      event = {type: event} unless isEvent
      type = event.type
      # Capture a reference to the current event target.
      event.target = @ unless 'target' of event
      if (listeners = typeof type is 'string' and @events[type])
        # Clone the event listener registry.
        listeners = listeners.slice 0
        # Execute each listener.
        for listener in listeners when typeof listener is 'function'
          # Wrap each invocation in a `try...catch` statement to ensure that all
          # subsequent listeners are executed.
          try
            break if listener.call(@, event) is false
          catch error
            # Trigger the `error` event if a listener throws an error.
            return (@trigger type: 'error', error: error) if type isnt error and @events.error and @events.error.length
      # Trigger the special `all` event.
      if type isnt 'all' and (listeners = @events.all)
        listeners = listeners.slice 0
        for listener in listeners when typeof listener is 'function'
          try
            break if listener.call(@, event) is false
          catch error
            return (@trigger type: 'error', error: error) if type isnt error and @events.error and @events.error.length
    @