module.exports = Suite

var forEach = require('foreach-async')

function isFunc(obj) { return 'function' === typeof obj }
function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

function merge(obj, toMerge) {
  toMerge = toMerge || {}
  for (var i in toMerge) obj[i] = toMerge[i]
}

function callEachOn(array, context) {
  array = isArray(array) ? array : []
  for (var i = 0; i < array.length; i++)
    array[i].call(context)
}

function Suite(options) {
  merge(this, options)
  this.children = []
}

Suite.prototype.parent = null

Suite.prototype.forEach = function (iterator, done) {
  forEach(this.children, iterator, done)
}

Suite.prototype.push = function (child) {
  this.children.push(child)
}

Suite.prototype.add = function (type, body) {
  (this[type] || []).push(body)
}

Suite.prototype.run = function () {
  if (isFunc(this.body)) this.body()
}


// below generates the following methods:
// suite.beforeTest()
// suite.afterTest()
// suite.beforeEachTest(/*context*/)
// suite.afterEachTest(/*context*/)
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

  Suite.prototype[methodName + 'Test']
  = makeAspectMethod(methodName) 
}

Suite.Test = Test

function Test(options) {
  merge(this, options)
}
