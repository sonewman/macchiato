var test = require('tap').test
var sinon = require('sinon')
var describe = require('../')

test('more-complex-test', function (t) {
  var mockBeforeEach = sinon.stub()
  
  function end() {
    t.equals(mockBeforeEach.callCount, 4, 'outtermost before each was called for each test')
    t.end()
  }

  describe('My Application', function () {

    describe.beforeEach(mockBeforeEach)

    describe.it('Should do some stuff', function (test) {
      t.assert(true, 'base level test was called')
      test.done()
    })

    describe('sub test', function () {

      describe.it('Should run spec one', function (test) {
        t.assert(true, 'nested test was called')
        test.done()
      })

      describe('something else', function () {

        describe.it('Should do some more things', function (test) {
          t.assert(true, 'even deeper test was called')
          this.end()
        })
      })

    })

    describe('another branch', function () {

      describe.it('Should run peer sub test spec', function () {
        t.assert(true, 'peer nested test was called')
        this.expect(true).to.be.true('something failed')
        this.end()
        end()
      })

    })

  })
})

