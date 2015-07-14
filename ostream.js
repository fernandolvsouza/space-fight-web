	/*
	* output game stream meeds wss
	*/
module.exports.createServer = function(wsserver){

	var net = require('net');

	var oserver = net.createServer(function (socket) {
		socket.on('data', function(data) {
			var msgs = data.toString().split('\n') // more than one json object together
			for(var i in msgs){
				if(msgs[i].length > 0){
					wsserver.broadcast(msgs[i])
				}
			}
		});
	});

	return oserver

}