/*
REst api for Soccer Zips.
Lee Brunjes 2017 lee.brunjes@gmail.com
this is where we used cahced sql data to display data to users.


*/
const fs = require('fs');



var rest_api = function(){
	api = this;

	this.zips = JSON.parse(fs.readFileSync("./data/zips.json"));
	this.teams = {};
	this.leagues = {};
	this.games= {}; //used to lookup teams
	this.games_list= {}; //raw game data
	this.stadiums={};
	this.news_cache={};
	
	

	this.rest = function(request, response){
		try{
			console.log(request.url);
			var headers = {
				"Access-Control-Request-Headers":"",
				"Access-Control-Allow-Origin":"*",
				"Content-Type": "application/json; charset=utf-8",

			}

			var api_requested = request.url.split('/');

			var querystring = {};
			if(request.url.indexOf("?")>0){
				var qs= request.url.substring(request.url.indexOf("?")).split("&");
				for(var i = 0 ; i <qs.length;i++){
					var item = qs[i].split("=");
					querystring[item[0]]= item.length>1?item[1]:'';
				}
			}

			switch(api_requested[1]){
					//get a single zip code as lat long
					case "zip": //zip/T1G
					var key = api_requested.length>1?api_requested[2] : "xxx";
					if(api.zips[key]){
						response.writeHead(200,headers);

						var leagues = querystring["leagues"]?querystring["leagues"]: false;
						var zip = api.zips[key];
						var teams = api.lookupTeamsByLatLong(zip[0], zip[1], leagues);



						response.end(JSON.stringify({"teams":teams, "input":zip}));
					}
					else{
						response.writeHead(404,headers);
						response.end(JSON.stringify({"zip not found": "Invalid post code, expected /zip/23223 OR /zip/T1G "}));
					}
					break;
					case "coords": //coords/lat/lng

						var teams = api.lookupTeamsByLatLong(api_requested[2],api_requested[3], leagues);


						response.writeHead(200,headers);
						response.end(JSON.stringify({"teams":teams, "input":[api_requested[2],api_requested[3]]}));

					break;
					case "near": //coords/lat/lng/dist
					
						var teams = api.lookupTeamsByRadius(api_requested[2],api_requested[3], api_requested[4]?api_requested[4]:100);

console.log(api_requested);
						response.writeHead(200,headers);
						response.end(JSON.stringify({"teams":teams, "input":[api_requested[2],api_requested[3], api_requested[4]]}));

					break;

					case "team":
					var key = api_requested.length>1?api_requested[2] : "xxx";
					if(api.teams[key]){
						response.writeHead(200,headers);
						response.end(JSON.stringify({
							"team":api.teams[key], 
							"games":(api.games[key]?api.games[key]:[]),
							"news":(api.news_cache[key]?api.news_cache[key]:[])
						}));
					}
					else{
						response.writeHead(404,headers);
						response.end(JSON.stringify({"teams not found": "Invalid post code, expected /team/DCU"}));
					}
					break;

					
					case "league":
					var key = api_requested.length>1?api_requested[2] : "xxx";
					if(api.leagues[key]){
						var data= {teams:{}, league:api.leagues[key]};
						console.log(api.leagues[key])
						for(var i =0; i <  api.leagues[key].teams.length;i++){
							var team = api.leagues[key].teams[i];
							data.teams[team] = api.teams[team];
							
							
						}

						response.writeHead(200,headers);
						response.end(JSON.stringify(data));
					}
					else{
						response.writeHead(404,headers);
						response.end(JSON.stringify({"teams not found": "Invalid post code, expected /team/DCU"}));
					}
					break;

					//TODO might not be great to publically expose
					case "admin-dump":
					if(request.connection.remoteAddress == '127.0.0.1' || request.connection.remoteAddress == '::ffff:127.0.0.1' ){

						response.writeHead(200,headers);
						response.end(JSON.stringify({"teams":api.teams,
							leagues:api.leagues,
							stadiums:api.stadiums,
							games:api.games,
							game_list: api.game_list

						}));
					}else{
						response.writeHead(400,headers);
						response.end(JSON.stringify({"not local": "User is not at a local address: "+request.connection.remoteAddress}));
					}
					
					break;



					
					default:
					response.writeHead(400,headers);
					response.end(JSON.stringify({"404":"invalid api endpoint"}));
					break;
				}
				


			}
			catch(ex){
				console.log("Error Processing http request",ex);
				response.writeHead(500,headers);
				
				response.end(JSON.stringify({"error":ex.message}));
			}

		}
		this.lookupTeamsByRadius = (lat, long, dist)=>{
			var teams = [];
			for(var i in  api.teams){
				var x = api.getDistHav(lat,long, api.teams[i].coords)
				console.log(api.teams[i].name, x)
				if(x < dist){

					teams.push(api.teams[i]);
				}
			}
			return teams;

		};

		this.lookupTeamsByLatLong = (lat, long, league)=>{

			var allowed_leagues = api.leagues
			if(league){
				allowed_leagues =league ;
			}

			var nearest = {};

			for(var lg in allowed_leagues){
				nearest[lg]={"team":"xx", "dist":9999};

				for (var i =0; i < allowed_leagues[lg].teams.length;i++){

					if(api.teams[allowed_leagues[lg].teams[i]]){

						var dist= api.getDist(lat,long, api.teams[allowed_leagues[lg].teams[i]].coords);
							//console.log(dist ,leagues[lg].teams[i], teams[leagues[lg].teams[i]].coords);
						if(dist < nearest[lg].dist){
							nearest[lg].dist = dist;
							nearest[lg].team = api.teams[allowed_leagues[lg].teams[i]];
						}
					}
					else{
						console.log("Bad team", allowed_leagues[lg].teams[i] );
					}
				}
			}


		return(nearest);
		}

		//get distance less accurate in canada but not a huge issue really
		this.getDist = function(_x,_y, target){
			return Math.sqrt(Math.pow(_x - target[0],2)+ Math.pow(_y - target[1],2))
		}
		this.getDistHav = function(_x,_y, target){
			
			var radius_earth = 3959; //miles (AMERAICA)
			var pi_180 = 0.017453292519943295;
			var x = (_x - target[0]) * pi_180;
			var y = (_y - target[1]) * pi_180;
			var tmp = Math.sin(x/2)* Math.sin(x/2) + 
			Math.cos(_x * pi_180)* Math.cos(_y * pi_180)*
			Math.sin(y/2) *Math.sin(y/2);

			return  Math.round(radius_earth * 2 * Math.atan2(Math.sqrt(tmp), Math.sqrt(1-tmp)));

		
		}

		
}




module.exports = new rest_api();