module.exports = Runner

var inherits = require('util').inherits
var Readable = require('stream').Readable
var tape = require('tape')
var Suite = require('./suite')
var Scope = require('./scope')
var debug = require('debug')('tests')

var Test = tape.Test
var err = Test.prototype.error 
Test.prototype.error = function (e) {
  console.error(e.stack)
  return err.call(this, e)
}

var currentSuite = null

function noop() {}

function Runner(options) {
  if (!(this instanceof Runner))
    return new Runner(options)

  Readable.call(this, { objectMode: true })

  this._suites = []
  this._tests = []
  this._isRunning = false
  this._currentIndex = -1
  this._currentTest = null
  this._exitCode = 0
  this._ready = false

  this._currentSuite = null
}

inherits(Runner, Readable)

Runner.prototype._read = noop

function makeTest(desc, body, scope, next) {
  
  function test_(t) {
    var testAttrs = []

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
      body.call(scope, Scope.shallowCopy(t.end, scope))
    } else {
      body.call(scope)
    }
  }

  this.test(desc, test_)
}
Runner.prototype.makeTest = makeTest


Runner.prototype.test = function (name, conf, cb) {
  var test = new Test(name, conf, cb)

  this._tests.push(test)
  test.on('result', this._onresult.bind(this))
  
  setTimeout(this._start.bind(this), 0)
}

Runner.prototype._start = function () {
  this._run()
}

Runner.prototype._onresult = function (r) {
  this._currentTest.results.push(r)
  if (!r.ok) this._exitCode = 1
}

var testInfo = [
  'name'
  , 'assertCount'
  , 'pendingCount'
  , 'results'
  , 'ended'
]

Runner.prototype._run = function () {
  var harness = this
  var nextIndex = this._currentIndex + 1
  var nextTest = this._tests[nextIndex]
  var end

  if (nextTest) {

    this._isRunning = true
    this._currentTest = nextTest
    this._currentTest.results = []
    this._currentIndex = nextIndex

    end = nextTest.end
    nextTest.end = function () {
      var results = {}
      var key

      end.call(this)
      for (var i = 0; i < testInfo.length; i++) {
        key = testInfo[i]
        results[key] = this[key]
      }
      
      harness.push(results)
      harness._run()
    }
    nextTest.run()

  } else {
    this._isRunning = false
  }
}

Runner.prototype.add = function (key, value) {
  if (!this._currentSuite) return
  
  if ('beforeEach' === key || 'afterEach' === key)
    this._currentSuite[key].push(value)

  else if ('before' === key || 'after' === key)
    this._currentSuite[key] = [value]
}

Runner.prototype.close = function () {
  // end the stream!
  this.push(null)
}

var baseCount = 0
var finishedCount = 0
Runner.prototype.addSuite = function (desc, body) {
  var self = this
  var isBase = false
  var cs = self._currentSuite
  
  if (!cs) baseCount ++
  else
    desc = cs.desc ? cs.desc + ', ' + desc : desc

  var suite = new Suite({
    desc: desc
    , before: noop
    , after: noop
    , beforeEach: [].concat(cs ? cs.beforeEach : [])
    , afterEach: [].concat(cs ? cs.afterEach : [])
    , body: body
    , harness: self
  })

  if (cs) {
    cs.push(suite)
  } else {
    isBase = true
  }
  
  suite.parent = cs

  self._currentSuite = suite

  suite.run()

  self._currentSuite = suite.parent

  if (isBase)
    this.walk(suite, walkEnd)

  function walkEnd() {
    setTimeout(function () {
      self._currentSuite = null
      if (++finishedCount === baseCount)
        self.close()
    }, 0)
  }
}

Runner.prototype.walk = function (spec, done) {
  var runner = this
  spec.beforeTest()
  
  function testComplete() {
    spec.afterTest()
    done()
  }

  spec.forEach(function (child) {
    var self = this
    var scope
    var desc
    
    if ('function' !== typeof child.body) return self.done()

    function end() {
      spec.afterEachTest(scope)
      scope.restore()
      self.done()
    }

    if (child instanceof Suite) {
      runner.walk(child, self.done)

    } else if (child instanceof Suite.Test) {
      scope = new Scope()
      spec.beforeEachTest(scope)
      desc = spec.desc ? spec.desc + ': ' + child.desc : child.desc
      runner.makeTest(desc, child.body, scope, end)
    }
  }, testComplete)

}

Runner.prototype.addTest = function (desc, body) {
  this._currentSuite.push(new Suite.Test({
    desc: desc
    , body: body
  }))
}

