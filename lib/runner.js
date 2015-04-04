module.exports = Runner

var inherits = require('inherits')
var Readable = require('readable-stream').Readable
var block = require('./block')
var Context = require('./context')

function Runner() {
  Readable.call(this, { objectMode: true })
  this.started = false
  this.exitCode = 0
  this.level = 0

  this.options = {
    timeout: 5000
  }
}

inherits(Runner, Readable)

var runnerOptions = ['timeout']

Runner.prototype.setOptions = function (options) {
  var name
  for (var i = 0; i < runnerOptions.length; i++) {
    name = runnerOptions[i]
    if (name in options) this.options[name] = options[name]
  }
}

Runner.prototype._read = function () {}

Runner.prototype.end = function () {
  // end the stream!
  this.push(null)
}

function run_(runner, block, test, done) {
  var context = new Context()
  test.timeout = runner.options.timeout

  // beforeEach
  block.beforeEachTest(context)

  // TODO allow beforeEach
  // and afterEach to be async
  function endTest() {
    context.end
    = context.done
    = function () {}

    block.afterEachTest(context)
    context.restore()
    runner.push(test)
    done()
  }

  // add end/done fns
  context.end
  = context.done
  = endTest

  test.run(context)
}

function run(runner, parentBlock, done) {
  // before all tests - called without context
  parentBlock.beforeTest()

  // called after all tests - called without context
  function complete() {
    parentBlock.afterTest()
    done.call(runner)
  }

  ;(function iterate(children, i) {
    var child = children[i]

    function next() {
      iterate(children, i + 1)
    }

    if (child instanceof block.Test)
      run(runner, child, next)
    else if (child instanceof block.Spec)
      run_(runner, parentBlock, child, next)
    else
      complete()

  }(parentBlock.children, 0))
}

Runner.prototype.start = function (base) {
  this.started = true
  run(this, base, this.end)
}
