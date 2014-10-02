module.exports = Runner

var inherits = require('inherits')
var Readable = require('readable-stream').Readable
var EventEmitter = require('events').EventEmitter
var utils = require('core-util-is')
var block = require('./block')
var Scope = require('./scope')

var schedule = (function () {
  if ('function' === typeof setImmediate)
    return setImmediate
  else if ('object' === typeof process
    && 'function' === typeof process.nextTick)
    return process.nextTick
  else
    return setTimeout
}())


function trace(obj) {
  console.log(require('util').inspect(obj, { depth: null }))
}



function run_(runner, block, test, done) {
  var scope = new Scope()
  var resultsStream = scope.expect.readStream
  
  function onAssert(details) {
    test.results.push(details)
  }
  resultsStream.on('data', onAssert)
  
  // TODO allow beforeEach
  // and afterEach to be async

  // beforeEach
  block.beforeEachTest(scope)

  // add end/done fns
  scope.end 
  = scope.done
  = function () {
    block.afterEachTest(scope)
    runner.push(test)
    done()
  }

  test.run(scope)
}

function Runner(options) {
  var self = this
  Readable.call(self, { objectMode: true })

  self.base
  = self.current
  = new block.Base()
  // add circular reference
  self.current.parent = self
  self.iterator = 0
  self.baseGatherComplete = false
  self.gatherComplete = false

  self.exitCode = 0
  self.level = 0

  self.run = function (currentBlock, done) {
    // before all tests - called without scope
    currentBlock.beforeTest()

    // called after all tests - called without scope
    function testComplete() {
      currentBlock.afterTest()
      done()
    }

    // loop each of the currentBlock's children
    currentBlock.forEach(function (child) {
      if (child instanceof block.Child)
        self.run(child, this.done)
      else if (child instanceof block.Test)
        run_(self, currentBlock, child, this.done)

    }, testComplete)
  }
}

inherits(Runner, Readable)

Runner.prototype._read = function () {}

function adoptParentAspects(child, parent) {
  child.before = [].concat(parent.before) 
  child.beforeEach = [].concat(parent.beforeEach) 
  child.after = [].concat(parent.after) 
  child.afterEach = [].concat(parent.afterEach) 
}

Runner.prototype.walk = function (child) {
  var parent = this.current
  
  adoptParentAspects(child, parent)
  child.level = (parent.level || 0) + 1
  this.current = child
  child.run()

  this.current = parent
}

function addNewBlock(current, newBlock) {
  current.children.push(newBlock)
  newBlock.parent = current
}

Runner.prototype.gather = function (newBlock) {
  addNewBlock(this.current, newBlock)
  this.walk(newBlock)
}

function baseWalk_(children, index, parent, runner, done) {
  var l = children.length
  var child = children[index]

  if (!child) return done.call(runner)
  child.level = (parent.level || 0) + 1
  
  runner.current = child
  if (child instanceof block.Child) child.run()
  baseWalk_(children, ++index, parent, runner, done)
}

Runner.prototype.baseWalk = function (parent, done) {
  baseWalk_(parent.children, 0, parent, this, done)
}

Runner.prototype.gatherFromBase = function (newBlock) {
  var parent = this.current

  addNewBlock(parent, newBlock)
  if (this.current.started) return
  
  function then() {
    /** jshint validthis: true */
    this.baseGatherComplete = true

    function finished() {
      this.current = parent
      this.complete()
    }
    
    this.baseWalk(parent, finished)
  }

  this.current.started = true
  schedule(then.bind(this))
}

Runner.prototype.add = function (key, value) {
  if (!this.current) return
  this.current[key].push(value)
}

Runner.prototype.end = function () {
  // end the stream!
  this.push(null)
}

Runner.prototype.addBlock = function (desc, body) {
  var gather = this.baseGatherComplete
    ? 'gather' : 'gatherFromBase'

  this[gather](new block.Child(desc, body))
}

Runner.prototype.addTest = function (desc, body) {
  addNewBlock(this.current, new block.Test(desc, body))
}

Runner.prototype.complete = function () {
  var self = this
  function onend() {
    self.end()
  }
  
  if (!this.gatherComplete) {
    this.gatherComplete = true
    this.run(this.base, onend)
  }
}
