module.exports = (function () {
  if ('function' === typeof setImmediate)
    return setImmediate
  else if ('object' === typeof process
    && 'function' === typeof process.nextTick)
    return process.nextTick
  else
    return setTimeout
}())
