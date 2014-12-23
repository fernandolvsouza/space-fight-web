var players = [];
/*
* Streaming game to player 
*/

var WebSocketServer = require("ws").Server
var http = require("http")
var express = require("express")
var app = express()
var port = 5000

app.use(express.static(__dirname + "/"))

var server = http.createServer(app)
server.listen(port)
var wss = new WebSocketServer({server: server})
console.log("Streaming game to player => websocket port %d", port)

wss.on("connection", function(ws) {
	players.push(ws);
 	console.log("player in");
 	//console.log("players size"+players.length);
	ws.on("close", function(ws) {
		var index = players.indexOf(ws);
		//console.log("index"+index);
		players = players.slice(index,1);
		console.log("player out");
	});
	ws.on("error", function(error) {
		console.log(error);
	});
});


/*
* Listening to game stream
*/

var net = require('net');
var server = net.createServer(function (socket) {
	socket.on('data', function(data) {
		console.log(data.toString());
		for (var i=0; i < players.length; i++) {
			console.log(players[i].readyState)
			if(players[i].readyState == 1){
				players[i].send(data.toString());
			}
		}
	});
});
var udp_port = 1337;
server.listen(udp_port, '127.0.0.1');
console.log("Listening to game stream => udp port %d,",udp_port);