/*
Display nearest temas.




*/
var api_url = "http://127.0.0.1:9000";
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
//bind events at page load do other good things.
var startup = function(){
	
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
		formatTeams(JSON.parse(res));
	});
	
}
var lookupcoords= function(lat, lng){


ajax(api_url+"/coords/"+lat+"/"+lng, 
	function(res){
		formatTeams(JSON.parse(res));
	})

}
var markers = [];
//display teams on the teams div
var formatTeams = function(data){
	var el = document.getElementById("result");
	while(el.children.length>0){
		el.removeChild(el.children[0]);
	}
	var label =document.createElement("h3");
		label.innerText="Nearest Teams";
		el.appendChild(label);

	label =document.createElement("div");
		
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
		var lg_el =document.createElement("span");
		lg_el.setAttribute("class","league_logo");
		
		var lg_img =document.createElement("img");
		lg_img.setAttribute("class","league_logo");
		lg_img.setAttribute("src","images/"+league+"/"+league+".svg");
		
		lg_el.innerText = league;
		lg_el.prepend(lg_img);
		tm_header.appendChild(lg_el);

		tm.appendChild(tm_header);

		var tm_details =document.createElement("p");
		tm_details.innerText= "About " +Math.ceil(data.teams[league].dist * 69) + " Miles Away";
		tm.appendChild(tm_details);
		
		tm_details =document.createElement("a");
		tm_details.setAttribute("href",team.website);
		tm_details.innerText = team.website;
		tm.appendChild(tm_details);

		tm_details =document.createElement("p");
		tm_details.innerHTML = team.stadium;
		var tm_stadium_address =document.createElement("br");
		tm_details.appendChild(tm_stadium_address);
		tm_stadium_address =document.createElement("a");
		tm_stadium_address.setAttribute("href","https://www.google.com/maps/dir//"+team.address);
		tm_stadium_address.innerHTML = team.address;
		tm_details.appendChild(tm_stadium_address);
		tm.appendChild(tm_details);

		tm_details =document.createElement("p");
		tm_details.innerHTML = "Next home game: 2018/NA/NA";

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

