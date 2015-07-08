var players = [];
var servers = [];
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
console.log("websocket => port %d", port)

wss.on("connection", function(ws) {
	players.push(ws);
 	console.log("player in");

	ws.on("close", function(ws) {
		var index = players.indexOf(ws);
		players = players.slice(index,1);
		console.log("player out");
	});

	ws.on("message", function(message) {
		for (var i=0; i < servers.length; i++) {
			try{
				console.log("message : " + message)
				servers[i].write(message);
			}catch(e){
				var index = servers.indexOf(socket);
				servers = servers.slice(index,1);
				console.log("server disconnected may error");
			}
		}
	});

	ws.on("error", function(error) {
		console.log(error);
	});
});


/*
* output game stream 
*/

var net = require('net');
var oserver = net.createServer(function (socket) {
	socket.on('data', function(data) {
		//console.log(data.toString());
		for (var i=0; i < players.length; i++) {
			if(players[i].readyState == 1){
				players[i].send(data.toString());
			}
		}
	});
});
var oport = 1337;
oserver.listen(oport, '127.0.0.1');
console.log("outputstream => port %d,",oport);

/*
* input game stream 
*/

var iserver = net.createServer(function (socket) {
	socket.on('end',function(){
		var index = servers.indexOf(socket);
		servers = servers.slice(index,1);
		console.log("server disconnected");
	});
	socket.on("error", function(error) {
		console.log("server disconnected error");
	});
	servers.push(socket);
	console.log("server connected");
});
var iport = 1234;
iserver.listen(iport, '127.0.0.1');
console.log("inputstream => port %d,",iport);