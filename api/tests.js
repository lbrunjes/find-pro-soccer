/*
tests
Lee Brunjes 2017 lee@brunjes.org

Verify the json data so we dont do silly things in production.

*/
const fs = require('fs');
var teams = JSON.parse(fs.readFileSync("./teams.json"));
var leagues = JSON.parse(fs.readFileSync("./leagues.json"));

var errors =0;
console.log("Testing team to league match up");
//test if there exist teams in leagues tht dont exist.
for(var i in leagues){
	var league = leagues[i];
	if(!league.website){
		console.log("  league has no website", team.id);
		errors++;
	}
	if(league.website.indexOf("http")<0){
		console.log("  league website has no http, thus links are borked", team.id);
		errors++;
	}
	if(!fs.existsSync("../web/images/"+i+"/"+i+".svg") ){
		console.log("  league Crest Missing", i);
		errors++;

	}

	for( var j = 0 ; j < league.teams.length; j++){
		if(!teams[league.teams[j]]){
			console.log("  TEAM IN LEAGUE DOES NOT EXIST:", i , league.teams[j]);
			errors++;
		}
		if(!teams[league.teams[j]].league === i ){
			console.log("  TEAM IN LEAGUE SAYS it is in another league:", i , league.teams[j]);
			errors++;
		}
	}
}

console.log("Found ", errors, " errors");



errors =0;
console.log("\nLooking at teams");
for(var i in teams){
	var team = teams[i];
	if(i != team.id) {
		console.log("  TEAM Index is not the same as team id:", team.id,i);
			errors++;
	}

	if(leagues[team.league].teams.indexOf(team.id) <0 ){
		console.log("  TEAM ASSIGNED TO LEAGUE, BUT LEAGUE DOES NOT USE TEAM:", team.id, team.league);
			errors++;
	}
	///assume the default layout 
	if(!fs.existsSync("../web/"+team.crest) ){
		console.log("  Team Crest Missing", team.id);
		errors++;
	}
	if(team.crest.indexOf(team.id)<0){
		console.log("  Team Crest Missing TEAM ID", team.id , team.crest);
		errors++;	
	}

	if(!team.website){
		console.log("  TEAM has no website", team.id);
		errors++;
	}
	if(team.website.indexOf("http")<0){
		console.log("  TEAM website has no http, thus links are borked", team.id);
		errors++;
	}


	var hassm=false;
	for(var sm in team.social){
		hassm = hassm || !!team.social[sm];
	}
	if(!hassm){
		console.log("  TEAM has no social media", team.id);
		errors++;
	}
	if(team.social.snapchat && team.social.snapchat.indexOf("add/")==0){
		console.log("  TEAM has add in snapchat url", team.id);
		errors++;
	}


	//check for matching fields( copy and paste errors)
	for(var j in teams){
		if(team.stadium === teams[j].stadium && 
			team.address === teams[j].address && 
			team.coords != teams[j].coords
			)
		{
			console.log("  TEAM's shared stadium has different coords than other teams'", team.stadium, team.id, teams[j].id);
			errors++;
		}
		if(team.stadium != teams[j].stadium && 
			team.address != teams[j].address && 
			team.coords == teams[j].coords
			)
		{
			console.log("  TEAM's stadium has the same coords as another team's", team.coords, team.id, temas[j].id);
			errors++;
		}
	
	}

}

console.log("Found ", errors, " errors");