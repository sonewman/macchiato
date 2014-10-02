var assert = require('assert')
var sinon = require('sinon')
var describe = require('../')
var mockBeforeEach = sinon.stub()

function end() {
  console.log('more-complex-test')
  assert.equal(mockBeforeEach.callCount, 4, 'outtermost before each was called for each test')
}

console.log('My Application')

describe('My Application', function () {

  describe.beforeEach(mockBeforeEach)

  describe.it('Should do some stuff', function (test) {
    assert(true, 'base level test was called')
    test.done()
  })

  describe('sub test', function () {

    describe.it('Should run spec one', function (test) {
      assert(true, 'nested test was called')
      test.done()
    })

    describe('something else', function () {

      describe.it('Should do some more things', function (test) {
        assert(true, 'even deeper test was called')
        this.end()
      })
    })

  })

  describe('another branch', function () {

    describe.it('Should run peer sub test spec', function () {
      assert(true, 'peer nested test was called')
      this.expect(true).to.be.true('something failed')
      this.end()
      end()
    })
  })
})
