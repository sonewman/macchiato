module.exports = SpecOut

var inherits = require('util').inherits
var Transform = require('stream').Transform
var TICK = '\u2714 '
var CROSS = '\u2716 '

function SpecOut(options) {
  Transform.call(this, { objectMode: true })
  options = options || {}

  this._hasHeader = false
  this._hasFooter = false
  this._hasEnded = false
  this._count = 0
  this._total = 0
  this._ok = true
  this._totalAsserts = 0
  this._passingAsserts = 0
}

inherits(SpecOut, Transform)

SpecOut.prototype._transform = transform_
function transform_(test, enc, next) {
  var results = test.results || []
  var result
  var rs
  var error = null

  if (!this._hasHeader) {
    this.push('\n\n')
    this.push(
      indent(underline('Macchiato: Running tests\n\n'))
    )
    this._hasHeader = true
  }

  // start output with test name
  var output = []
  var res = []
  var single = []

  for (var i = 0; i < results.length; i++) {
    this._total++
    result = results[i]
    this._totalAsserts++

    if (result.ok) {
      single.push(indent(passedTest(result.name), 2))
      this._passingAsserts++
    } else {
      single.push('\n' + indent(failedTest(result.name), 2))
      this._ok = false
      error = formatError(result)
    }

    if (error) {
      single.push(grey(error))
      output = output.concat(single)
    } else {
      this._count++
    }
  }

  if (error) {
    output.unshift(indent(failedTest(test.name), 3))
    error = null
  } else {
    output.unshift(indent(passedTest(test.name), 3))
  }

  output.push('')
  next(null, output.join('\n'))
}

SpecOut.prototype._flush = flush_
function flush_() {
  var endOutput = ['\n']

  // add the total tests
  // e.g. # tests 10
  endOutput.push(indent(totalTests(this._total)))

  // add the total passes
  // e.g. # pass 9
  endOutput.push(indent(totalPasses(this._count)))

  // add the total failures
  // e.g. # fail 1
  endOutput.push(indent(totalFails(this._count, this._total)))

  // give end result
  // e.g. # ok
  endOutput.push(bold(result(this._count, this._total)))

  this.push(endOutput.join(''))
  this.push(null)

  // if error then exit with failure code
  if (!this._ok) {
    process.exit(1)
  }
}

function totalTests(total) {
  return bold('Total: ' + total) + '\n'
}

function totalPasses(count) {
  return count > 0
    ? bold(green('Pass:  ' + count)) + '\n'
    : ''
}

function totalFails(count, total) {
  var fails = total - count
  return fails > 0
    ? bold(red('Fail:' + indent(fails))) + '\n'
    : ''
}

function result(count, total) {
  return '\n' + indent(count === total
    ? green('Passed!')
    : red('Failed!')
  ) + '\n\n'
}

function formatError(result) {
  var errorOutput = [indent('---', 3)]

  if (result.file)
    errorOutput.push(formatFile(result.file))

  if (result.line)
    errorOutput.push(formatLine(result.line))

  if (result.column)
    errorOutput.push(formatColumn(result.column))

  if (result.error && result.error.stack)
    errorOutput.push(formatStack(result.error.stack))

  // we have no errors to output
  if (errorOutput.length === 1)
    errorOutput.push(indent('error:   unknown', 3))

  errorOutput.push(indent('...\n', 3))
  return errorOutput.join('\n')
}

function formatFile(file) {
  if (!file) return file
  return indent(
    'file: ' + indent(file || '')
      .replace(/\:[0-9]+\:[0-9]+$/, '')
    , 4
  )
}

function formatLine(line) {
  return indent('line:   ' + line, 4)
}

function formatColumn(column) {
  return indent('column: ' + column, 4)
}

function formatStack(stack) {
  var st = stack.split('\n').slice(1)
  var output = [indent('stack:', 4)]

  for (var i = 0; i < st.length; i++)
    output.push(indent(st[i].replace(/at/, '-'), 2))

  return output.join('\n  ')
}

function indent(text, no) {
  var str = ''
  no = no || 1
  for (var i = 0; i < no; i++) str += '  '
  return str + text
}

function green(text) {
  return '\x1B[32m' + text + '\x1B[39m'
}

function red(text) {
  return '\x1B[31m' + text + '\x1B[39m'
}

function grey(text) {
  return '\x1B[90m' + text + '\x1B[39m'
}

function passedTest(text) {
  return '\x1B[32m' + bold(TICK) + grey(text)
}

function failedTest(text) {
  return '\x1B[31m' + bold(CROSS) + grey(text)
}

function bold(text) {
  return '\x1B[1m' + text + '\x1B[22m'
}

function underline(text) {
  return '\x1B[4m' + text + '\x1B[24m'
}

function boldUnderline(text) {
  return bold(underline(text))
}
