var testName = 'Return promise'
var Promise = require('promise')
var describe = require('../')

describe(testName)
.it('Should allow a promise to end spec', function () {
  return Promise.resolve(true)
})

describe.scheduler.afterAll(function () {
  console.log(testName)
  console.log('-- passed')
})
