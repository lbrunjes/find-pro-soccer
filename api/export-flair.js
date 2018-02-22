/*
Change team codes from mine to R-MLS's




*/

const pg= require('pg');
const fs = require('fs');
const { spawn } = require('child_process');

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

global.teams={};

var do_the_flair_thing =function(){
	console.log(teams)
	//read in data
	var path = "../web/images";
	var out_path = "/tmp/flairs";

	process_directory(path, out_path);
	return;
	
};

var process_directory= function(dir_path, out_path){
	var results = fs.readdirSync(dir_path);

	if(!fs.existsSync(out_path)){
		fs.mkdirSync(out_path);
	}
	for(var file in results){
		console.log(results[file]);
		var path = dir_path+"/"+results[file];
		var stat = fs.statSync(path);
		if(stat.isDirectory(path)){
			process_directory(path, out_path+"/"+results[file]);
		}
		else if(stat.isFile(path)){
			var filename_no_ext= results[file].substring(0,results[file].lastIndexOf('.'));
			console.log(filename_no_ext)
			var ext = results[file].substring(results[file].lastIndexOf('.'));
			console.log(teams[filename_no_ext]);
			if(teams[filename_no_ext]){
				spawn('cp', [path, out_path+"/"+teams[filename_no_ext]+ext]);
			}

		}
	}
	return;
}


var pg_client = new pg.Client(settings.sql);
pg_client.connect();

var query=`SELECT name, short_id FROM soccerapi.team`;

pg_client.query(query, (err, res) => {
	console.log("xxxx");
	if(err){
		console.error("issues loaing team data", err);
		return;
	}
	for(var i = 0; i<res.rows.length; i++){
	 teams[res.rows[i].short_id] = res.rows[i].name;
	}
	do_the_flair_thing();
});

console.log("expoting flair to /tmp");
