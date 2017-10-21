/*
REst api for Soccer Zips.




*/
const fs = require('fs');

var rest_api = function(){
	api = this;

	this.zips = JSON.parse(fs.readFileSync("./zips.json"));
	this.teams = JSON.parse(fs.readFileSync("./teams.json"));
	this.leagues = JSON.parse(fs.readFileSync("./leagues.json"));
	
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

					case "team":
					var key = api_requested.length>1?api_requested[2] : "xxx";
					if(api.teams[key]){
						response.writeHead(200,headers);
						response.end(JSON.stringify(api.teams[key]));
					}
					else{
						response.writeHead(404,headers);
						response.end(JSON.stringify({"teams not found": "Invalid post code, expected /team/DCU"}));
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

		//get manhattan distance less accurate in canada but not a huge issue really
		this.getDist = function(x,y, coords){
			var _x = Math.abs(x - coords[0]);
			var _y = Math.abs(y - coords[1]);
			//console.log(_x, _y,x, y, coords)
			return _x +_y;
		}

}




module.exports = new rest_api();