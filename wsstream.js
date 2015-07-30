/*
* Streaming game to client  needs iserver
*/


module.exports.createServer = function(server,iserver) {
	var seq = 0;
	var seq_socket = 0;

	var WebSocketServer = require("ws").Server
	var wss = new WebSocketServer({server: server})

	var clients = [];
	wss.on("connection", function(ws) {

		ws.on("close", function(ws) {
			console.log("ws.id = " + this.id)
			for(var index in clients){
				if(clients[index].id ==  this.id){
					clients.splice(index,1);
					if(this.player){
						iserver.broadcast({event:"REMOVE_PLAYER",payload:{user:this.player}})
					}
					console.log("client out :: number of clients = " + clients.length);	
				}
			}
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

			iserver.broadcast(json)

		});

		ws.on("error", function(error) {
			console.log(error);
		});

		ws.id = seq_socket ++
		clients.push(ws);
	 	console.log("client in");
	});

	wss.broadcast  = function(data){
		//console.log(data.toString())
		//console.log("separator")

		var json = JSON.parse(data.toString())

		for (var i=0; i < clients.length; i++) {
			if(clients[i].readyState == 1){
				var msgToPlayer = json
				if(clients[i].player){
					msgToPlayer.player = clients[i].player 
				}
				clients[i].send(JSON.stringify(msgToPlayer));
			}
		}
	}

	return wss
}
 