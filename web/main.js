/*
Display nearest temas.




*/
var api_url = "https://brunjes.org:9000";
//var api_url = "http://localhost:9000";

var ajax = function(url, load) {
	var xhr = new XMLHttpRequest();
	xhr.open("GET", url,true);
	xhr.onload=(e)=>{
		if (xhr.readyState === 4) {
			if (xhr.status === 200) {
				load(xhr.responseText);
			}
			else{
				console.log(xhr.responseCode, xhr.responseText);
			}
		}
	}


	xhr.send(null);

};
var getQS = function(){

	var querystring = {};
	var qs= location.search.substring(1).split("&");
	for(var i = 0 ; i <qs.length;i++){
		var item = qs[i].split("=");
		querystring[item[0]]= item.length>1?item[1]:'';
	}
	return querystring;
}
//bind events at page load do other good things.
var startup = function(){

	if(location.search.indexOf("league=")>=0){
		lookupleague(getQS()["league"]);
	}
	else if(location.search.indexOf("zip=")>=0){
		lookupzip(getQS()["zip"]);
	}
	else if(location.search.indexOf("lat=")>=0 && location.search.indexOf("lng=")>=0){
		var qs = getQS();
		lookupcoords(qs["lat"],qs["lng"]);
	}

}



var lookupzip = function(){
	var zip =document.getElementById("zip").value.toUpperCase();
	//only get major canada post codes
	if( zip.indexOf(" ") >0){
		zip = zip.substring(0,zip.indexOf(" "));
	}
	if(zip.length < 1){
		alert("Need your zip, so its not creepy");
		return;

	}

	ajax(api_url+"/zip/"+zip, 
		function(res){
			history.replaceState({}, "Data for zip:"+zip, location.pathname+"?zip="+zip);
			formatTeams(JSON.parse(res));
		});
	
}
var lookupleague=function(leaguename){
	ajax(api_url+"/league/"+leaguename, 
		function(res){
			history.replaceState({}, "Data for league:"+leaguename, location.pathname+"?league="+leaguename);

			formatLeague(JSON.parse(res));
		})

}
var lookupcoords= function(lat, lng){


	ajax(api_url+"/coords/"+lat+"/"+lng, 
		function(res){
			history.replaceState({}, "Looking up that location ("+lat+","+lng+")", location.pathname+"?lat="+lat+"&lng="+lng);

			formatTeams(JSON.parse(res));
		})

}
var markers = [];
var approxDist = function(input, target){
	var radius_earth = 3959; //miles (AMERAICA)
	var pi_180 = 0.017453292519943295;
	var x = (input[0] - target[0]) * pi_180;
	var y = (input[1] - target[1]) * pi_180;
	var tmp = Math.sin(x/2)* Math.sin(x/2) + 
	Math.cos(input[0] * pi_180)* Math.cos(target[0] * pi_180)*
	Math.sin(y/2) *Math.sin(y/2);

	return  Math.round(radius_earth * 2 * Math.atan2(Math.sqrt(tmp), Math.sqrt(1-tmp)));

}

