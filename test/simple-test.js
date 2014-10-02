var test = require('tap').test
var describe = require('../')
var count = 0

test('runner test', function (t) {
  
  describe('base-level block one', function () {

    describe.beforeEach(function () {
      t.equals(++count, 1)
    })
    
    describe.it('base-level block one test', function (i) {
      t.equals(++count, 2)
      i.end()
    })
  })
  

  describe('base-level block two', function () {
    describe.it('base-level block two test one', function (i) {
      t.equals(++count, 3)
      i.end()
    })
    
    describe('level-one block one', function () {

      describe('level-two block one', function () {
        describe.it('level-two test', function (i) {
          process.nextTick(function () {
            t.equals(++count, 4)
            i.end()
          })
        })
      })

      describe.it('level-one test one', function (i) {
        process.nextTick(function () {
          t.equals(++count, 5)
          i.end()
        })
      })
    })
    
    describe.it('base-level block two test two', function (i) {
      t.equals(++count, 6)
      i.end()
      t.end()
    })
  })
})

