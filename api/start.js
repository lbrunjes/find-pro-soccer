/*
Startup for soccer api

*/
const http = require('http');
const https = require('https');
const fs = require('fs');


const api = require("./api.js");


global.settings={
	port:9000,
	use_https:false,
	https_priv_key:"",
	https_cert:""
}


//setup server using http or https
if(!settings.use_https){
	server = http.createServer(api.rest);
}
else{
	options = {
	  key: fs.readFileSync(settings.https_priv_key),
	  cert: fs.readFileSync(settings.https_cert)
	};
	https.createServer(options, api.rest);
}

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(settings.port);

console.log("api up on port", settings.port);