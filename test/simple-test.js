var test = require('tap').test
//var test = require('tape')
var macchiato = require('../')
macchiato({ silent: true })

test('simple test', function (t) {
  
  describe('my test', function () {
    
    beforeEach(function () {
      this.myTest = true
    })
    
    it('should do another thing', function (done) {
      this.assert(this.myTest)
      t.assert(this.myTest)
      t.end()
      done()
    })
  })
})

