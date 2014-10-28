var gulp = require('gulp')
var source = require('vinyl-source-stream')
var streamify = require('gulp-streamify')
var browserify = require('browserify')
var concat = require('gulp-concat')
//var uglify = require('gulp-uglify')
var path = require('path')
var open = require('open')
var lessMiddleware = require('less-middleware')

var express = require('express')
var connectLivereload = require('connect-livereload')

var SERVER_PORT = 8000
var RELOAD_PORT = 9898

var through2 = require('through2')

var LIB_DIR = path.join(__dirname, 'lib')
var TEST_DIR = path.join(__dirname, 'test')
var CLIENT_TEST_DIR = path.join(__dirname, 'static')
var TEST_ENTRY = path.join(CLIENT_TEST_DIR, 'runner.js')
var TEST_OUTPUT = 'bundle.js'


function buildTestsWithMaps() {
  var bundleStream = browserify(TEST_ENTRY, { debug: true })
    .bundle()

  var streamConcat = streamify(concat(TEST_OUTPUT))
  var dest = gulp.dest(CLIENT_TEST_DIR)

  console.log('building tests with source maps...')
  return bundleStream
    .pipe(source(TEST_ENTRY))
    .pipe(streamConcat)
    .pipe(dest)
}

var tinyLr
function buildOnWatch() {
  buildTestsWithMaps()
    .pipe(through2.obj())
    .on('finish', function () {
      tinyLr.changed({
        body: {
          files: [TEST_ENTRY]
        }
      })
    })
}

function watch() {
  var app = express()
  app.use(connectLivereload({ port: RELOAD_PORT }))
  app.use(lessMiddleware(path.join(CLIENT_TEST_DIR)))
  app.use(express.static(path.join(CLIENT_TEST_DIR)))

  app.listen(SERVER_PORT, function () {
    open('http:localhost:' + SERVER_PORT, 'chrome')
  })
  tinyLr = require('tiny-lr')()
  tinyLr.listen(RELOAD_PORT)

  gulp.watch(path.join(LIB_DIR, '/**/*.js'), buildOnWatch)
  gulp.watch(path.join(CLIENT_TEST_DIR, '/**/*.less'), buildOnWatch)
  gulp.watch(path.join(CLIENT_TEST_DIR, '/**/*.html'), buildOnWatch)
  gulp.watch(path.join(TEST_DIR, '/**/*.js'), buildOnWatch)
  gulp.watch(TEST_ENTRY, buildOnWatch)
}

gulp.task('tests', function () {
  buildTestsWithMaps()
    .pipe(through2.obj())
    .once('finish', watch)
})
