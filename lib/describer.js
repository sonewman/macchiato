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
  if (!releasedGlobals || options.useGlobals !== true)
    return

  var g = 'undefined' !== typeof window ? window : global
  g.describe = desc

  ;['it'].concat(aspectMethods).forEach(function (name) {
    g[name] = desc[name]
  })
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


function Proto(walker, options) {
  // expose options
  this.options = options

  // expose output stream
  this.outputs = options.outputs
}

aspectMethods.forEach(function (name) {
  Proto.prototype[name] = null
});

Proto.prototype.grep = null
Proto.prototype.it = null
Proto.prototype.should = null
Proto.prototype.spec = null
Proto.prototype.test = null

function RootProto(scheduler, walker, options) {
  Proto.call(this, walker, options)
  this.scheduler = scheduler

  aspectMethods.forEach(function (name) {
    this[name] = function (fn) {
      walker.addAspect(name, fn)
    }
  }, this);

  this.it
  = this.should
  = this.spec
  = this.test
  = function spec(desc/*, body*/) {
    if (execGrep(options.grep, desc))
      walker.add(new Spec(arguments))

    return this
  }
}

inherits(RootProto, Proto)

RootProto.prototype.scheduler = null
RootProto.prototype.run = runFiles

function Desc(walker, options, args) {
  Proto.call(this, walker, options)

  var test = new Test(args)
  walker.add(test)

  aspectMethods.forEach(function (name) {
    this[name] = function (fn) {
      walker.addParentAspect(name, fn, test)
      return this
    }
  }, this)

  this.before = function (fn) {
    walker.addParentAspect('before', fn, test)
  }

  this.it
  = this.should
  = this.spec
  = this.test
  = function spec(desc/*, body*/) {
    if (execGrep(options.grep, desc))
      walker.addToParent(new Spec(arguments), test)

    return this
  }
}

inherits(Desc, Proto)

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
  if (!options.outputs) options.outputs = {}

  var initialised = false
  var walker = new Walker(options, describe)
  var runner = new Runner(options)
  var scheduler = new Scheduler()

  runner.on('end', scheduler.next)

  var started = false
  var initialDescribe = createInitial(runner, options, describe)

  describe.__proto__
  = initialDescribe.__proto__
  = new RootProto(scheduler, walker, options)

  return initialDescribe

  function describe() {
    if (!started) {
      started = true
      scheduler.add(start(runner, walker))
    }

    return new Desc(walker, options, arguments)
  }
}

function createInitial(runner, options, describe) {
  var initialRun = true

  return function initialDescribe(desc, body) {
    if (initialRun) {
      if (utils.isObject(desc)) {
        options = desc
        desc = null
      }
      var opts = mergeOptions(options || {}, options)

      uninitialised(runner, describe, options.outputs, opts)
      initialRun = false
    }

    // if we have a desc or body then create a describe block
    return (desc || body) ? describe(desc, body) : describe
  }
}
