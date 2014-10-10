# Macchiato

Install:
```bash
$ npm install --save-dev macchiato
```
and globally:
```bash
$ npm install -g macchiato
```

A [Mocha](https://github.com/visionmedia/mocha) / [Jasmine](https://github.com/pivotal/jasmine)
themed testing framework, comes equiped with a built in assertion library ([Certain](https://github.com/sonewman/certain)). 

Each of the test contexts have various assert methods added to them which call `certain` under
the hood for ease of use. In addition to this each of the test contexts are instanciated [sinon](http://github.com/cjohansen/Sinon.JS) sandbox's!

```javascript

var describe = require('macchiato')({[options]})

// or

var describe = require('macchiato')

```

## Version 2.*

The original version of `macchiato` was build ontop of the testing framework [Tape](https://github.com/substack/tape).
This is undoubtable an awesome testing framework, the problem was that when changes were 
needed to tweak the inner workings of `Macchiato` this was very difficult since all of the main 
design decisions had been made inside of Tape. I don't think Tape had really been build to accomodate that kind of abuse!

In `v2` this dependency has been completely removed. Macchiato now has it's own test runner.
This has made it much easier to manage and very modular, which means that in the future when features are added (to analyse test methods execution etc.) this will be a lot easier and also creates a lot of possibilies.

**Macchiato used to only output TAP (Test Anywhere Protocol), this has now changed.**

Macchiato has it's own output which is a lot like the `-R spec` option this is the default console output.

To change this output you can specify it as an option: 

Javascript:

```javascript
describe({ output: 'tap' })
```
Terminal:
```bash
$ macchiato -o tap test/*.js
```

## Usage

```javascript
describe('my test', function () {

  describe.beforeEach(function () {
    // sinon is baked in to the test context
    // and passed into all `beforeEach` and
    // `afterEach` callbacks. All spys/stubs
    // are restored after each test.
    this.myStub = this.stub()
  })

  describe.it('should do amazing things', function (t) {
    // the test context can be accessed as the first
    // arguments to the test callback
    t.equals('tape assertions are also baked into the framework', true)
    t.end()
  })

  describe('my subtest', function () {
    
    descibe.it('should do something interesting', function () {
      // the test context is also `this` in the test callback
      this.assert(true, 'this test is asserting something')
      this.done()
    })
  })
})

```

More documentation coming soon...
