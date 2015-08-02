/*
* Streaming game to client  needs iserver
*/


module.exports.createServer = function(server,iserver) {
	var seq_socket = 0;
	var WebSocketServer = require("ws").Server
	var wss = new WebSocketServer({server: server})

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
			console.log("message from client: " + message)
			var json = JSON.parse(message);
			if(json.event == 'NEW_PLAYER'){
				this.player = {"id":this.id,"name":json.payload.user.name}
				console.log(this.player);
			}
			if(!json['payload']){
				json['payload'] = {}
			}
			json['payload']['user'] = this.player

			iserver.broadcast(json)

		});

		ws.on("error", function(error) {
			console.log(error);
		});

		ws.id = seq_socket ++;
		clients[ws.id] = ws;
	 	console.log("client in");
	});


	wss.sendDataToClient  = function(data){
		var json = JSON.parse(data.toString())
		json.scene.player = json.player
		
		var id = Number(json.player.id)
		console.log(json)
		//console.log(clients)
		if(clients[id]){
			if(clients[id].readyState == 1){
				clients[id].send(JSON.stringify(json.scene));
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
 