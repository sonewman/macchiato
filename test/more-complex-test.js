var test = require('tap').test
var sinon = require('sinon')
var macchiato = require('../')
macchiato()

test('more-complex-test', function (t) {
  var mockBeforeEach = sinon.stub()
  var mockXit = sinon.stub()
  var mockXDescribe = sinon.stub()
  
  function end() {
    t.equals(mockBeforeEach.callCount, 4, 'outtermost before each was called for each test')
    t.assert(mockXDescribe.notCalled, 'xdescribe was not called')
    t.assert(mockXit.notCalled, 'xit was not called')
    t.end()
  }

  describe('My Application', function () {

    beforeEach(mockBeforeEach)

    it('Should do some stuff', function (done) {
     t.assert(true, 'base level test was called')
      done()
    })

    describe('sub test', function () {

      it('Should run spec one', function (done) {
        t.assert(true, 'nested test was called')
        done()
      })

      describe('something else', function () {

        it('Should do some more things', function (done) {
          t.assert(true, 'even deeper test was called')
          this.end()
        })
      })

    })

    describe('another branch', function () {

      it('Should run peer sub test spec', function () {
        t.assert(true, 'peer nested test was called')
        this.end()
        end()
      })

    })

    xdescribe('this spec should not fire', mockXDescribe)
    xit('this test should not fire', mockXit)
  })
})

