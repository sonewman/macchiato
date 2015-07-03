module.exports = SpecOut

var inherits = require('inherits')
var utils = require('core-util-is')

var Transform = require('readable-stream').Transform
var TICK = '\u2714 '
var CROSS = '\u2716 '
var DISC = '\u2741 '
var GREEN_START = '\x1B[32m'
var RED_START = '\x1B[31m'
var GREY_START = '\x1B[90m'
var WHITE_START = '\x1B[39m'
var CYAN_START = '\x1B[36m'

function SpecOut(options) {
  Transform.call(this, { objectMode: true })
  options = options || {}

  this._options = options

  this._hasHeader = false
  this._hasFooter = false
  this._hasEnded = false
  this._passes = 0
  this._failures = 0
  this._total = 0
  this._ok = true
  this._totalAsserts = 0
  this._passingAsserts = 0
  this._failingAsserts = 0
  this._history = []
  this._totalTime = 0
  this._totalPending = 0
}

inherits(SpecOut, Transform)

function getTime(test) {
  return (test.endTime - test.startTime)
}

function parseResults_(outStream, parentLevel, test) {
  var results = test.results
  var hasErrored = false
  var options = outStream._options

  function formatErrLine(resultIndex) {
    return function (line, index) {
      var level = (resultIndex + 1) < results.length
        ? parentLevel : parentLevel - 1

      var l = indent(branch(level, ' '), 2) + grey(line)
      return (index > 0 ? '\n' : '') + l
    }
  }

  // increase total
  outStream._total++

  function reduceResults(output, result, i) {
    var single = []
    var error;
    outStream._totalAsserts++

    if (result.ok) {
      single.push(passedTest(green(result.name), parentLevel))
      outStream._passingAsserts++

      if (options.granular && options.passing !== false)
        output = output.concat(single)

    } else {
      single.push(failedTest(red(bold(result.name)), parentLevel))
      outStream._ok = false
      outStream._failingAsserts++
      error = formatError(result)
      hasErrored = true

      if (options.failing !== false) {
        error = error.map(formatErrLine(i)).join('')
        single.push(grey(error))
        output = output.concat(single)
      }
    }

    return output
  }

  var output = results.reduce(reduceResults, [])
  var time = getTime(test)
  var testLine = test.name + ' (' + time + 'ms)'
  outStream._totalTime += time

  if (hasErrored) {
    outStream._failures++

    if (options.failing !== false)
      output.unshift(failedTest(testLine, parentLevel - 1))

  } else if (test.pending ) {
    outStream._totalPending++

    if (options.pending !== false)
      output.unshift(pendingTest(testLine, parentLevel - 1))

  } else {
    outStream._passes++

    if (options.passing !== false)
      output.unshift(passedTest(testLine, parentLevel - 1))
  }

  return output
}

SpecOut.prototype._transform = transform_
function transform_(test, enc, next) {
  var self = this

  if (!self._hasHeader) {
    self.push('\n\n')
    self.push(
      indent(underline('Macchiato: Running tests\n\n'), 1)
    )
    self._hasHeader = true
  }

  // start output with test name
  var output = parseResults_(this, test.parent.level, test)

  function parentOutput(parent) {
    return parent.level < 2
      ? indent(grey('+ ') + parent.name, 1)
      : indent(branch(parent.level - 2) + parent.name, 2)
  }

  function recurseParents(test, arr) {
    if (self._history.indexOf(test) === -1) {
      self._history.push(test)

      if (test.base === false) {
        arr.unshift(parentOutput(test))

        if (test.parent)
          return recurseParents(test.parent, arr)
      }
    }

    return arr
  }

  var parentNames = recurseParents(test.parent, [])
  // add names to the start of output
  output = parentNames.concat(output)

  output.push('')
  next(null, output.join('\n'))
}

function aggregateTotals(reporter) {
  var endOutput = []

  // add the total tests
  endOutput.push(indent(totalTests(reporter._total), 1))

  // add the total passes
  if (reporter._passes)
    endOutput.push(indent(totalPasses(reporter._passes), 1))

  // print the total pending
  if (reporter._totalPending)
    endOutput.push(indent(totalPending(reporter._totalPending), 1))

  // add the total failures
  if (reporter._failures)
    endOutput.push(indent(totalFails(reporter._failures), 1))

  var notFails = reporter._passes + reporter._totalPending
  var resultText = indent(result(notFails, reporter._total), 1)
  resultText += grey(' in ' + reporter._totalTime + 'ms')

  // give end result
  endOutput.push('\n' + resultText + '\n\n')

  return endOutput
}

SpecOut.prototype._flush = flush_
function flush_() {
  var endOutput = aggregateTotals(this)
  endOutput.shift('\n');

  this.push(endOutput.join(''))
  this.push(null)

  // if error then exit with failure code
  if (!this._ok && !this._options.cleanExit) {
    process.exit(1)
  }
}

function totalTests(total) {
  return bold('Total:  ' + countOutput(total)) + '\n'
}

function totalPasses(count) {
  return tot(count, green('Pass:   ' + countOutput(count)))
}

function totalPending(count) {
  return tot(count, cyan('Pending:' + countOutput(count)))
}

function totalFails(count) {
  return tot(count, red('Fail:   ' + countOutput(count)))
}

function tot(count, text) {
  return count > 0
    ? bold(text) + '\n'
    : ''
}

function countOutput(count) {
  count = String(count)
  var rem = 4 - count.length
  var i = -1
  while (++i <= rem) count = ' ' + count
  return count
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

  errorOutput = errorOutput.map(function (line) {
    return '  ' + line
  })

  errorOutput.unshift('')
  errorOutput.push('')
  return errorOutput
}

var lineColNos = /\:[0-9]+\:[0-9]+$/
function formatFile(file) {
  if (!file) return file
  return grey('file:   ' + (file || '').replace(lineColNos, ''))
}

function formatStack(stack) {
  var st = stack.split('\n').slice(1)

  var output = st.map(function (line) {
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

function cyan(text) {
  return CYAN_START + text + WHITE_START
}

function bold(text) {
  return '\x1B[1m' + text + '\x1B[22m'
}

function underline(text) {
  return '\x1B[4m' + text + '\x1B[24m'
}

function passedTest(text, no) {
  return indent(branch(no) + green(bold(TICK)) + ' ' + grey(text), 2)
}

function pendingTest(text, no) {
  return indent(branch(no) + cyan(bold(DISC)) + ' ' + grey(text), 2)
}

function failedTest(text, no) {
  return indent(branch(no) + red(bold(CROSS)) + ' ' + grey(text), 2)
}
