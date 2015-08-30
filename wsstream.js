/*
* Streaming game to client  needs iserver
*/
var lz = require('lz-string');
var EVENTS = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'FIRE', 'MOUSE_MOVE', 'NEW_PLAYER', 'REMOVE_PLAYER', 'BE_BORN', 'DIE'];

module.exports.createServer = function(server,iserver) {
	var seq_socket = 0;
	var WebSocketServer = require("ws").Server
	var wss = new WebSocketServer({server: server,perMessageDeflate:false})

	var clients = {};
	wss.on("connection", function(ws) {

		ws.on("close", function(ws) {
			console.log("ws.id = " + this.id)
			
			delete clients[ws.id];

			if(this.player){
				iserver.broadcast([this.player.id,EVENTS.indexOf("REMOVE_PLAYER")])
			}
			console.log("client out :: number of clients = " + clients.length);	
	
		});

		ws.on("message", function(message) {
			message = lz.decompressFromUint8Array(message);
			console.log("message from client: " + message);

			var array = JSON.parse(message);
			if(array[0] == EVENTS.indexOf('BE_BORN')){
				console.log("this.player : " + this.player);
				this.player.name = array[1];
			}

			array.unshift(this.player.id); // sempre coloca o id na frente
			iserver.broadcast(array);

		});

		ws.on("error", function(error) {
			console.log(error);
		});

		ws.id = seq_socket ++;
		clients[ws.id] = ws;
		
		ws.player = {"id":ws.id};
		iserver.broadcast([ws.player.id,EVENTS.indexOf("NEW_PLAYER")]);

	 	console.log("client in");
	});


	wss.sendDataToClient  = function(data){
		var array = JSON.parse(data.toString());
		//player id
		var id = Number(array[3])
		if(clients[id]){
			if(clients[id].readyState == 1){
				//clients[id].player.name
				clients[id].send(lz.compressToUint8Array(data),{ binary: true});
			}
		}
	}

	wss.broadcast  = function(data){
		
		var json = JSON.parse(data.toString())

		for (var id in clients) {
			if(clients[id].readyState == 1){
				var msgToPlayer = json
				if(clients[id].player){
					msgToPlayer.player = clients[id].player 
				}
				clients[id].send(JSON.stringify(msgToPlayer));
			}
		}
	}

	return wss
}
 