module.exports = Suite

var forEach = require('foreach-async')
var Scope = require('./scope')

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

function makeTest(harness, desc, body, scope, next) {
  var testAttrs = []

  harness.test(desc, function test_(t) {
    var end = t.end
    t.end = function testEnd() {
      // don't call end twice
      // this is purely to recreate
      // expect behaviour of mocha
      if (!t.calledEnd) end.call(t)
      Scope.clean(scope, testAttrs)
      next()
    }

    scope = Scope.meld(scope, t, testAttrs)

    if (body.length > 0) {
      body.call(scope, t.end, t)
    } else {
      body.call(scope)
    }
  })
}

Suite.prototype.walk = function (done) {
  var spec = this

  callEachOn([spec.before], null)

  forEach(spec.children, function (child) {
    var self = this
    if ('function' !== typeof child.body) return self.done()

    var scope
    var testAttrs = []

    function end() {
      callEachOn(spec.afterEach, scope)
      scope.restore()
      self.done()
    }

    if (child instanceof Suite) {
      child.walk(self.done)
    } else if (child instanceof Suite.Test) {
      scope = new Scope()
      callEachOn(spec.beforeEach, scope)
      makeTest(spec.harness, child.desc, child.body, scope, end)
    }
  }, done)

  callEachOn([spec.after], null)
}

Object.defineProperty(Suite.prototype, 'parent', {
  set: function (p) {
    this._parent = p
  },
  get: function () {
    return this._parent
  }
})

Suite.prototype.push = function (child) {
  this.children.push(child)
}

Suite.prototype.add = function (type, body) {
  (this[type] || []).push(body)
}

Suite.prototype.run = function () {
  if (isFunc(this.body)) this.body()
}


Suite.Test = Test

function Test(options) {
  merge(this, options)
}

