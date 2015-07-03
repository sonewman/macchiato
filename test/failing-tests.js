var describe = require('../')

// allow errors without process.exit(1)
describe.options.cleanExit = true

var assert = require('assert')
var testName = 'Failing tests'

describe(testName, function () {
  describe.it('Should do something', assert.throws.bind(assert, function () {
    throw new Error('Some Error Happened')
  }))
})

describe.scheduler.afterAll(function () {
  console.log(testName)
  console.log('-- passed')
})

