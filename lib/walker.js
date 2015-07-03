var block = require('./block')
var Test = block.Test
var aspectMethods = require('./aspects').METHODS

function Walker(options) {
  this.base
  = this.current
  = new block.Base()

  this.options = options
  this.childContext = null
  this.walking = false
}

module.exports = Walker

Walker.prototype.walk = function (done) {
  var self = this
  var parent = self.current
  var children = parent.children
  self.walking = true

  ;(function walk(index) {
    var child = children[index]

    if (!child) return done()
    child.level = (parent.level || 0) + 1

    if (child instanceof Test) {
      self.current = child
      child.run(self.childContext)
      self.current = parent
    }

    walk(index + 1)
  }(0))

  self.current = parent
}

function inheritParentsAspects(child, parent) {
  child.beforeEach = [].concat(parent.beforeEach)
  child.afterEach = [].concat(parent.afterEach)
}

Walker.prototype.add = function (newBlock) {
  var parent = this.current
  parent.addChild(newBlock)

  if (this.walking && newBlock instanceof Test) {
    inheritParentsAspects(newBlock, parent)

    this.current = newBlock
    newBlock.run()
    this.current = parent
  }
}

function makeCallback(walker, name) {
  return function aspectMethod(fn) {
    if (walker.current) walker.current[name].push(fn)
  }
}

Walker.prototype.makeAspects = function makeAspects(block) {
  for (var i = 0; i < aspectMethods.length; i++) {
    var name = aspectMethods[i]
    block[name] = makeCallback(this, name)
  }
}
