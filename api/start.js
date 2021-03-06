/*
Startup for soccer api
Lee Brunjes 2017

Loads stuff and does fancy things at startup.


*/
const http = require('http');
const https = require('https');
const fs = require('fs');

global.settings={
	port:9000,
	use_https:false,
	https_priv_key:"../pki/privkey.pem",
	https_cert:"../pki/fullchain.pem",
	sql:{
		"user":"soccer",
		"password":"password",
		"host":"127.0.0.1",
		"port":5432,
		"database":"soccerapi"
	}
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

global.api = require("./api.js");
global.db = require("./db.js");

//get base data
db.reloadFromSql();
setInterval(db.reloadFromSql, 1000*60*30);


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