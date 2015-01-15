var express = require('express')

var app = express()
app.use(connectLivereload({ port: RELOAD_PORT }))
app.use(express.static(path.join(CLIENT_TEST_DIR)))

app.listen(SERVER_PORT, function () {
//    console.log('opening')
//    open('http://localhost:' + SERVER_PORT, 'chrome')
})
