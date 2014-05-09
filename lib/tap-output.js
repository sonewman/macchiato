module.exports = TapOut

var inherits = require('util').inherits
var Transform = require('stream').Transform


function TapOut(options) {
  Transform.call(this, { objectMode: true })
  options = options || {}

  this._hasHeader = false
  this._hasFooter = false
  this._count = 0
  this._ok = true
  
  var self = this
  if (options.harness) {
    this._harness = options.harness
  } else {
    this.on('pipe', function (src) {
      self._harness = src
    })
  }

  this._harness.on('end', function () {
    
    throw new Error('aaahh')
    this.push('harness endededed')
  })

}

inherits(TapOut, Transform)

function outputHeader(stream, hasHeader) {
  if (hasHeader) return
  stream.push('TAP version 13')
}


TapOut.prototype._transform = transform_
function transform_(test, enc, next) {
  var self = this
  var output = []
  //outputHeader(this, this._hasHeader)
//  console.log(test)
  output.push('# ' + test.name)
  console.log('asdasdsad')

  function onResult(result, i) {
    var rs = ''
    if (result.ok) {
      rs += 'ok '
    } else {
      rs += 'not ok '
      self._ok = false
    }
    rs += (i + 1) + ' ' + result.name
    output.push(rs)
  }

  test.results.forEach(onResult)
  
  output.push('')
  next(null, output.join('\n'))
}

TapOut.prototype._flush = flush_
function flush_() {
  this.push('ending...')
  this.push(null)
}
