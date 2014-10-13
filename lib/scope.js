var sinon = require('sinon')
var certain = require('certain')
var utils = require('core-util-is')
var certainResults = certain.withResults()
var certainProto = certain.Certain.prototype

function Scope() { }
module.exports = Scope
Scope.prototype = sinon.sandbox.create()
Scope.prototype.match = sinon.match

Scope.prototype.expect
= Scope.prototype.results
= certainResults


// mix in methods to allow for the old simple api
// using pre-es5 to allow for impending IE8 support
var keys = []
for (var i in certainProto) {
  if (utils.isFunction(certainProto[i]))
    keys.push(i)
}

;(function iterate(keys, j) {
  var key = keys[j]
  if (!key) return

  Scope.prototype[key] = function (e, a, m) {
    return certainResults(e)[key](a, m)
  }

  iterate(keys, j + 1)
}(keys, 0))


Object.defineProperty(Scope.prototype, '_readStream', {
  get: function () { return this.expect.readStream }
})
