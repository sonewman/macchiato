var utils = require('core-util-is')
var inherits = require('inherits')

function callEachOn(array, context) {
  array = Array.isArray(array) ? array : []
  for (var i = 0; i < array.length; i++)
    array[i].call(context)
}

function Test(desc, body) {
  this.name = desc
  this.body = body
  this.results = []
  this.startTime = 0
  this.endTime = 0
  this.pending = true
  this.passed = true
}
exports.Test = Test

function testRun(test, scope) {
  var resultsStream = scope._readStream

  function onAssert(details) {
    test.results.push(details)
  }
  resultsStream.on('data', onAssert)

  var scopeEnd = scope.end
  scope.end = scope.done = end

  function end() {
    test.endTime = +new Date()
    resultsStream.removeListener('data', onAssert)
    scopeEnd.call(scope)
  }

  test.startTime = +new Date()
  test.body.call(scope || null, scope)
}

Test.prototype.run = function (scope) {
  if (utils.isFunction(this.body))
    testRun(this, scope)
  else
    this.pending = true
}

function Base() {
  this.children = []
  this.level = 0
  this.iterator = 0
  this.completed = false
  this.base = true
}

exports.Base = Base

Base.prototype.parent = null

Base.prototype.add = function (type, body) {
  (this[type] || []).push(body)
}

Base.prototype.run = function (scope) {
  if (utils.isFunction(this.body))
    this.body.call(scope || null)
}

// below generates the following methods:
// base.beforeTest()
// base.afterTest()
// base.beforeEachTest(/*context*/)
// base.afterEachTest(/*context*/)
var aspectMethods = [
'before'
  , 'beforeEach'
  , 'after'
  , 'afterEach'
]

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

function Child(desc, body) {
  Base.call(this)
  this.name = desc
  this.body = body
  this.base = false

  this.before = []
  this.after = []
  this.beforeEach = []
  this.afterEach = []
}

inherits(Child, Base)

exports.Child = Child

Child.prototype.complete = function () {
  if (this.iterator === this.children.length) {
    this.completed = true

    if (this.parent) {
      this.parent.iterator++
      this.parent.complete()
    }
  }
}
