module.exports = Scope

var sinon = require('sinon')
var utils = require('core-util-is')
var certainResults = require('certain').withResults


// so that this will work on crap browsers
function bind(fn, context) {
  return Function.prototype.bind ? fn.bind(context) : function () {
    return fn.apply(context, [].slice.call(arguments))
  }
}

function Scope() { }

Scope.prototype = sinon.sandbox.create()
Scope.prototype.match = sinon.match

Scope.prototype.expect = certainResults()

Object.defineProperty(Scope.prototype, 'readStream', {
  get: function () { return this.expect.readStream }
})

// this would get overridden by the test
//Scope.prototype.assert = sinon.assert


//function bindIfFunc(propName, obj) {
//  var prop = obj[propName]
//  return utils.isFunction(prop) ? bind(prop, obj) : prop
//}
//
//;(function (proto) {
//  for (var key in sinon.assert)
//    proto[key] = bindIfFunc(key, sinon.assert)
//}(Scope.prototype))
//
//Scope.meld = meld
//function meld(destObj, add, props) {
//  var prop, i
//  props = props || []
//  for (i in add) {
//    destObj[i] = bindIfFunc(i, add)
//    props.push(i)
//  }
//  return destObj
//}
//
//Scope.shallowCopy = shallowCopy
//function shallowCopy(destObj, add) {
//  for (var i in add)
//    destObj[i] = add[i]
//  
//  return destObj
//}
//
//Scope.clean = clean
//function clean(scope, propsToClean) {
//  propsToClean = propsToClean || []
//
//  for (var i = 0; i < propsToClean.length; i++)
//    delete propsToClean[propsToClean[i]]
//
//  return scope
//}
//
