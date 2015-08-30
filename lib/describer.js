module.exports = createDescriber

var Walker = require('./walker')
var Runner = require('./runner')
var Scheduler = require('./scheduler')
var SilentOut = require('./silent-out')
var utils = require('core-util-is')
var aspects = require('./aspects')
var runFiles = require('./run-files')
var block = require('./block')
var Spec = block.Spec
var Test = block.Test
var aspectMethods = require('./aspects').METHODS
var isBrowser = process.browser && 'undefined' !== typeof window
var aspectMethods = aspects.METHODS

function mergeOptions(options, globalOptions) {
  for (var i in globalOptions) {
    if (!(i in options)) options[i] = globalOptions[i]
  }
  return options
}

var releasedGlobals = false
function maybeReleaseGlobals(options, desc) {
  var use = options.useGlobals === true
  var g, i
  var methods

  if (!releasedGlobals && use) {
    g = 'undefined' !== typeof window ? window : global
    g.describe = desc

    methods = ['it'].concat(aspectMethods)
    for (i = 0; i < methods.length; i++)
      g[methods[i]] = desc[methods[i]]
  }
}

function getOutConstr(outputs, options) {
  if (outputs[options.output])
    return outputs[options.output]

  return isBrowser ? outputs.browser : outputs.spec
}

function makeGrepRegexp(options) {
  var grep = options.grep
  if (grep && 'string' === typeof grep)
    return new RegExp(grep) // TODO escape characters
}

function execGrep(grep, desc) {
  return grep == null
    || ('string' === typeof desc && grep.exec(desc))
}

function uninitialised(runner, describe, outputs, options) {
  runner.setOptions(options)
  maybeReleaseGlobals(options, describe)

  var outputStream
  if (options.silent) outputStream = new SilentOut()

  if (outputStream) return;

  var OutputConstr = getOutConstr(outputs, options)
  outputStream = new OutputConstr(options)

  if (options.stdout)
    outputStream.pipe(process.stdout)

  runner.pipe(outputStream)
}

function createProto(scheduler, walker, options) {
  var proto = {}
  proto.scheduler = scheduler

  // expose proto.run for use:
  // var macchiato = require('macchiato')(options)
  // macchiato.run()
  proto.run = runFiles

  proto.it
  = proto.should
  = proto.spec
  = proto.test
  = function spec(desc/*, body*/) {
    if (execGrep(options.grep, desc))
      walker.add(new Spec(arguments))
  }

  return proto
}

function createDescriber(options) {
  options.grep = makeGrepRegexp(options)
  var outputs = options.outputs || {}
  var initialised = false
  var walker = new Walker(options)
  var runner = new Runner(options)
  var scheduler = new Scheduler()

  runner.on('end', scheduler.next)

  function walkDone() {
    runner.start(walker.base)
  }

  function startWalk() {
    walker.walk(walkDone)
  }

  var started = false
  function describe() {
    var test = new Test(arguments)
    walker.add(test)

    if (!started) {
      started = true
      scheduler.add(startWalk)
    }

    // create a Chaining API
    return new Chain(test, options)
  }

  walker.childContext = describe

  function initialDescribe(desc, body) {
    var opts

    if (!initialised) {
      if (utils.isObject(desc)) {
        options = desc
        desc = null
      }
      opts = mergeOptions(options || {}, options)

      uninitialised(runner, describe, outputs, opts)
      initialised = true
    }

    // if we have a desc or body then create a describe block
    if (desc || body)
      return describe(desc, body)

    // if we have neither then return
    return describe
  }

  var proto = createProto(scheduler, walker, options)
  makeAspects(proto, walker)

  // expose these options
  proto.options = options

  // expose the output streams
  proto.outputs = outputs

  describe.__proto__ = proto
  initialDescribe.__proto__ = proto

  return initialDescribe;
}

function makeCallback(walker, name) {
  return function aspectMethod(fn) {
    if (walker.current) walker.current[name].push(fn)
  }
}

function makeAspects(block, walker) {
  for (var i = 0; i < aspectMethods.length; i++) {
    var name = aspectMethods[i]
    block[name] = makeCallback(walker, name)
  }
}

// instantiable, used for the chaining API
function Chain(block, options) {
  this.__block__ = block
  this.__options__ = options
}

Chain.prototype.it
= Chain.prototype.should
= function (desc/*, body*/) {
  if (execGrep(this.__options__.grep, desc))
    this.__block__.addChild(new Spec(arguments))

  return this
}

function createChainAspect(key) {
  Chain.prototype[key] = function (body) {
    this.__block__.add(key, body)
    return this
  }
}

aspectMethods.forEach(createChainAspect)
