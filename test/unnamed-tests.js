var describe = require('../')
var assert = require('assert')
var called = false

describe(function () {
  this.should('do something')
})


describe.scheduler.afterAll(function () {

})
