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
  var passed = true
  var error = null

  if (!this._hasHeader) {
    this.push('Macchiato Running tests\n\n')
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
      single.push(indent(passedTest(result.name)), 2)
      this._passingAsserts++
    } else {
      single.push(indent(failedTest(result.name)), 2)
      this._ok = false
      error = formatError(result)
    }

    if (error) {
      single.push(error)
      error = null
      output.concat(single)
    }
  }
  
  if (!error) {
    this._count++
    output.unshift(indent(passedTest(test.name)))
  } else {
    output.unshift(indent(failedTest(test.name)))
  }

  output.push('')
  next(null, output.join('\n'))
}

SpecOut.prototype._flush = flush_
function flush_() {
  var endOutput = ['\n']

  // add the span of the tests
  // e.g. 1..10
  endOutput.push(span(this._total))

  // add the total tests
  // e.g. # tests 10
  endOutput.push(totalTests(this._total))

  // add the total passes
  // e.g. # pass 9
  endOutput.push(totalPasses(this._count))

  // add the total failures
  // e.g. # fail 1
  endOutput.push(totalFails(this._count, this._total))

  // give end result
  // e.g. # ok
  endOutput.push(result(this._count, this._total))

  this.push(endOutput.join(''))
  this.push(null)
}

function span(total) {
  return '| ' + 
    (total > 0
      ? '1..' + total + '\n'
      : '0\n')
}

function totalTests(total) {
  return '| tests ' + total + '\n'
}

function totalPasses(count) {
  return count > 0
    ? '| pass  ' + count + '\n'
    : ''
}

function totalFails(count, total) {
  var fails = total - count
  return fails > 0
    ? '| fail  ' + fails + '\n'
    : ''
}

function result(count, total) {
  return '\n' + (count === total ? '| Passed! :D' : '| Failed :(') + '\n\n'
}

function formatError(result) {
  var errorOutput = ['  ---']

  if ('string' === typeof result.file)
    errorOutput.push(formatFile(result.file))

  if ('number' === typeof result.line)
    errorOutput.push(formatLine(result.line))

  if ('number' === typeof result.column)
    errorOutput.push(formatColumn(result.column))

  if (result.error && result.error.stack)
    errorOutput.push(formatStack(result.error.stack))

  // we have no errors to output
  if (errorOutput.length === 1)
    errorOutput.push('    error:   unknown')

  errorOutput.push('  ...\n')
  return errorOutput.join('\n')
}

function formatFile(file) {
  if (!file) return file
  return indent(
    'file: ' + indent(file || '')
      .replace(/\:[0-9]+\:[0-9]+$/, '')
    , 2
  )
}

function formatLine(line) {
  return indent('line:   ' + line, 2)
}

function formatColumn(column) {
  return indent('column: ' + column, 2)
}

function formatStack(stack) {
  var st = stack.split('\n').slice(1)
  var output = [indent('stack:', 2)]

  for (var i = 0; i < st.length; i++)
    output.push(st[i].replace(/at/, '-'))

  return output.join('\n  ')
}

function indent(text, no) {
  var str = ''
  no = no || 1
  for (var i = 0; i < no; i++) str += '  '
  return str + text
}

function passedTest(text) {
  return '\x1B[32m' + TICK + '\x1B[90m' + text + '\x1B[39m' 
}

function failedTest(text) {
  return '\x1B[31m' + CROSS + '\x1B[90m' + text + '\x1B[39m' 
}

function bold(text) {
  return '\x1B[1m' + text + '\x1B22m'
}
