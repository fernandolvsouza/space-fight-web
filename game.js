
var express = require("express")
var app = express()
app.use(express.static(__dirname + "/static/"))
app.use(express.static(__dirname + "/"))
app.use(express.static(__dirname + "/node_modules/bootstrap/dist/"))
app.use(express.static(__dirname + "/node_modules"))

var router = require("./router.js");
router.start(app);