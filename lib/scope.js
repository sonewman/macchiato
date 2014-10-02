var sinon = require('sinon')
var certainResults = require('certain').withResults

function Scope() { }
module.exports = Scope
Scope.prototype = sinon.sandbox.create()
Scope.prototype.match = sinon.match
Scope.prototype.assert = sinon.assert
Scope.prototype.expect = certainResults()

Object.defineProperty(Scope.prototype, '_readStream', {
  get: function () { return this.expect.readStream }
})
