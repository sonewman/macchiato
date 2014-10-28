var inherits = require('inherits')
var utils = require('core-util-is')
var Writable = require('readable-stream').Writable
var TICK = '\u2714 '
var CROSS = '\u2716 '
var DISC = '\u2741 '

var trimStart = /^\s*/
var trimEnd = /\s*$/
var templateRegExp = /\{([^\}]+)\}/g
function compileTemplate(el) {
  var innerHTML = el.innerHTML
    .replace(trimStart, '')
    .replace(trimEnd, '')

  var parser = new DOMParser()

  return function (data) {
    data = data || {}
    var html = innerHTML.replace(templateRegExp, function () {
      return data[arguments[1]]
    })

    return parser.parseFromString(html, 'text/html')
      .body.childNodes[0]
  }
}

var outputCont = document.getElementById('results')
var branchTmpl = compileTemplate(document.getElementById('branch'))
var testTmpl = compileTemplate(document.getElementById('test'))

function writeOut(data) {
  if (data && data.nodeType) {
    outputCont.appendChild(data)
  } else {
    outputCont.innerHTML += data
  }
}

function map(arr, fn, ctx) {
  if (utils.isFunction(arr.map)) return arr.map(fn, ctx)
  var ret = []
  for (var i = 0, l = arr.length; i < l; i++)
    ret.push(arr.call(ctx, arr[i], i, arr))
  return ret
}

function HTMLOut(options) {
  Writable.call(this, { objectMode: true })
  options = options || {}

  this._options = options

  this._hasFooter = false
  this._hasEnded = false
  this._passes = 0
  this._failures = 0
  this._total = 0
  this._ok = true
  this._totalAsserts = 0
  this._passingAsserts = 0
  this._history = []
  this._totalTime = 0
  this._totalPending = 0

  this.once('finish', flush_)
}
inherits(HTMLOut, Writable)

module.exports = HTMLOut

function getTime(test) {
  return (test.endTime - test.startTime)
}

function parseResults_(outStream, parentLevel, test) {
  var results = test.results
  var resultsList = []
  var result
  var error = null
  var options = outStream._options
  var i, j
  var errorLines
  var errorList
  var li

  function formatErrLine(line) {
    var li = document.createElement('li')
    li.innerHTML = line
    return li
  }

  // increase total
  outStream._total++

  for (i = 0; i < results.length; i++) {
    result = results[i]
    outStream._totalAsserts++

    if (result.ok) {

      outStream._passingAsserts++
      li = makeListItem(passedTest(result.name))
      li.className += ' assert-passed'

    } else {
      outStream._ok = false

      error = formatError(result)
      errorLines = map(error, formatErrLine)
      outStream._failures++

      li = makeListItem(failedTest(result.name))
      li.className += ' assert-failed'

      errorList = document.createElement('ul')
      for (j = 0; j < errorLines.length; j++) {
        console.log(errorLines[j])
        errorList.appendChild(errorLines[j])
      }

      li.appendChild(errorList)
    }

    resultsList.push(li)
  }

  var time = getTime(test)
  var testLine = test.name + ' (' + time + 'ms)'
  outStream._totalTime += time

  var className

  if (error) {
    error = null

    if (options.failing !== false) {
      testLine = failedTest(testLine)
      className = 'fail'
    }

  } else if (test.pending) {
    outStream._totalPending++

    if (options.pending !== false) {
      testLine = pendingTest(testLine)
      className = 'pending'
    }

  } else {
    outStream._passes++

    if (options.passing !== false) {
      testLine = passedTest(testLine)
      className = 'pass'
    }
  }

  var testElement = testTmpl({
    status: className
    , name: testLine
  })

  var ul
  if (resultsList.length) {
    ul = testElement.getElementsByTagName('ul')[0]
    for (i = 0; i < resultsList.length; i++)
      ul.appendChild(resultsList[i])
  }

  return testElement
}


HTMLOut.prototype._write = function (test, enc, next) {
  var self = this
  var parent = test.parent

  // start output with test name
  var results = parseResults_(this, parent.level, test)

  function createBranch(parent) {
    var title = parent.name

    parent.el = branchTmpl({ title: title })
    parent.childList = parent.el.getElementsByTagName('ul')[0]
  }

  function recurseParents(parent, child) {
    if (self._history.indexOf(parent) === -1) {
      self._history.push(parent)
      createBranch(parent)
      parent.childList.appendChild(child)
      var grandParent = parent.parent

      if (grandParent && !grandParent.base) {
        if (grandParent.childList) {
          grandParent.childList.appendChild(parent.el)
        } else {
          recurseParents(grandParent, parent.el)
        }

      } else {
        return parent.el
      }

    } else {
      parent.childList.appendChild(child)
    }

    return null
  }

  var tree = recurseParents(parent, results)
  if (tree) {
    writeOut(tree)
  }

  next()
}

function flush_() {
  //  var endOutput = ['\n']
  //
//  // add the total tests
//  endOutput.push(indent(totalTests(this._total), 1))
//
//  // add the total passes
//  if (this._passes)
//    endOutput.push(indent(totalPasses(this._passes), 1))
//
//  // print the total pending
//  if (this._totalPending)
//    endOutput.push(indent(totalPending(this._totalPending), 1))
//
//  // add the total failures
//  if (this._failures)
//    endOutput.push(indent(totalFails(this._failures), 1))
//
//  var notFails = this._passes + this._totalPending
//  var resultText = indent(result(notFails, this._total), 1)
//  resultText += grey(' in ' + this._totalTime + 'ms')
//
//  // give end result
//  endOutput.push('\n' + resultText  + '\n\n')
//
//  this.push(endOutput.join(''))
//  this.push(null)
}

//function countOutput(count) {
//  count = String(count)
//  var rem = 4 - count.length
//  var i = -1
//  while (++i <= rem) count = ' ' + count
//  return count
//}
//
//function result(count, total) {
//  return bold(count === total ? green('Passed!') : red('Failed!'))
//}

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

//  errorOutput.unshift('')
//  errorOutput.push('')
  return errorOutput
}

var lineColNos = /\:[0-9]+\:[0-9]+$/
function formatFile(file) {
  if (!file) return file
  return 'file:   ' + (file || '').replace(lineColNos, '')
}

function formatStack(stack) {
  var st = stack.split('\n').slice(1)
  var line

  for (var i = 0; i < st.length; i++) {
    line = st[i]
  }
  var output = map(st, function (line) {
    var li = document.createElement('li')
    li.innerHTML = line.replace(/\s*at/, '-')
    return li
  })

  output.unshift('stack:')
  return output
}

function makeListItem(d) {
  var li = document.createElement('li')
  li.innerHTML = d
  li.className = 'assert'
  return li
}

function passedTest(text) {
  return TICK + text
}

function pendingTest(text) {
  return DISC + text
}

function failedTest(text) {
  return CROSS + text
}
