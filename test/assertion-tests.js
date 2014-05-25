var sinon = require('sinon')
var describe = require('../')

describe('My Application', function () {

  beforeEach(function () {
    this.thing = this.stub()
  })

  it('Should do some stuff', function (done) {
    this.thing()
    this.assert(this.thing.calledOnce)
    done()
  })

  it('Should do some stuff again', function (done) {
    this.thing()
    this.assert(this.thing.calledOnce)
    done()
  })

  describe('sub test', function () {
    
    beforeEach(function () {
      this.thing = null
    })

    it('Should run spec once again', function (done) {
      this.equals(this.thing, null)
      done()
    })

  })

  describe('something else', function () {

    it('Should do some more things', function (done) {
      this.assert(true, 'even deeper test was called')
      this.end()
    })
  })

  describe('another branch', function () {

    it('Should run peer sub test spec', function () {
      this.assert(true, 'peer nested test was called')
      this.assert(true, 'something failed')
      this.end()
    })

  })
})

