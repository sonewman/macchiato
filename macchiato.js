module.exports = macchiato

var tape = require('tape')
var Transform = require('stream').Transform

var UNDESCRIBED = '(Undescribed spec)'
var createdSlientStream = false
var currentBody = null
var Harness = require('./lib/runner')
var harness
var outputStream

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

var globalOptions = {
  R: 'spec'
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


function macchiato() {
  var options = handleArgs(arguments)
  var stream
  var harness
  var useGlobals = options.useGlobals === false
    ? false : true
  
  for (var i in globalOptions) {
    if (!(i in options)) options[i] = globalOptions[i]
  }
  var OutputConstr

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
    harness = getHarness()
    
    OutputConstr = outputs[options.D] || outputs.spec
    outputStream = new OutputConstr()
    outputStream.pipe(process.stdout)
    harness.pipe(outputStream)
  }
  
  if (options.desc || options.body)
    describe(options.desc, options.body)
}


function getHarness() {
  return harness || (harness = new Harness())
}
macchiato.globalHarness = getHarness

macchiato.run = function run(files, options) {
  var i, file

  files = files || []
  options = options || {}
  for (i in options) globalOptions[i] = options[i]

  for (i = 0; i < files.length; i++) {
    file = files[i]
    try {
      require(file)
    } catch(err) {
      console.error('Error loading file:', file)
      console.error(err)
    }
  }
}

macchiato.describe = describe
macchiato.it = it

function makeAspectCallback(name) {
  return function (fn) {
    if (harness) harness.add(name, fn)
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

function checkHarness() {
  if (harness) return
  throw new Error('Cannot apply spec as there is no Harness')
}

function describe(desc, fn) {
  checkHarness()
  harness.addSuite(desc, fn)
}

function it(desc, fn) {
  checkHarness()
  harness.addTest(desc, fn)
}
describe.prototype.it = it

function xdescribe(name, body) {}
describe.prototype.xdescribe = xdescribe

function xit(desc, body) {}
describe.prototype.xit = xit

