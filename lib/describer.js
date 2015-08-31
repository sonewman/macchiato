module.exports = createDescriber

var Walker = require('./walker')
var Runner = require('./runner')
var Scheduler = require('./scheduler')
var SilentOut = require('./silent-out')
var utils = require('core-util-is')
var aspects = require('./aspects')
var runFiles = require('./run-files')
var block = require('./block')
var inherits = require('inherits')
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

function makeCallback(walker, name) {
  return function aspectMethod(fn) {
    if (walker.current) walker.current[name].push(fn)
  }
}

function Proto(walker, options, out) {
  // expose options
  this.options = options

  // expose output stream
  this.outputs = out

  this.it
  = this.should
  = this.spec
  = this.test
  = function spec(desc/*, body*/) {
    if (execGrep(options.grep, desc))
      walker.add(new Spec(arguments))
  }

  aspectMethods.forEach(function (name) {
    this[name] = makeCallback(walker, name)
  }, this);
}

aspectMethods.forEach(function (name) {
  Proto.prototype[name] = null
});

Proto.prototype.grep = null
Proto.prototype.it = null
Proto.prototype.should = null
Proto.prototype.spec = null
Proto.prototype.test = null

function RootProto(scheduler, walker, options, out) {
  Proto.call(this, walker, options, out)
  this.scheduler = scheduler
}

inherits(RootProto, Proto)

RootProto.prototype.scheduler = null
RootProto.prototype.run = runFiles

function start(runner, walker) {
  return function () {
    walker.walk(walkDone)
  }

  function walkDone() {
    runner.start(walker.base)
  }
}

function createDescriber(options) {
  options.grep = makeGrepRegexp(options)
  var outputs = options.outputs || {}
  var initialised = false
  var walker = new Walker(options, describe)
  var runner = new Runner(options)
  var scheduler = new Scheduler()

  runner.on('end', scheduler.next)

  var started = false

  describe.__proto__
  = initialDescribe.__proto__
  = new RootProto(scheduler, walker, options, outputs)

  return initialDescribe

  function describe() {
    var test = new Test(arguments)
    walker.add(test)

    if (!started) {
      started = true
      scheduler.add(start(runner, walker))
    }

    // create a Chaining API
    return new Chain(test, options)
  }

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
}

// instantiable, used for the chaining API
function Chain(block, options) {
  this.__block__ = block
  this.__options__ = options
}

Chain.prototype.it
= Chain.prototype.should
= Chain.prototype.spec
= Chain.prototype.test
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
