
var Transform = require('stream').Transform
var inherits = require('inherits')

function SilentOut() {
  Transform.call(this, { objectMode: true })
}

inherits(SilentOut, Transform)

module.exports = SilentOut

SilentOut.prototype._transform = transform_
function transform_(data, enc, next) {
  next()
}
