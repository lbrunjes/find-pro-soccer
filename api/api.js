/*
REst api for Soccer Zips.




*/
const fs = require('fs');
const pg= require('pg');


var rest_api = function(){
	api = this;

	this.zips = JSON.parse(fs.readFileSync("./data/zips.json"));
	this.teams = {};//JSON.parse(fs.readFileSync("./data/teams.json"));
	this.leagues = {};//JSON.parse(fs.readFileSync("./data/leagues.json"));
	this.all_games= [];
	this.next_home_game = {};
	this.pg_client = new pg.Client(settings.sql);
	
	this.pg_client.on("connect",(err)=>{
		console.log("connect", err)
	});
	this.pg_client.on("error",(err)=>{
		console.log("error", err)
	});
	this.pg_client.on("end",(err)=>{
		console.log("end", err)
	});
	this.pg_client.connect();


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

					
					case "league":
					var key = api_requested.length>1?api_requested[2] : "xxx";
					if(api.leagues[key]){
						var data= {teams:{}, league:""};
						console.log(api.leagues[key])
						for(var i =0; i <  api.leagues[key].teams.length;i++){
							var team = api.leagues[key].teams[i];
							data.teams[team] = api.teams[team];
							data.league = api.teams[team].league;
						}

						response.writeHead(200,headers);
						response.end(JSON.stringify(data));
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

		// for the data base stuff we should only hit it occasioanly instead of per request. we dont need to be that up to date

		//this is async so it will eventually clobber the team data
		this.loadTeamDataFromSQL=function(){
			console.log("loading team data from sql")
		

			var query= `select 
team.name,
team.short_id as id,
team.website,
team.crest_url as crest,
team.color1,
team.color2,
team.color3,
league.short_id as league,
stadium.name as stadium,
stadium.address1,
stadium.address2,
stadium.latitude,
stadium.longitude

from soccerapi.soccerapi.team as team
inner join soccerapi.soccerapi.league as league on league.id = team.league_id
inner join soccerapi.soccerapi.stadium as stadium on stadium.id = team.home_stadium_id


order by league, team.name`;
			try{
			

				

				api.pg_client.query(query, (err, res) => {
					if(err){
						console.log("sql error, loading team data",err);
					}
					console.log("found", res.rows.length, "results")
					for(var i = 0; i<res.rows.length; i++){
						var result = res.rows[i];

						if(!api.teams[result.id]){
							console.log("adding team", result.id);
							api.teams[result.id]={};
						}

						
						api.teams[result.id].name = result.name;
						api.teams[result.id].stadium = result.stadium;
						api.teams[result.id].address =[result.address1, result.address2]
						api.teams[result.id].coords = [result.latitude,result.longitude];
						api.teams[result.id].crest = result.crest;
						api.teams[result.id].colors = [];
						for(var j = 1 ; j < 4;j++ ){
							if(result["color"+j]){
								api.teams[result.id].colors.push(result["color"+j]);
							}
						}
						api.teams[result.id].website = result.website;
						api.teams[result.id].league = result.league;
						api.teams[result.id].id = result.id;
					}
					

				});
			}
			catch(ex){
				console.log("ERROR loading league from SQL",ex.message);
				
			}
		}

		this.loadSocialDataFromSQL =function(){
		console.log("loading social data from sql")
			
			var query= `select 
team.short_id as id,
account.account,
lookup.name as type

from soccerapi.soccerapi.team_social_media as tsm
inner join soccerapi.soccerapi.team as team on team.id = tsm.team_id
inner join soccerapi.soccerapi.social_media_account as account on account.id = tsm.social_media_account_id
inner join soccerapi.soccerapi.social_media_lookup as lookup on lookup.id = media_type
where account != ''
order by id, type`;
var query2= `select 
league.short_id as id,
account.account as account,
lookup.name as type

from soccerapi.soccerapi.league_social_media as lsm
inner join soccerapi.soccerapi.league as league on league.id = lsm.league_id
inner join soccerapi.soccerapi.social_media_account as account on account.id = lsm.social_media_account_id
inner join soccerapi.soccerapi.social_media_lookup as lookup on lookup.id = media_type
where account != ''
order by id, type`;
			try{
				

				

				api.pg_client.query(query, (err, res) => {
					if(err){
						console.log("sql error, loading team social data",err);
					}
					for(var i = 0; i<res.rows.length; i++){
						var result = res.rows[i];
						
						if(!api.teams[result.id].social){
							api.teams[result.id].social = {}
						}
						api.teams[result.id].social[result.type] = result.account;
					}
					

				});
			}
			catch(ex){
				console.log("ERROR loading league from SQL",ex.message);
				
			}
			try{
				
				

				api.pg_client.query(query2, (err, res) => {
					if(err){
						console.log("sql error, loading league social data",err);
					}
					for(var i = 0; i<res.rows.length; i++){
						var result = res.rows[i];
						
						if(!api.leagues[result.id].social){
							api.leagues[result.id].social = {}
						}
						api.leagues[result.id].social[result.type] = result.account;
					}
				

				});
			}
			catch(ex){
				console.log("ERROR loading league from SQL",ex.message);
				
			}


		};
		

		//this is async so it will eventually clobber the league data
		this.loadLeagueDataFromSQL=function(){
			console.log("loading league data from sql")
			
			var query= `select 
				string_agg(team.short_id,',') as teams, 
				league.name, 
				league.website, 
				league.short_id as league,
				league.gender, 
				league.is_professional as pro, 
				league.pyramid_level,
				league.crest_url 

				from soccerapi.soccerapi.team as team 
				inner join soccerapi.soccerapi.league as league on league.id = team.league_id 

				group by league.id 
				order by league.short_id`;
			try{
				
				
				api.pg_client.query(query, (err, res) => {
					
					if(err){
						console.log("sql error, loading league data",err);
					}
					
					for(var i = 0; i<res.rows.length; i++){
						var result = res.rows[i];
						if(!api.leagues[result.league]){
							console.log("adding league", result.league);
							api.leagues[result.league]={};
						}
						
						api.leagues[result.league].pro = result.pro;
						api.leagues[result.league].website = result.website;
						api.leagues[result.league].teams =result.teams.split(',');
						api.leagues[result.league].pyramid = result.pyramid_level;
						api.leagues[result.league].gender = result.gender;
						api.leagues[result.league].crest = result.crest_url;

					}
				

				});
			}
			catch(ex){
				console.log("ERROR loading league from SQL",ex.message);
				
			}


		};

		this.reloadFromSql=function(){
			console.log(new Date(), "reloading")
			api.loadLeagueDataFromSQL();
			api.loadTeamDataFromSQL();
			api.loadSocialDataFromSQL();
		}

		this.reloadFromSql();
		setInterval(api.reloadFromSql, 1000*60*1);
}




module.exports = new rest_api();