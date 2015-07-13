/*
* input game stream need nothing
*/


module.exports.createServer = function(){
	var isockets =[]
	var seq_socket = 0
	
	var net = require('net');

	var server = net.createServer(function (socket) {

		socket.on('end',function(){
			console.log("socket.id = " + this.id)
			for(var index in isockets){
				if(isockets[index].id ==  this.id){
					isockets.splice(index,1);
					console.log("isockets out :: number of isockets = " + isockets.length);	
				}
			}
		});

		socket.on("error", function(error) {
			console.log("server disconnected error")
		});

		socket.sendJson = function(json){
			try{
				var toServer = JSON.stringify(json)+ "\n"
				console.log("message to server: " + toServer)
				this.write(toServer);
			}catch(e){
				console.log("server disconnected may error, removing isocket index = " + this.index);
				console.log(e);
				isockets.slice(this.index,1)
				
			}
		}
		isockets.id = seq_socket ++
		isockets.push(socket)
		console.log("server connected")
	});


	server.broadcast  = function (json){
			for (var i=0; i < isockets.length; i++) {
				isockets[i].sendJson(json)
			}
		}

	return server
}