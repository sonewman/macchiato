var createContext = require('./lib/describe-context')

var macchiato = createContext({ stdout: false })

var outputs = macchiato.outputs
outputs.browser = require('./lib/client-side/html-out')

module.exports = macchiato
