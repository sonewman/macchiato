module.exports = Scope

var sinon = require('sinon')
var util = require('util')

function isFunc(obj) { return 'function' === typeof obj }

// so that this will work on crap browsers
function bind(fn, context) {
  return Function.prototype.bind ? fn.bind(context) : function () {
    return fn.apply(context, [].slice.call(arguments))
  }
}

function Scope() {
  if (!(this instanceof Scope))
    return new Scope()
}

Scope.prototype = sinon.sandbox.create()
Scope.prototype.match = sinon.match

// this would get overridden by the test
//Scope.prototype.assert = sinon.assert

for (var key in sinon.assert) {
  if ('function' === typeof sinon.assert[key])
    Scope.prototype[key] = bind(sinon.assert[key], sinon.assert)
  else
    Scope.prototype[key] = sinon.assert[key]
}

Scope.meld = meld
function meld(destObj, add, props) {
  var prop, i
  props = props || []
  for (i in add) {
    prop = add[i]
    destObj[i] = isFunc(prop) ? bind(prop, add) : prop
    props.push(i)
  }
  return destObj
}

Scope.shallowCopy = shallowCopy
function shallowCopy(destObj, add) {
  for (var i in add)
    destObj[i] = add[i]
  
  return destObj
}

Scope.clean = clean
function clean(scope, propsToClean) {
  propsToClean = propsToClean || []

  for (var i = 0; i < propsToClean.length; i++)
    delete propsToClean[propsToClean[i]]

  return scope
}

