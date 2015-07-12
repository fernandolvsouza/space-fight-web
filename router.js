
module.exports.start = function(app) {
  
	/*
	* Streaming game to client 
	*/

	var clients = [];
	var servers = [];
	var seq = 0;

	var http = require("http")
	var server = http.createServer(app)


	var WebSocketServer = require("ws").Server
	var wss = new WebSocketServer({server: server})

	wss.on("connection", function(ws) {
		clients.push(ws);
	 	console.log("client in");

		ws.on("close", function(ws) {
			var index = clients.indexOf(ws);
			clients = clients.slice(index,1);
			console.log("client out");
		});

		ws.on("message", function(message) {
			console.log("message from client: " + message)
			var json = JSON.parse(message);
			if(json.event == 'NEW_PLAYER'){
				this.player = {"id":seq++,"name":json.payload.user.name}
				console.log(this.player);
			}
			if(!json['payload']){
				json['payload'] = {}
			}
			json['payload']['user'] = this.player

			for (var i=0; i < servers.length; i++) {
				try{
					var toClient = JSON.stringify(json)+ "\n"
					console.log("message to client: " + toClient)
					servers[i].write(toClient);
				}catch(e){
					console.log("server disconnected may error");
					console.log(e);
					var index = servers.indexOf(socket);
					servers = servers.slice(index,1);
					
				}
			}
		});

		ws.on("error", function(error) {
			console.log(error);
		});
	});

	var port = 5000
	console.log("websocket => port %d", port)
	server.listen(port)


	/*
	* output game stream 
	*/

	var net = require('net');
	var oserver = net.createServer(function (socket) {
		socket.on('data', function(data) {
			//console.log(data.toString());
			for (var i=0; i < clients.length; i++) {
				if(clients[i].readyState == 1){
					clients[i].send(data.toString());
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

};