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
}
exports.Test = Test

Test.prototype.run = function (ctx) {
  if (utils.isFunction(this.body))
    this.body.call(ctx || null, ctx)
}

function Base() {
  this.children = []
  this.level = 0
  this.iterator = 0
  this.completed = false
}

inherits(Base, Test)

exports.Base = Base

Base.prototype.parent = null

Base.prototype.add = function (type, body) {
  (this[type] || []).push(body)
}

// below generates the following methods:
// Base.beforeTest()
// Base.afterTest()
// Base.beforeEachTest(/*context*/)
// Base.afterEachTest(/*context*/)
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
