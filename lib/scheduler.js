var isFunction = require('core-util-is').isFunction

var schedule = (function schedule() {
  if ('function' === typeof setImmediate)
    return setImmediate
  else if ('object' === typeof process
    && 'function' === typeof process.nextTick)
    return process.nextTick
  else
    return setTimeout
}())

function iterate(arr) {
  var l = arr.length
  for (var i = 0; i < l; i++)
    if (isFunction(arr[i])) arr[i]()
}

function Scheduler() {
  var self = this

  self._before = []
  self._tasks = []
  self._after = []
  var complete = false

  var taskCount = 0
  self.next = next
  function next() {
    if (complete) return

    var task = self._tasks[taskCount]
    if (isFunction(task)) {
      task()
      taskCount++
    } else {
      iterate(self._after)
      complete = true
    }
  }

  self.start = start
  function start() {
    iterate(self._before)
    next()
  }
  schedule(start)
}

module.exports = Scheduler

Scheduler.prototype.beforeAll = function (fn) {
  this._before.push(fn)
}

Scheduler.prototype.add = function (fn) {
  this._tasks.push(fn)
}

Scheduler.prototype.afterAll = function (fn) {
  this._after.push(fn)
}
