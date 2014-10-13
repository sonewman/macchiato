module.exports = SpecOut

var inherits = require('util').inherits
var utils = require('core-util-is')
var Transform = require('stream').Transform
var TICK = '\u2714 '
var CROSS = '\u2716 '
var GREEN_START = '\x1B[32m'
var RED_START = '\x1B[31m'
var GREY_START ='\x1B[90m'
var WHITE_START = '\x1B[39m'

function map(arr, fn, ctx) {
  if (utils.isFunction(arr.map)) return arr.map(fn, ctx)
  var ret = []
  for (var i = 0, l = arr.length; i < l; i++)
    ret.push(arr.call(ctx, arr[i], i, arr))
  return ret
}


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
  this._history = []
  this._totalTime = 0
}

inherits(SpecOut, Transform)

function getTime(test) {
  return (test.endTime - test.startTime)
}

SpecOut.prototype._transform = transform_
function transform_(test, enc, next) {
  var results = test.results || []
  var result
  var rs
  var error = null
  var parentLevel = test.parent.level

  if (!this._hasHeader) {
    this.push('\n\n')
    this.push(
      indent(underline('Macchiato: Running tests\n\n'), 1)
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
//      add addional flag for granularity
      single.push(passedTest(result.name, parentLevel))
      this._passingAsserts++
    } else {
      single.push(failedTest(red(bold(result.name)), parentLevel))
      this._ok = false
      error = formatError(result)
    }

    if (error) {
      error = map(error, function (line, index) {
        var level = (i + 1) < results.length ? parentLevel : parentLevel - 1
        var l = indent(branch(level, ' '), 2) + grey(line)
        return (index > 0 ? '\n' : '') + l
      }).join('')
      single.push(grey(error))
      output = output.concat(single)
    } else {
      this._count++
    }
  }

  var time = getTime(test)
  var testLine = test.name + ' (' + time + 'ms)'
  this._totalTime += time

  if (error) {
    output.unshift(failedTest(testLine, parentLevel - 1))
    error = null
  } else {
    output.unshift(passedTest(testLine, parentLevel - 1))
  }

  var parentName
  if (this._history.indexOf(test.parent) === -1) {
    this._history.push(test.parent)

    parentName = parentLevel < 2
      ? indent(grey('+ ') + test.parent.name, 1)
      : indent(branch(parentLevel - 2) + test.parent.name, 2)

    output.unshift(parentName)
  }

  output.push('')
  next(null, output.join('\n'))
}

SpecOut.prototype._flush = flush_
function flush_() {
  var endOutput = ['\n']

  // add the total tests
  // e.g. # tests 10
  endOutput.push(indent(totalTests(this._total), 1))

  // add the total passes
  // e.g. # pass 9
  endOutput.push(indent(totalPasses(this._count), 1))

  // add the total failures
  // e.g. # fail 1
  endOutput.push(indent(totalFails(this._count, this._total), 1))

  var resultText = indent(result(this._count, this._total), 1)
  resultText += grey(' in ' + this._totalTime + 'ms')
  // give end result
  // e.g. # ok
  endOutput.push('\n' + resultText  + '\n\n')

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
    ? bold(red('Fail:  ' + fails)) + '\n'
    : ''
}

function result(count, total) {
  return bold(count === total ? green('Passed!') : red('Failed!'))
}

function formatError(result) {
  var errorOutput = []

  if (result.msg)
    errorOutput.push(result.msg)

  if (result.file)
    errorOutput.push(formatFile(result.file))

  if (result.line)
    errorOutput.push('line:   ' + result.line)

  if (result.column)
    errorOutput.push('column: ' + result.column)

  if (result.error && result.error.stack)
    errorOutput = errorOutput.concat(formatStack(result.error.stack))

  // we have no errors to output
  if (errorOutput.length === 1)
    errorOutput.push('error:   unknown')

  errorOutput = map (errorOutput, function (line) {
    return '  ' + line
  })

  errorOutput.unshift('')
  errorOutput.push('')
  return errorOutput
}

function formatFile(file) {
  if (!file) return file
  return grey('file:   ' + (file || '').replace(/\:[0-9]+\:[0-9]+$/, ''))
}

function formatStack(stack) {
  var st = stack.split('\n').slice(1)

  var output = map(st, function (line) {
    return line.replace(/\s{0,2}at/, '-')
  })

  output.unshift('stack:')
  return output
}

function dupe(str, times) {
  var ret = ''
  for (var i = 0; i < times; i++)
    ret += str
  return ret
}

function branch(no, post) {
  return grey(dupe('| ', no) + '|' + (utils.isString(post) ? post : '-'))
}

function indent(text, no) {
  return dupe('  ', no || 0) + text
}

function green(text) {
  return GREEN_START + text + WHITE_START
}

function red(text) {
  return RED_START + text + WHITE_START
}

function grey(text) {
  return GREY_START + text + WHITE_START
}

function bold(text) {
  return '\x1B[1m' + text + '\x1B[22m'
}

function underline(text) {
  return '\x1B[4m' + text + '\x1B[24m'
}

function passedTest(text, no) {
  return indent(branch(no) + green(bold(TICK)) + grey(text), 2)
}

function failedTest(text, no) {
  return indent(branch(no) + red(bold(CROSS)) + grey(text), 2)
}
