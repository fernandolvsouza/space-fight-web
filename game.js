var oneDay = 300;//86400000;
var compression = require('compression')
var serveStatic = require('serve-static')
var express = require("express")

var app = express()
app.use(compression())

app.use(serveStatic(__dirname + "/static/",{ maxAge: '1d' }))
app.use(serveStatic(__dirname + "/",{ maxAge: '1d' }))
app.use(serveStatic(__dirname + "/node_modules/bootstrap/dist/",{ maxAge: '1d' }))
app.use(serveStatic(__dirname + "/node_modules",{ maxAge: '1d' }))

var router = require("./router.js");
router.start(app);