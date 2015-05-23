module.exports = run

function requireFile(filename) {
  try {
    require(filename)
  } catch(err) {
    console.error('Error Running Test: %s', filename)
    console.error(err.stack)
  }
}

function run(files) {
  for (var i = 0; i < (files || []).length; i++)
    requireFile(files[i])
}
