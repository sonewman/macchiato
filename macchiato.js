module.exports = macchiato

var Runner = require('./lib/runner')
var Walker = require('./lib/walker')
var schedule = require('./lib/schedule')
var block = require('./lib/block')
var Transform = require('stream').Transform

var runner
var UNDESCRIBED = '(Undescribed spec)'
var outputStream
var noRunnerError = 'Cannot apply spec as there is no test runner'

var methodMap = {
  describe: describe
  , it: it
  , xdescribe: xdescribe
  , xit: xit
}

var outputs = {
  spec: require('./lib/spec-out')
  , tap: require('tapout')
}

// default options
// TODO write documentation
var globalOptions = {
  R: 'spec'
  , bail: false
}

function through(transform, flush) {
  var t = new Transform({ objectMode: true })
  t._transform = transform
  t._flush = flush
  return t
}

function handleArgs(args) {
  var options = {}

  if (args.length) {
    switch (typeof args[0]) {
      case 'object':
        if (args[0]) options = args[0]
        break
      case 'string':
        options.desc = args[0]
        options.body = args[1]
        break
      case 'function':
        options.desc = UNDESCRIBED
        options.body = args[0]
    }
  }

  return options
}

function mergeOptions(options, globalOptions) {
  for (var i in globalOptions) {
    if (!(i in options)) options[i] = globalOptions[i]
  }
  return options
}

function macchiato() {
  var options = mergeOptions(handleArgs(arguments), globalOptions)
  var useGlobals = options.useGlobals === true

  if (!global.describe && !global.it && useGlobals) {
    var g = 'undefined' !== typeof window ? window : global
    for (var key in methodMap) g[key] = methodMap[key]
  }

  // create our global runner
  getRunner()

  if (options.silent) {
    outputStream = through(function (data, enc, next) {
      next()
    })
  }

  var OutputConstr, o
  if (!outputStream) {
    o = options.o || options.output
    OutputConstr = outputs[o] || outputs.spec
    outputStream = new OutputConstr(options)
    outputStream.pipe(process.stdout)
    runner.pipe(outputStream)
  }

  if (options.desc || options.body)
    describe(options.desc, options.body)

  return describe
}


function getRunner() {
  return runner || (runner = new Runner())
}
macchiato.globalRunner = getRunner

function requireFile(filename) {
  try {
    require(filename)
  } catch(err) {
    console.error('Error loading file: %s', filename)
    console.error(err.stack)
  }
}

macchiato.run = function run(files, options) {
  files = files || []
  options = options || {}

  for (var i in options)
    globalOptions[i] = options[i]

  var runner = getRunner()
  for (i = 0; i < files.length; i++)
    requireFile(files[i])
}

macchiato.describe = describe
macchiato.it = it

function makeAspectCallback(name) {
  return function (fn) {
    walker && walker.addAspect(name, fn)
  }
}

var aspectMethods = [
  'before'
  , 'beforeEach'
  , 'after'
  , 'afterEach'
]

for (var i = 0; i < aspectMethods.length; i++) {
  var name = aspectMethods[i]
  macchiato[name]
  = describe[name]
  = methodMap[name]
  = makeAspectCallback(name)
}

function checkRunner() {
  if (!runner) throw new Error(noRunnerError)
}

var started = false
function canStart() {
  if (!started) {
    started = true
    return true
  }
  return false
}

var walker = new Walker()
function startWalk() {
  walker.walk(runner.start.bind(runner, walker.base))
}

function describe(desc, body) {
  checkRunner()
  walker.add(new block.Child(desc, body))

  if (canStart()) schedule(startWalk)
}
describe.describe = describe

function it(desc, body) {
  checkRunner()
  walker.add(new block.Test(desc, body))
}

describe.it = it

function xdescribe(name, body) {}

function xit(desc, body) {}
