var block = require('./block')

function Walker() {
  this.base
  = this.current
  = new block.Base()

  this.walking = false
}

module.exports = Walker

function level(l) {
  return ((l || 0) + 1)
}

Walker.prototype.walk = function (done) {
  var self = this
  var parent = self.current
  var children = parent.children
  self.walking = true

  ;(function walk(index) {
    var child = children[index]

    if (!child) return done.call(self)
    child.level = level(parent.level)

    if (child instanceof block.Child) {
      self.current = child
      child.run()
      self.current = parent
    }

    walk(index + 1)
  }(0))

  self.current = parent
}

function inheritParentsAspects(child, parent) {
  child.before = [].concat(parent.before)
  child.beforeEach = [].concat(parent.beforeEach)
  child.after = [].concat(parent.after)
  child.afterEach = [].concat(parent.afterEach)
}

Walker.prototype.add = function (newBlock) {
  var parent = this.current

  this.current.children.push(newBlock)
  newBlock.parent = this.current
  newBlock.level = level(parent.level)

  if (this.walking && newBlock instanceof block.Child) {
    inheritParentsAspects(newBlock, parent)

    this.current = newBlock
    newBlock.run()
    this.current = parent
  }
}

Walker.prototype.addAspect = function (key, value) {
  if (!this.current) return
  this.current[key].push(value)
}
