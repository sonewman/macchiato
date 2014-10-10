var testName = 'Chaining test'
var assert = require('assert')
var sinon = require('sinon')
var describe = require('../')

var beforeEachStub = sinon.stub()
var afterEachStub = sinon.stub()

var count = 0


describe(testName)
  .beforeEach(beforeEachStub)
  .it('Should allow one method to chain', function () {
    this.pass()
    this.end()
    count++
  })
  .it('Should allow a second method to chain', function () {
    this.pass()
    this.end()
    count++
  })
  .afterEach(afterEachStub)

describe.scheduler.afterAll(function () {
  console.log(testName)
  assert(beforeEachStub.calledTwice)
  assert(afterEachStub.calledTwice)
  assert.equal(count, 2)
  console.log('-- passed')
})
