var sinon = require('sinon')
var describe = require('../')
var test = require('tap').test

test('assert test 2', function (t) {

  describe('My Application', function () {

    describe.beforeEach(function () {
      this.thing = this.stub()
      this.value =  123
    })

    describe.it('Should do something', function (test) {
      test.thing()
      test.expect(test.thing.calledOnce).to.equal(true)
      test.expect(this.thing.calledOnce).to.equal(true)
      test.done()
    })

    describe('sub test', function () {
      
      describe.beforeEach(function () {
        this.thing = null
      })

      describe.it('Should run another test', function (test) {
        this.expect(this.thing).to.equal(null)
        this.expect(this.value).to.equal(test.value)
        test.value = 321
        test.done()
      })

      describe.afterEach(function () {
        t.equals(this.value, 321)
        t.end()
      })
    })
  })
})


