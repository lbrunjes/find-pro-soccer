 #!/usr/bin/env nodejs
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
	https_priv_key:"../pki/",
	https_cert:"../pki/"
}

if(process.argv.length > 2){
	if(fs.existsSync(process.argv[2])){
		console.log("laoding config from:", process.argv[2])
		var json = JSON.parse(fs.readFileSync(process.argv[2]));
		var keys= Object.keys(json);
		for(var key in settings){
			if(keys.indexOf(key)>=0){
				settings[key]= json[key];
			}
		}
		console.log("done");
	}
	else{
		console.log("cannot load, using defaults")
	}

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
	server = https.createServer(options, api.rest);
}

server.on('clientError', (err, socket) => {
  socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
});
server.listen(settings.port);

console.log("api up on port", settings.port);