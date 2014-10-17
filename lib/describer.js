
var Walker = require('./walker')
var Runner = require('./runner')
var block = require('./block')
var Scheduler = require('./scheduler')
var aspects = require('./aspects')
var aspectMethods = aspects.METHODS
var makeAspects = aspects.make
var UNDESCRIBED = '(Undescribed spec)'


// instantiable, used for the chaining API
function Chain(block, walker) {
  this.__block__ = block
  this.__walker__ = walker
}

Chain.prototype.it = function (desc, body) {
  var test = new block.Test(desc, body)
  this.__walker__.addBlock(test, this.__block__)
  return this
}

function createChainAspect(key) {
  Chain.prototype[key] = function (body) {
    this.__walker__.addAspect(key, body, this.__block__)
    return this
  }
}

for (var i = 0; i < aspectMethods.length; i++)
  createChainAspect(aspectMethods[i])

function canStartRunning(runner) {
  return runner.started ? false : (runner.started = true)
}

function handleArgs(args) {
  var a = {}

  if ('string' === typeof args[0]) {
    a.desc = args[0]
    a.body = args[1]
  } else if ('function' === typeof args[0]) {
    a.desc = UNDESCRIBED
    a.body = args[0]
  }
  return a
}

function Describer() {
  var walker = this.walker = new Walker()
  var runner = this.runner = new Runner()
  var scheduler = this.scheduler = new Scheduler()

  runner.on('end', scheduler.next)

  function startWalk() {
    walker.walk(runner.start.bind(runner, walker.base))
  }

  var desc = this.describe = function describe() {
    var args = handleArgs(arguments)
    var newBlock = new block.Child(args.desc, args.body)

    walker.add(newBlock)

    if (canStartRunning(runner))
      scheduler.add(startWalk)

    // create a Chaining API
    return new Chain(newBlock, walker)
  }

  walker.childContext = desc

  desc.it
  = desc.should
  = function it(desc, body) {
    walker.add(new block.Test(desc, body))
  }

  makeAspects(walker, desc)
}

function requireFile(filename) {
  try {
    require(filename)
  } catch(err) {
    console.error('Error Running Test: %s', filename)
    console.error(err.stack)
  }
}

Describer.prototype.run = function run(files) {
  files = files || []

  for (i = 0; i < files.length; i++)
    requireFile(files[i])
}


module.exports = Describer
