var assert = require('assert')
var describe = require('../')
var count = 0

console.log('runner test')

describe('base-level block one', function () {
  describe.beforeEach(function () {
    assert.equal(++count, 1)
  })

  describe.it('base-level block one test', function (i) {
    assert.equal(++count, 2)
    i.end()
  })
})


describe('base-level block two', function () {
  describe.it('base-level block two test one', function (i) {
    assert.equal(++count, 3)
    i.end()
  })

  describe('level-one block one', function () {

    describe('level-two block one', function () {
      describe.it('level-two test', function (i) {
        process.nextTick(function () {
          assert.equal(++count, 4)
          i.end()
        })
      })
    })

    describe.it('level-one test one', function (i) {
      process.nextTick(function () {
        assert.equal(++count, 5)
        i.end()
      })
    })
  })

  describe.it('base-level block two test two', function (i) {
    assert.equal(++count, 6)
    i.end()
  })
})
