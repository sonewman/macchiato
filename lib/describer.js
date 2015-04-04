var Walker = require('./walker')
var Runner = require('./runner')
var Scheduler = require('./scheduler')

function Describer(options) {
  var walker = this.walker = new Walker(options)
  var runner = this.runner = new Runner(options)
  var scheduler = this.scheduler = new Scheduler()

  runner.on('end', scheduler.next)
  this.describe = walker.newDescribe(runner, scheduler)
}

function requireFile(filename) {
  try {
    require(filename)
  } catch(err) {
    console.error('Error Running Test: %s', filename)
    console.error(err.stack)
  }
}

Describer.prototype.run = function run(files) {
  for (var i = 0; i < (files || []).length; i++)
    requireFile(files[i])
}

module.exports = Describer
