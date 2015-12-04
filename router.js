
module.exports.start = function(app) {
  
	var server = require("http").createServer(app)
	
	var iserver = new require("./istream.js").createServer()

	var wsserver = new require("./wsstream.js").createServer(server,iserver)

	var oserver = new require("./ostream.js").createServer(wsserver)

	var port = 80
	console.log("websocket => port %d", port)
	server.listen(port)

	var oport = 1337;
	oserver.listen(oport, '127.0.0.1');
	console.log("outputstream => port %d,",oport);

	var iport = 1234;
	iserver.listen(iport, '127.0.0.1');
	console.log("inputstream => port %d,",iport);

};