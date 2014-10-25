var createContext = require('./lib/describe-context')

var macchiato = createContext()

var outputs = macchiato.outputs
outputs.spec = require('./lib/spec-out')
outputs.tap = require('tapout')

module.exports = macchiato
