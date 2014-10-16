var block = require('./block')

function Walker(describer) {
  this.base
  = this.current
  = new block.Base()

  this.describer = describer
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
      child.run(self.describer)
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

Walker.prototype.addBlock = addBlock
function addBlock(newBlock, parent) {
  parent.children.push(newBlock)
  newBlock.parent = parent
  newBlock.level = level(parent.level)
}

Walker.prototype.add = function (newBlock) {
  var parent = this.current
  addBlock(newBlock, parent)

  if (this.walking && newBlock instanceof block.Child) {
    inheritParentsAspects(newBlock, parent)

    this.current = newBlock
    newBlock.run()
    this.current = parent
  }
}

Walker.prototype.addAspect = function (key, value, current) {
  current = current || this.current
  if (!current) return
  current[key].push(value)
}
