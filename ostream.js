	/*
	* output game stream meeds wss
	*/
module.exports.createServer = function(wsserver){

	var net = require('net');

	var oserver = net.createServer(function (socket) {
		socket.on('data', function(data) {
			wsserver.broadcast(data)
		});
	});

	return oserver

}