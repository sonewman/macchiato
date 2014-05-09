module.exports = ResultsHarness

var inherits = require('util').inherits
var Readable = require('stream').Readable
var tape = require('tape')
var Test = tape.Test


function ResultsHarness(options) {
  if (!(this instanceof ResultsHarness))
    return new ResultsHarness(options)

  Readable.call(this, { objectMode: true })

  this._suites = []
  this._isRunning = false
  this._tests = []
  this._currentIndex = -1
  this._currentTest = null
  this._exitCode = 0
  this._ready = false
}

inherits(ResultsHarness, Readable)

Object.defineProperty(ResultsHarness.prototype, 'isRunning', {
  get: function () {
    return this._isRunning || false
  }
})

ResultsHarness.prototype._read = function () {}

ResultsHarness.prototype.test = function (name, conf, cb) {
  var test = new Test(name, conf, cb)

  this._tests.push(test)

//  ;(function recurse(t_) {
//    t_.on('test', function sub(st_) {
//      recurse(st_)
//    })
  test.on('result', this._onresult.bind(this))
//  }(t))
  
//  if (!this._isReady)
    process.nextTick(this._start.bind(this))
}

ResultsHarness.prototype._start = function () {
  console.log(this._tests)
  this._run()
}


ResultsHarness.prototype._onresult = function (r) {
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

ResultsHarness.prototype._run = function () {
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
      //console.log(results)
      harness.push(results)
      harness._run()
    }
    nextTest.run()

  } else {
    this._isRunning = false
  }
}

ResultsHarness.prototype.close = function () {
  // end the stream!
  this.push(null)
}

