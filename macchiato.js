var Describer = require('./lib/describer')
var aspects = require('./lib/aspects')
var SilentOut = require('./lib/silent-out')
var utils = require('core-util-is')

var aspectMethods = aspects.METHODS
var noRunnerError = 'Cannot apply spec as there is no test runner'

var outputs = {
  spec: require('./lib/spec-out')
  , tap: require('tapout')
}

var macchiato = module.exports = createDescribeContext()
macchiato.createDescribeContext = createDescribeContext

// default options
// TODO write documentation
var globalOptions = macchiato.options = {
  R: 'spec'
  , bail: false
}

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

// create a new describe context. The returned method can immediately be used 
// as a test wrapper or it can be called with configuration and return a function 
// which is used as a test wrapper. Both uses are valid and return the same context
// this is a `global` context so that tests can exist in separate files and still
// run in the same runner.
function createDescribeContext() {
  var describer = new Describer()
  var initialised = false

  function describe(desc, body) {
    var options

    if (!initialised) {
      if (utils.isObject(desc)) {
        options = desc
        desc = null
      }

      options = mergeOptions(options || {}, globalOptions)

      maybeReleaseGlobals(options, describer.describe)
      var outputStream

      if (options.silent)
        outputStream = new SilentOut()

      var OutputConstr, o
      if (!outputStream) {
        o = options.o || options.output
        OutputConstr = outputs[o] || outputs.spec
        outputStream = new OutputConstr(options)
        outputStream.pipe(process.stdout)
        describer.runner.pipe(outputStream)
      }

      initialised = true
    }
    
    // if we have a desc and body then this has
    // been called to create a test context,
    // so we create that and return
    if (desc || body)
      return describer.describe(desc, body)
    
    // if we have no arguments or and object
    // we can assume that
    return describer.describe
  }

  var descIt = describer.describe.it
  describe.it = function it(desc, body) {
    return descIt(desc, body)
  }
  
  // expose describe.run for use:
  // var desc = require('macchiato')
  // desc.run()
  describe.run = describer.run
  
    // expose describe.run for use:
  // var desc = require('macchiato')(options)
  // desc.run()
  describer.describe.run = this.run
  
  // allow scheduler to be used immediately
  describe.scheduler = describer.scheduler
  // as well as the return from a call with options
  describer.describe.scheduler = describer.scheduler

  aspects.make(describer.walker, describe)
  return describe
}

