	/*
	* output game stream meeds wss
	*/
module.exports.createServer = function(wsserver){

	var net = require('net');

	var oserver = net.createServer(function (socket) {

		socket.on('data', function(data) {
			
			data = data.toString()
			for(var i in data){
				if(data[i] == '\n'){
					wsserver.broadcast(this.buffer)					
					this.buffer = ""
				}else{
					if(!this.buffer){
						this.buffer = ""
					}

					this.buffer += data[i]
				}
			}
		});
	});

	return oserver

}