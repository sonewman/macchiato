module.exports = Runner

var inherits = require('inherits')
var Readable = require('readable-stream').Readable
var utils = require('core-util-is')
var block = require('./block')
var Scope = require('./scope')

function Runner(options) {
  Readable.call(this, { objectMode: true })
  this.started = false
  this.exitCode = 0
  this.level = 0
  options = options || {}
  this.timeout = options.timeout || 5000
}

inherits(Runner, Readable)

Runner.prototype._read = function () {}

Runner.prototype.end = function () {
  // end the stream!
  this.push(null)
}

function run_(runner, block, test, done) {
  var scope = new Scope()
  var resultsStream = scope._readStream
  var timeoutDur = runner.timeout
  var to

  function onAssert(details) {
    test.results.push(details)
  }
  resultsStream.on('data', onAssert)

  // beforeEach
  block.beforeEachTest(scope)

  // TODO allow beforeEach
  // and afterEach to be async
  function endTest() {
    scope.end
    = scope.done
    = function () {}

    clearTimeout(to)

    block.afterEachTest(scope)

    resultsStream.removeListener('data', onAssert)
    runner.push(test)
    done()
  }

  // add end/done fns
  scope.end
  = scope.done
  = endTest

  function onTimeout() {
    scope.results.custom({
      ok: false
      , name: 'Timed Out!'
      , actual: 'Test Timed Out!'
      , invalidOperator: 'expected test to be under'
      , expected: timeoutDur + 'ms'
    })
  }

  if (runner.timeout && runner.timeout !== Infinity)
    to = setTimeout(onTimeout, runner.timeout)

  test.run(scope)
}

function run(runner, parentBlock, done) {
  // before all tests - called without scope
  parentBlock.beforeTest()

  // called after all tests - called without scope
  function complete() {
    parentBlock.afterTest()
    done.call(runner)
  }

  ;(function iterate(children, i) {
    var child = children[i]

    function next() {
      iterate(children, i + 1)
    }

    if (child instanceof block.Child)
      run(runner, child, next)
    else if (child instanceof block.Test)
      run_(runner, parentBlock, child, next)
    else
      complete()

  }(parentBlock.children, 0))
}

Runner.prototype.start = function (base) {
  run(this, base, this.end)
}
