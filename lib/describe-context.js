var describer = require('./describer')
var extend = require('util-extend')
var isBrowser = process.browser && 'undefined' !== typeof window

module.exports = exports = createDescribeContext

exports.defaultOptions = {
  output: isBrowser ? 'browser' : 'spec'
  , bail: false
  , timeout: 5000
  , passing: true
  , pending: true
  , failing: true
  , granular: false
  , stdout: true
  , args: []
  , grep: null
  , useGlobals: false
}

// create a new describe context. The returned method can immediately be used
// as a test wrapper or it can be called with configuration and return a function
// which is used as a test wrapper. Both uses are valid and return the same context
// this is a `global` context so that tests can exist in separate files and still
// run in the same runner.
function createDescribeContext(ctxOptions) {
  // default options
  // TODO write documentation
  var globalOptions
  = extend(extend({}, exports.defaultOptions), ctxOptions)

  return describer(globalOptions)
}
