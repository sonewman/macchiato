var describe = require('../')

var testName = 'Assertion test one'

describe(testName, function () {

  describe.beforeEach(function (ctx) {
    this.thing = this.stub()
    this.expect(ctx).to.equal(this)
  })

  describe.it('Should do some stuff', function (test) {
    this.thing()
    this.expect(this.thing.calledOnce).to.be.true()
    test.end()
  })

  describe.it('Should do some stuff again', function (test) {
    this.thing()
    this.expect(this.thing.calledOnce).to.be.true()
    test.end()
  })

  describe('sub test', function () {

    describe.beforeEach(function () {
      this.thing = null
    })

    describe.it('Should run spec once again', function (test) {
      this.expect(this.thing).to.equal(null)
      test.end()
    })
  })

  describe('something else', function () {

    describe.it('Should do some more things', function () {
      this.expect(true).to.be.true('even deeper test was called')
      this.end()
    })
  })

  describe('another branch', function () {

    describe.it('Should run peer sub test spec', function () {
      this.expect(true).to.be.true('peer nested test was called')
      this.expect(true).to.be.true('something else passed')
      this.end()
    })

  })
})

describe.scheduler.afterAll(function () {
  console.log(testName)
  console.log('-- passed')
})
