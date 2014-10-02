module.exports = macchiato

var Transform = require('stream').Transform

var UNDESCRIBED = '(Undescribed spec)'
var createdSlientStream = false
var currentBody = null
var Runner = require('./lib/runner')
var runner
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
        if (args[2]) options = args[2]
        options.desc = args[0]
        options.body = args[1]
        break
      case 'function':
        if (args[1]) options = args[1]
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
}

function macchiato() {
  var stream
  var OutputConstr
  var options = handleArgs(arguments)
  mergeOptions(options, globalOptions)

  var useGlobals = options.useGlobals === true

  if (!global.describe && !global.it && useGlobals) {
    var g = 'undefined' !== typeof window ? window : global
    for (var key in methodMap) g[key] = methodMap[key]
  }

  if (options.silent) {
    outputStream = through(function (data, enc, next) {
      next()
    })
  }

  if (!outputStream) {
    OutputConstr = outputs[options.D] || outputs.spec
    outputStream = new OutputConstr(options)
    outputStream.pipe(process.stdout)
    getRunner().pipe(outputStream)
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
  runner.startDelay = files.length
  for (i = 0; i < files.length; i++)
    requireFile(files[i])
}

macchiato.describe = describe
macchiato.it = it

function makeAspectCallback(name) {
  return function (fn) {
    if (runner) runner.add(name, fn)
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

function describe(desc, fn) {
  checkRunner()
  runner.addBlock(desc, fn)
}
describe.describe = describe

function it(desc, fn) {
  checkRunner()
  runner.addTest(desc, fn)
}
describe.prototype.it = it

function xdescribe(name, body) {}
describe.prototype.xdescribe = xdescribe

function xit(desc, body) {}
describe.prototype.xit = xit

