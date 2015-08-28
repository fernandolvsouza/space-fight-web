/*
* Streaming game to client  needs iserver
*/
var lz = require('lz-string');

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
				iserver.broadcast({event:"REMOVE_PLAYER",payload:{user:this.player}})
			}
			console.log("client out :: number of clients = " + clients.length);	
	
		});

		ws.on("message", function(message) {
			console.log("message from client: " + message);
			var json = JSON.parse(message);
			if(json.event == 'BE_BORN'){
				console.log("this.player : " + this.player);
				this.player.name = json.payload.user.name;
				//console.log(this.player);
			}
			if(!json['payload']){
				json['payload'] = {};
			}
			json['payload']['user'] = this.player;

			iserver.broadcast(json);

		});

		ws.on("error", function(error) {
			console.log(error);
		});

		ws.id = seq_socket ++;
		clients[ws.id] = ws;
		
		ws.player = {"id":ws.id};
		iserver.broadcast({event:"NEW_PLAYER",payload:{user:ws.player}})

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
 