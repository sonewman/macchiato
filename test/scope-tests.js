var testName = 'Scope Test'
var assert = require('assert')
var sinon = require('sinon')
var describe = require('../')

var expected = 4
var i = 0
function assertResults(result) {
  assert(result.ok)

  if (++i === 4) {
    this.removeListener('data', assertResults)
  }
}

describe(testName, function () {

  describe.it('Should contain certain method short hands', function (t) {
    t._readStream.on('data', assertResults)
    
    t.assert(true, 'is truthy')
    t.isTrue(true, 'is true')
    t.equals(1, 1, '1 & 1 are equal')
    t.notEqual(1, 2, '1 & 2 are not equal')
    
    t._readStream
    t.end()
  })

})

describe.scheduler.afterAll(function () {
  console.log(testName)
  try {
    assert.equal(i, 4)
  } catch (err) {
    console.log('-- failed')
    throw err
  }

  console.log('--passed')
})
