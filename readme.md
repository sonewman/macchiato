# Macchiato

A Mocha / Jasmine themed testing framework build ontop of [Tape](https://github.com/substack/tape)

It therefore currently only outputs TAP (Test Anywhere Protocol) results at present

to use after install:

```javascript

require('macchiato')()

// or

var describe = require('macchiato')
```
then...
```javascript
describe('my test', function () {

  beforeEach(function () {
    // sinon is baked in so all stubs
    // are restored after each test
    this.myStub = this.stub()
  })

  it('should do amazing things', function () {
    this.equals('tape assertions are also baked into the framework', true)
    this.end()
  })

  describe('my subtest', function () {
    
    it('should do something interesting', function (done) {
      this.assert(true, 'this test is asserting something')
      done()
    })
  })
})

```

More documentation coming soon...
