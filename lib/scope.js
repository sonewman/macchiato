module.exports = Scope

var sinon = require('sinon')

function isFunc(obj) { return 'function' === typeof obj }

function Scope() {
  if (!(this instanceof Scope))
    return new Scope()
}

Scope.prototype = sinon.sandbox.create()
Scope.prototype.match = sinon.match
//Scope.prototype.assert = sinon.assert


Scope.meld = meld
function meld(scope, add, props) {
  var prop, i
  props = props || []
  console.log('sadasd')
  for (i in add) {
    prop = add[i]
    scope[i] = isFunc(prop) ? prop.bind(add) : prop
    props.push(i)
  }
  console.log('asdjansd')
  return scope
}


Scope.clean = clean
function clean(scope, propsToClean) {
  propsToClean = propsToClean || []

  for (var i = 0; i < propsToClean.length; i++)
    delete propsToClean[propsToClean[i]]

  return scope
}


