var utils = require('core-util-is')
var inherits = require('inherits')
var UNDESCRIBED_TEST = '(Undescribed Test)'
var UNDESCRIBED_SPEC = '(Undescribed Spec)'
var aspectMethods = require('./aspects').METHODS

function callEachOn(array, context) {
  array = Array.isArray(array) ? array : []
  for (var i = 0; i < array.length; i++)
    array[i].call(context)
}

function Block() {}
Block.prototype.add = function add(name, body) {
  (this[name] || []).push(body)
}

function handleArgs(block, args, undescribed) {
  if ('string' === typeof args[0]) {
    block.name = args[0]
    block.body = args[1]
  } else if ('function' === typeof args[0]) {
    block.name = undescribed
    block.body = args[0]
  }
}

function Spec(args) {
  handleArgs(this, args, UNDESCRIBED_SPEC)

  this.results = []
  this.startTime = 0
  this.endTime = 0
  this.pending = false
  this.passed = true
  this.timeout = 5000
}

inherits(Spec, Block)
exports.Spec = Spec

function runTest(test, context) {
  var resultsStream = context._readStream
  var timeout = test.timeout
  var to

  if (!utils.isFunction(test.body)) {
    test.pending = true
    context.end()
    return
  }

  function onAssert(details) {
    test.results.push(details)
  }
  resultsStream.on('data', onAssert)

  var contextEnd = context.end
  context.end = context.done = end

  var hasEnded = false
  function end() {
    if (hasEnded) return testAlreadyEnded()
    test.endTime = Date.now()
    clearTimeout(to)
    resultsStream.removeListener('data', onAssert)
    contextEnd.call(context)
  }

  function onTimeout() {
    context.results.custom({
      ok: false
      , name: 'Timed Out!'
      , actual: 'Test Timed Out!'
      , invalidOperator: 'expected test to be under'
      , expected: timeout + 'ms'
    })

    // call end because the test has failed
    end()
  }

  function testAlreadyEnded() {
    context.results.custom({
      ok: false
      , name: 'Test already ended'
      , actual: 'Test already ended'
      , invalidOperator: 'expected'
      , expected: 'test had already completed'
    })
  }

  test.startTime = Date.now()

  if (timeout && timeout !== Infinity)
    to = setTimeout(onTimeout, timeout)

  var result = test.body.call(context || null, context)
  if (result === undefined) return

  // allow return values to signify test complete
  // allow promises....
  if ('function' === typeof result.then)
    result.then(end).catch(function (err) {
      context.fail(err)
      end()
    })
  else
    end()
}

Spec.prototype.run = function (context) {
  runTest(this, context)
}

function Base() {
  this.children = []
  this.level = 0
  this.iterator = 0
  this.completed = false
  this.base = true
}
inherits(Base, Block)

exports.Base = Base

Base.prototype.parent = null
Base.prototype.addChild = function addChild(child) {
  this.children.push(child)
  child.parent = this
  child.level = (this.level || 0) + 1
}

Base.prototype.run = function (context) {
  if (utils.isFunction(this.body))
    this.body.call(context || null)
}

// below generates the following methods:
// base.beforeTest()
// base.afterTest()
// base.beforeEachTest(/*context*/)
// base.afterEachTest(/*context*/)
function makeAspectMethod(name) {
  return function (context) {
    callEachOn(this[name], context || null)
  }
}

var methodName
for (var i = 0; i < aspectMethods.length; i++) {
  methodName = aspectMethods[i]

  Base.prototype[methodName + 'Test']
  = makeAspectMethod(methodName)
}


function Test(args) {
  Base.call(this)
  handleArgs(this, args, UNDESCRIBED_TEST)

  this.base = false
  this.before = []
  this.after = []
  this.beforeEach = []
  this.afterEach = []
}

inherits(Test, Base)

exports.Test = Test

Test.prototype.complete = function () {
  if (this.iterator === this.children.length) {
    this.completed = true

    if (this.parent) {
      this.parent.iterator++
      this.parent.complete()
    }
  }
}
