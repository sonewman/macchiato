var testName = 'Chaining test'
var assert = require('assert')
var sinon = require('sinon')
var describe = require('../')

var beforeEachStub = sinon.stub()
var afterEachStub = sinon.stub()

var count = 0


describe(testName + ' 1')
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
  .should('allow a test to be defined with .should', function () {
    this.pass()
    this.end()
    count++
  })
  .afterEach(afterEachStub)

describe(testName + ' 2')
  .should('allow a test to be defined with .should from initial desc', function () {
    this.pass()
    this.end()
    count++
  })

describe.scheduler.afterAll(function () {
  console.log(testName)
  assert(beforeEachStub.calledThrice)
  assert(afterEachStub.calledThrice)
  assert.equal(count, 4)
  console.log('-- passed')
})
