var methods = [
  'before'
  , 'beforeEach'
  , 'after'
  , 'afterEach'
]

exports.METHODS = Object.freeze(methods)

function makeCallback(walker, name) {
  return function aspectMethod(fn) {
    walker.addAspect(name, fn)
  }
}

exports.make = function makeAspects(walker, obj) {
  var name
  for (var i = 0; i < methods.length; i++) {
    name = methods[i]
    obj[name] = makeCallback(walker, name)
  }
}