//display teams on the teams div
var formatTeams = function(data){
	var el = document.getElementById("result");
	while(el.children.length>0){
		el.removeChild(el.children[0]);
	}
	// var label =document.createElement("h3");
	// 	label.innerText="Nearest Teams";//
		//Math.round(data.input[0] *100)/100 + ","+ Math.round(data.input[1] *100)/100  ;

		
		// el.appendChild(label);

		var label =document.createElement("div");
		label.setAttribute("id","result-list");
		//deal with zooming the map to the right places.
		for(var i = 0; i < markers.length; i++){
			map.removeLayer(markers[i]);
		}
		markers=[];


		markers.push(L.marker(data.input).addTo(map).bindPopup("You (Approximately)"));


		for(var league in data.teams){


			var team =data.teams[league].team;
//		console.log(league, team, closestteams[league]);

		// var lg =document.createElement("div");
		// lg.setAttribute("class","league");
		
		

		//add team
		var tm =document.createElement("div");
		tm.setAttribute("class","team");
		
		var tm_header =document.createElement("header");

		var tm_logo =document.createElement("img");
		tm_logo.setAttribute("class","team_crest");
		tm_logo.setAttribute("src",team.crest);
		tm_header.appendChild(tm_logo);

		var tm_name =document.createElement("h3");
		tm_name.innerText=team.name;
		tm_header.appendChild(tm_name);
		
		//add logo for league
		var lg_el =document.createElement("a");
		//tm_details.setAttribute("href","?league="+league);
		lg_el.setAttribute("onclick", "lookupleague(\""+league+"\")");
		lg_el.setAttribute("class","league_logo");
		
		var lg_img =document.createElement("img");
		lg_img.setAttribute("class","league_logo");
		lg_img.setAttribute("src","images/"+league+"/"+league+".svg");
		
		
		lg_el.prepend(lg_img);
		tm_header.prepend(lg_el);

		tm.appendChild(tm_header);

		
		
		var tm_details =document.createElement("p");
		tm_details.innerHTML = "<br/>"+team.stadium +"<br/> (About " + approxDist(data.input, team.coords) + " Miles  Away)";
		var tm_stadium_address =document.createElement("br");
		tm_details.appendChild(tm_stadium_address);
		tm_stadium_address =document.createElement("a");
		tm_stadium_address.setAttribute("href","https://www.google.com/maps/dir//"+team.address);
		tm_stadium_address.innerHTML = team.address;
		tm_details.appendChild(tm_stadium_address);

		var team_site=document.createElement("a");
		team_site.setAttribute("href",team.website);
		team_site.innerText = team.website;
		tm_details.prepend(team_site);
		
		tm.appendChild(tm_details);

		tm_details =document.createElement("p");
		tm_details.innerHTML = "Next home game: 2018/NA/NA";
		tm_details.appendChild(generateSocialIcons(team));

		tm.appendChild(tm_details);
		

		label.appendChild(tm);

		//add crest to maps
		var icon = L.icon({
			iconUrl: team.crest,
			iconSize:[64,64],
			iconAnchor:[32,64],

		});
		var okay=true;
		for(var i =0; i < markers.length;i++){
			if(markers[i]._latlng.lat == team.coords[0] &&
				markers[i]._latlng.lng == team.coords[1]){
		//		console.log(team.name, " moved up slightly");
	okay = false;
	break;
}
}

if(!okay){
	icon.options.iconAnchor[1] -= 32 + Math.random() *32;
	icon.options.iconAnchor[0] -=  Math.random() *32;
}


markers.push(L.marker(team.coords, {icon:icon,
	riseOnHover:true}).addTo(map)
.bindPopup(" Open <a href='"+team.website+"' target='_blank'>"+team.name+"</a> Site"));


}
el.appendChild(label);

	//establish a boudnig box for stuff so the suer can see it.
	var max =[-90,-180];
	var min = [90,180]
	for(var i =0; i < markers.length;i++){
		min[0] = min[0] < markers[i]._latlng.lat?min[0]: markers[i]._latlng.lat;
		min[1] = min[1] < markers[i]._latlng.lng?min[1]: markers[i]._latlng.lng;
		max[0] = max[0] > markers[i]._latlng.lat?max[0]: markers[i]._latlng.lat;
		max[1] = max[1] > markers[i]._latlng.lng?max[1]: markers[i]._latlng.lng;

	};
//	console.log(min,max);
map.fitBounds([min,max]);

};
//display teams on the teams div
var formatLeague = function(data){
	var el = document.getElementById("result");
	while(el.children.length>0){
		el.removeChild(el.children[0]);
	}
	var header = document.createElement("header");
	header.setAttribute("class","league_list");
	var label =document.createElement("h2");
	label.innerText="All Teams in "+data.league;//
	//Math.round(data.input[0] *100)/100 + ","+ Math.round(data.input[1] *100)/100  ;

	var lg_img =document.createElement("img");
	lg_img.setAttribute("class","league_logo_big");
	lg_img.setAttribute("src","images/"+data.league+"/"+data.league+".svg");
	
	
	header.prepend(lg_img);
	header.appendChild(label);
	el.appendChild(header);
	label =document.createElement("div");
	label.setAttribute("class","league_teams")
	
	//deal with zooming the map to the right places.
	for(var i = 0; i < markers.length; i++){
		map.removeLayer(markers[i]);
	}
	markers=[];




	for(var teamcode in data.teams){


		var team =data.teams[teamcode];



	//add team
	var tm =document.createElement("div");
	tm.setAttribute("class","team");
	
	var tm_header =document.createElement("header");

	var tm_logo =document.createElement("img");
	tm_logo.setAttribute("class","team_crest");
	tm_logo.setAttribute("src",team.crest);
	tm_header.appendChild(tm_logo);

	var tm_name =document.createElement("h3");
	tm_name.innerText=team.name;
	tm_header.appendChild(tm_name);
	
	
	tm.appendChild(tm_header);
	tm.appendChild(generateSocialIcons(team));
	

	label.appendChild(tm);

	//add crest to maps
	var icon = L.icon({
		iconUrl: team.crest,
		iconSize:[64,64],
		iconAnchor:[32,64],

	});
	var okay=true;
	for(var i =0; i < markers.length;i++){
		if(markers[i]._latlng.lat == team.coords[0] &&
			markers[i]._latlng.lng == team.coords[1]){
		//		console.log(team.name, " moved up slightly");
	okay = false;
	break;
}
}

if(!okay){
	icon.options.iconAnchor[1] -= 32 + Math.random() *32;
	icon.options.iconAnchor[0] -=  Math.random() *32;
}


markers.push(L.marker(team.coords, {icon:icon,
	riseOnHover:true}).addTo(map)
.bindPopup(" Open <a href='"+team.website+"' target='_blank'>"+team.name+"</a> Site"));


}
el.appendChild(label);

	//establish a boudnig box for stuff so the suer can see it.
	var max =[-90,-180];
	var min = [90,180]
	for(var i =0; i < markers.length;i++){
		min[0] = min[0] < markers[i]._latlng.lat?min[0]: markers[i]._latlng.lat;
		min[1] = min[1] < markers[i]._latlng.lng?min[1]: markers[i]._latlng.lng;
		max[0] = max[0] > markers[i]._latlng.lat?max[0]: markers[i]._latlng.lat;
		max[1] = max[1] > markers[i]._latlng.lng?max[1]: markers[i]._latlng.lng;

	};
//	console.log(min,max);
map.fitBounds([min,max]);

};

var generateSocialIcons = function(team){
	var urls={
		"googleplus":"https://plus.google.com/"
	};
	var blanks = ["rss","web"]
	var iconurl = " images/icons/";

	var list = document.createElement("div");
	list.setAttribute("class", "social");
	for(var media in team.social){
		if(team.social[media] ){
			var link = document.createElement("a");
			var icon = document.createElement("img");
			var root =(blanks.indexOf(media)>=0? "":urls[media]? urls[media]:"https://"+media+".com/");
			link.setAttribute("href", root+team.social[media]);
			link.setAttribute("target","_blank");
			icon.setAttribute("src", iconurl+media+".svg");
			link.appendChild(icon);
			list.appendChild(link);
		}

	}
	return list;
}
