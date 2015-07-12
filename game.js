
var express = require("express")
var app = express()
app.use(express.static(__dirname + "/static/"))
app.use(express.static(__dirname + "/node_modules/bootstrap/dist/"))

var router = require("./router.js");
router.start(app);