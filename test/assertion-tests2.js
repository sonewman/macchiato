var sinon = require('sinon')
var describe = require('../')

describe('My Application', function () {

  beforeEach(function () {
    this.thing = this.stub()
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
      done()
    })

  })

})

