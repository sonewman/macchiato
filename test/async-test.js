var testName = 'Asyc block ordering test'
var assert = require('assert')
var describe = require('../')()
var count = 0

describe('base-level block one', function () {
  describe.beforeEach(function () {
    assert.equal(++count, 1)
  })

  describe.it('base-level block one test', function (i) {
    setTimeout(function () {
      assert.equal(++count, 2)
      i.end()
    }, 0)
  })
})

describe('base-level block two', function () {
  
  describe.before(function () {
    assert.equal(++count, 3)
  })

  describe.it('base-level block two test one', function (i) {
    setTimeout(function () {
      assert.equal(++count, 4)
      i.end()
    }, 0)
  })

  describe('level-one block one', function () {

    describe.before(function () {
      assert.equal(++count, 5)
    })

    describe('level-two block one', function () {
      describe.it('level-two test', function (i) {
        setTimeout(function () {
          assert.equal(++count, 6)
          i.end()
        }, 0)
      })
    })

    describe.it('level-one test one', function (i) {
      setTimeout(function () {
        assert.equal(++count, 7)
        i.end()
      }, 0)
    })
  })

  describe.it('base-level block two test two', function (i) {
    setTimeout(function () {
      assert.equal(++count, 8)
      i.end()
    }, 0)
  })
})

describe.scheduler.afterAll(function () {
  console.log(testName)
  console.log('-- passed')
})
