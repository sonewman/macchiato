var block = require('./block')
var aspectMethods = require('./aspects').METHODS

function Walker(options, context) {
  this.base
  = this.current
  = new block.Base(options)

  this.childContext = context || null
  this.walking = false
}

module.exports = Walker

Walker.prototype.walk = function (done) {
  var self = this
  var parent = self.current
  self.walking = true

  ;(function walk(index) {
    var child = parent.children[index]

    if (!child) return done()
    child.level = (parent.level || 0) + 1

    if (child instanceof block.Test) {
      self.current = child
      child.run(self.childContext)
      self.current = parent
    }

    walk(index + 1)
  }(0))

  self.current = parent
}

Walker.prototype.add = function (child) {
  var parent = this.current
  this.current = child
  this.addToParent(child, parent)
  this.current = parent
}

Walker.prototype.addToParent = function (child, parent) {
  parent.addChild(child)

  if (this.walking && child instanceof block.Test) {
    child.beforeEach = [].concat(parent.beforeEach)
    child.afterEach = [].concat(parent.afterEach)
    child.run()
  }
}

Walker.prototype.addAspect = function (name, aspectcb) {
  this.addParentAspect(name, aspectcb, this.current);
}

Walker.prototype.addParentAspect = function (name, aspectcb, parent) {
  if (parent) parent[name].push(aspectcb)
}
