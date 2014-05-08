module.exports = macchiato

var tape = require('tape')
var Transform = require('stream').Transform

var UNDESCRIBED = '(Undescribed spec)'
var createdSlientStream = false
var currentBody = null
var Harness = require('./lib/results')
var harness
var outputStream

var Suite = require('./lib/suite')

var methodMap = {
  describe: describe
  , it: It
  , before: before
  , beforeEach: beforeEach
  , after: after
  , afterEach: afterEach
  , xdescribe: xdescribe
  , xit: xit
}

function through(transform, flush) {
  var t = new Transform({ objectMode: true })
  t._transform = transform
  t._flush = flush
  return t
}

function handleArgs(args) {
  var options = {}
  
  if (arguments.length) {
    switch (typeof arguments[0]) {
      case 'object':
        if (arguments[0])
          options = arguments[0]
        break
      case 'string':
        if (arguments[2])
          options = arguments[2]

        options.desc = arguments[0]
        options.body = arguments[1]
        break
      case 'function':
        if (arguments[1]) {
          options = arguments[1]
        }
        options.desc = UNDESCRIBED
        options.body = arguments[0]
    }
  }

  return options
}


function macchiato() {
  var options = handleArgs(arguments)
  var stream


  options.useGlobals = options.useGlobals === false
    ? false : true

  if (!global.describe && !global.it) {
    if (options.useGlobals) {
      var g = 'undefined' !== typeof window ? window : global
      for (var key in methodMap) g[key] = methodMap[key]
    }
  }

  if (!outputStream) {
    outputStream = through(function (data, enc, next) {
      //console.log(this.silence)
//      if (this.silence) {
//        next()
//      } else {
        next(null, data)
//      }
    })
  }

  createHarness()
  outputStream.silence = options.silent || false

  if (options.desc || options.body) 
    describe(options.desc, options.body)
}


function createHarness() {

  if (!harness) {
    harness = new Harness()
//    harness = tape.createHarness({ autoclose: false })
//    harness.createStream()
//      .pipe(outputStream)
//      .pipe(process.stdout)
  }
}

macchiato.run = function run(files) {
  (files || []).forEach(function (file) {
    try {
      require(file)
    } catch(err) {
      console.error('Error loading file:', file)
      console.error(err)
    }
  })
}

function noop() {}
function isFunc(obj) { return 'function' === typeof obj }
function isArray(obj) {
  return Object.prototype.toString.call(obj) === '[object Array]'
}

macchiato.describe = describe
macchiato.it = It

macchiato.before = before
macchiato.after = after

macchiato.beforeEach = beforeEach
macchiato.afterEach = afterEach

Object.defineProperty(macchiato, 'results', {
  get: function () {
    return harness
  }
})

function describe(desc, body) {
  var isBase = false
  var be = currentBody ? currentBody.beforeEach : []
  var ae = currentBody ? currentBody.afterEach : []
  
  var suite = new Suite({
    desc: desc
    , before: noop
    , after: noop
    , beforeEach: [].concat(be)
    , afterEach: [].concat(ae)
    , body: body
    , harness: harness
  })

  if (currentBody) {
    currentBody.push(suite)
    suite.parent = currentBody
  } else {
    isBase = true
  }

  currentBody = suite
  
  suite.run()

  currentBody = suite.parent

  if (isBase) {
    suite.walk(walkEnd)
  }

  function walkEnd() {
    currentBody = null
  }
}

Object.defineProperty(describe.prototype, 'results', {
  get: function () {
    return harness
  }
})

function It(desc, body) {
  currentBody.push(new Suite.Test({
    desc: desc
    , body: body
  }))
}


// Export stuff...
describe.prototype.it = It

function before(body) { currentBody._before = body }
describe.prototype.before = before

function beforeEach(body) {
  currentBody.add('beforeEach', body)
}
describe.prototype.beforeEach = beforeEach

function after(body) { currentBody._after = body }
describe.prototype.after = after

function afterEach(body) {
  currentBody.add('afterEach', body)
}
describe.prototype.afterEach = afterEach

function xdescribe(name, body) {}
describe.prototype.xdescribe = xdescribe

function xit(desc, body) {}
describe.prototype.xit = xit

