/*
Database lookup api for Soccer Zips.
Lee BRunjes 2017 lee.brunjes@gmail.com

All database stuff goes through here right now. 

*/
const pg= require('pg');
var parser = require('rss-parser');

var db_api = function(){
	db = this;

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
		stadium.longitude,

		(select upcoming_games.game_id from soccerapi.upcoming_games where home_id = team.id ORDER BY start LIMIT 1) as next_home
		,
		(select upcoming_games.game_id from soccerapi.upcoming_games where away_id = team.id ORDER BY start LIMIT 1) as next_away


		from soccerapi.team as team
		inner join soccerapi.league as league on league.id = team.league_id
		inner join soccerapi.stadium as stadium on stadium.id = team.home_stadium_id
		where 
		team.active = true

		order by league, team.name`;
		
			db.pg_client.query(query, (err, res) => {
				if(err){
					console.log("sql error, loading team data",err);
				}
				console.log("found", res.rows.length, " teams to load")
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

					api.teams[result.id].next = {"home":false, "away":false};
					
					if(result.next_home && api.games[result.next_home]){
						api.teams[result.id].next.home = api.games[result.next_home];
						console.log("foudn game")
					}
					if(result.next_away && api.games[result.next_away]){
						api.teams[result.id].next.away = api.games[result.next_away]
					}
					

				}
			});
		
	}

	this.loadSocialDataFromSQL =function(){
		console.log("loading social data from sql")
		
		var query= `select 
		team.short_id as id,
		account.account,
		lookup.name as type

		from soccerapi.team_social_media as tsm
		inner join soccerapi.team as team on team.id = tsm.team_id
		inner join soccerapi.social_media_account as account on account.id = tsm.social_media_account_id
		inner join soccerapi.social_media_lookup as lookup on lookup.id = media_type
		where account != ''
		and team.active = true
		order by id, type`;
		var query2= `select 
		league.short_id as id,
		account.account as account,
		lookup.name as type

		from soccerapi.league_social_media as lsm
		inner join soccerapi.league as league on league.id = lsm.league_id
		inner join soccerapi.social_media_account as account on account.id = lsm.social_media_account_id
		inner join soccerapi.social_media_lookup as lookup on lookup.id = media_type
		where account != '' 
		and league.active = true
		
		order by id, type`;

		


			db.pg_client.query(query, (err, res) => {
				if(err){
					console.log("sql error, loading team social data",err);
				}
				for(var i = 0; i<res.rows.length; i++){
					var result = res.rows[i];
					if(api.teams[result.id]){
						if(!api.teams[result.id].social){
							api.teams[result.id].social = {}
						}
						api.teams[result.id].social[result.type] = result.account;
					}
				}
				

			});
	
			
			

			db.pg_client.query(query2, (err, res) => {
				if(err){
					console.log("sql error, loading league social data",err);
				}
				for(var i = 0; i<res.rows.length; i++){
					var result = res.rows[i];
					if(api.leagues[result.id]){
						if(!api.leagues[result.id].social){
							api.leagues[result.id].social = {}
						}
						api.leagues[result.id].social[result.type] = result.account;
					}
				}
			});
		
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

		from soccerapi.team as team 
		inner join soccerapi.league as league on league.id = team.league_id 
		where team.active = true and 
		league.active =true

		group by league.name,league.website,league.short_id , league.gender, league.is_professional, league.pyramid_level, league.crest_url
		order by league.short_id`;

		
			db.pg_client.query(query, (err, res) => {
				
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
					api.leagues[result.league].name = result.name;
					

				}


			});
		
	};
	this.loadStadiumsFromSQL = function(){
		var query= `select 
		id, name, address1, address2, latitude, longitude 
		 from soccerapi.stadium order by name, address2`;
		db.pg_client.query(query, (err, res) => {
				
			if(err){
				console.log("sql error, loading stadium data",err);
			}
			api.stadiums = res.rows;
			
		});
	};

	this.loadUpcomingGamesFromSQL = function(){
console.log("loading game data from sql")
		
		var query= `select 
home.short_id as home_id,
home.name as home_name,
home.league_id as home_league,

away.short_id as away_id,
away.name as away_name,
away.league_id as away_league,

stadium.id as stadium_id,
stadium.name as stadium_name,
stadium.address1 as stadium_address1,
stadium.address2 as stadium_address2,
stadium.latitude as stadium_latitude,
stadium.longitude as stadium_longitude,

game.start as game_start,
game.notes as game_notes,
game.id as game_id


from soccerapi.game
inner join soccerapi.team as home on game.home_team = home.id
inner join soccerapi.team as away on game.away_team = away.id
inner join soccerapi.stadium as stadium on game.stadium = stadium.id

where start > now()
order by game.start, home_id
		`;

		
			db.pg_client.query(query, (err, res) => {
				
				if(err){
					console.log("sql error, loading game data",err);
				}
				api.game_list = [];
				for(var i = 0; i<res.rows.length; i++){
					var result = res.rows[i];
					
					
					var game = {
						home:{
							id:result.home_id, 
							name:result.home_name,
							league_id:result.home_league
						},
						away:{
							id:result.away_id,
							name:result.away_name,
							league_id:result.away_league
						},
						stadium:{
							name:result.stadium_name,
							address:[result.stadium_address1, result.stadium_address2],
							coords:[result.stadium_latitude, result.stadium_longitude]
						},
						start:result.game_start,
						notes:result.game_notes,
						id:result.game_id
					};
					if(!api.games[result.home_id]){
					
						api.games[result.home_id]=[];
					}
					if(!api.games[result.away_id]){
					
						api.games[result.away_id]=[];
					}
					api.games[result.home_id].push(game);
					api.games[result.away_id].push(game);


					api.game_list.push({
						id:result.game_id,
						home:result.home_id,
						away:result.away_id,
						start:result.game_start,
						notes:result.game_notes,
						stadium: result.stadium_name,
						stadium_id: result.stadium_id,
						
					})
				}
			});

	};

	this.reloadFromSql=function(){
		console.log(new Date(), "reloading");
		db.loadUpcomingGamesFromSQL();
		db.loadLeagueDataFromSQL();
		db.loadTeamDataFromSQL();
		db.loadSocialDataFromSQL();
		db.getActiveRssFeeds();
		//db.loadNewsCache();
		db.loadStadiumsFromSQL();
	}

	

	this.addTeamSocialMedia=function(teamCode, account, type){
		console.log("assigning social media to team", teamCode ,account, type)
		
		var query= `select 
		add_team_social_media($1, $2, $3)`;

		
			db.pg_client.query(query,[type, account, teamCode] ,(err, res) => {
				
				if(err){
					console.log("sql error, adding socail media",err);
				}
				
				console.log("add sm result:", res.rows[0]);

			});
	};

	this.addGame=function(homeTeamCode, awayTeamCode, start, stadiumName ){
		console.log("not yet");
	}
	
	this.addToMediaCache=function(teamCode, account, type){
		console.log("not yet");
	}
	this.loadNewsCache=function(){
var query= `select 
team.short_id,
title, 
body, 
link , 
service_item_identifier as id, 
response_time

from soccerapi.social_media_cache as smc

inner join soccerapi.team_social_media as tsm on tsm.social_media_account_id = smc.account_id
inner join soccerapi.team as team on tsm.team_id = team.id


order by  team.short_id, response_time desc`
		db.pg_client.query(query,(err, res) => {
	
			if(err){
				console.log("sql error, getting news cache",err);
			}
			api.news_cache = {};
			for(var i = 0; i < res.rows.length; i++){
					var item ={
						title: res.rows[i].title,
						body:res.rows[i].body,
						link:res.rows[i].link,
						id:res.rows[i].id,
						response_time:res.rows[i].response_time,
						team:res.rows[i].short_id
					};

					if(!api.news_cache[res.rows[i].short_id]){
						api.news_cache[res.rows[i].short_id]=[];
					}
					
					
					api.news_cache[res.rows[i].short_id].push(item);
					
			}

		});

	}

	this.getActiveRssFeeds =function(){
		console.log("getting rss feeds")
		
		var query= `select sma.account, sma.id
		from soccerapi.social_media_account  as sma
		inner join soccerapi.social_media_lookup as sml on sml.id = sma.media_type
		where 
		sml.name = 'rss' and 
		sma.active=true	and 
		(
			sma.last_poll is null or 
			sma.last_poll < (select current_timestamp - (sml.poll_frequency * interval '1 minute'))
		)
		`;

		
			db.pg_client.query(query,(err, res) => {
				
				if(err){
					console.log("sql error, getting rss feeds",err);
				}
				else{

					var feeds = [];
					for(var i = 0; i < res.rows.length; i++){
						var url = res.rows[i];
						//TODO figure out hwo we are tracking that.
						feeds.push(url);
					}
					console.log("found ", feeds.length, "feeds to update");
					db.scanFeeds(feeds);
				}

			});
	};

	this.updateSMAPollDate=function(id){
var query = `update soccerapi.social_media_account
set last_poll = now() where id= $1`;


		db.pg_client.query(query,[id],(err, res) => {
			if(err){
				console.log("sql error,updating poll date",err);
			}
		});
	};


	this.updateSMCache =function(account_id, raw, title, id, body, link){
		
		var query = `insert into soccerapi.social_media_cache
(account_id, raw_data,title,service_item_identifier, body, link) 
values ($1,$2, $3, $4, $5 , $6)`

		db.pg_client.query(query, [account_id, raw, title, id, body, link], (err, res) => {
				
				if(err){
					
				}
				else{
					var feeds = [];
					for(var i = 0; i < res.rows.length; i++){
						var url = res.rows[i];
						//TODO figure out hwo we are tracking that.
						feeds.push(url);
					}
					
					db.scanFeeds(feeds);
				}

			});

	};

	this.scanFeeds = function(feeds){
		
		// for(var i in  feeds){
		// 	(function(feed){
				
		// 		parser.parseURL(feed.account, function(err, parsed){
		// 			console.log(feed, parsed);
		// 			db.updateSMAPollDate(feed.id);
		// 		if(err){
		// 			console.log(feed.account, err)
		// 		}
		// 		else{

				
		// 			if(parsed &&parsed.feed && parsed.feed.entries){
		// 				for(var i =0; i < parsed.feed.entries.length ;i++){
		// 					var entry = parsed.feed.entries[i];
		// 					db.updateSMCache(feed.id, JSON.stringify(entry),entry.title, entry.guid||entry.link, entry.contentSnippet, entry.link);
		// 				}
		// 			}
		// 		}
		// 	}) ;
		// })(feeds[i]);;
		// }
	}



};

	module.exports = new db_api();