

function merge(obj, toMerge) {
  toMerge = toMerge || {}
  for (var i in toMerge) obj[i] = toMerge[i]
}



module.exports = Suite

function Suite(options) {
  merge(this, options)
  
}



Suite.Test = Test

function Test(options) {
  merge(this, options)
}



