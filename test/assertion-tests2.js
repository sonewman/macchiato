var sinon = require('sinon')
var describe = require('../')
var test = require('tap').test

test('assert test 2', function (t) {

  describe('My Application', function () {

    beforeEach(function () {
      this.thing = this.stub()
      this.value =  123
    })

    it('Should do some stuff', function (test) {
      test.thing()
      test.assert(test.thing.calledOnce)
      test.assert(this.thing.calledOnce)
      test()
    })

    describe('sub test', function () {
      
      beforeEach(function () {
        this.thing = null
      })

      it('Should run spec once again', function (done) {
        this.equals(this.thing, null)
        this.equals(this.value, done.value)
        done.value = 321
        done()
      })

      afterEach(function () {
        t.equals(this.value, 321)
        t.end()
      })
    })
  })
})


