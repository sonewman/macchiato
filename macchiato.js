var createContext = require('./lib/describe-context')
var program = require('commander')

program
  .version(require('./package').version)
  .usage('[options] <file ...>')
  .option('-o, --output [type]', 'Output format [spec]')
  .option('-t, --timeout [value]', 'Time time out [ms]', Number)
  .option('-p, --passing', 'Display passing tests')
  .option('-P, --pending', 'Display pending tests')
  .option('-f, --failing', 'Display failing tests')
  .option('-g, --granular', 'Display all granular asserts')
  .option('-G, --grep [value]', 'Only Run Tests Matching pattern [value]')
  .option('-U, --useGlobals', 'Make methods globals')
 // - coming soon .option('-b, --browser', 'Run test through browser via browserify')

var opts = program.parse(process.argv)

;['passing', 'pending', 'failing'].filter(function (key) {
  if (key in opts) return key
})
.forEach(function (key, i, arr) {
  if (!~arr.indexOf(key)) opts[key] = false
})

var options = Object.keys(createContext.defaultOptions)
  .reduce(function (o, key) {
    if (opts[key] !== undefined)
      o[key === 'args' ? '__args' : key] = opts[key]
    return o
  }, {})

options.outputs = {
  spec: require('./lib/spec-out'),
  tap: require('tapout')
}

module.exports = createContext(options)
module.exports.create = createContext;
