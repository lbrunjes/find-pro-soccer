/*
Display nearest temas.




*/
var ajax = function(url) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, false);
		if (xhr.overrideMimeType) {
			xhr.overrideMimeType("text/plain");
		}
		xhr.send(null);
		// failed request?
		if (xhr.status !== 200 && xhr.status !== 0) { throw ("XMLHttpRequest failed, status code " + xhr.status); }
		return xhr.responseText;
	};
//bind events at page load do other good things.
var startup = function(){
	var map = document.getElementById("map");
	map.onmouseup = lookupmap;
}
var lookupmap = function(e){
	//TODO map to lat long
	
	// add item to map	
	var svg= document.getElementById("svgmap");
	var pt = svg.createSVGPoint(); 
    pt.x = e.clientX;
	pt.y = e.clientY;
    pt =  pt.matrixTransform(svg.getScreenCTM().inverse());
    console.log(pt.x, pt.y);
    addcircle(pt.x, pt.y);

	// This does not work

	e.preventDefault();
}
var addcircle=function(x,y, style){
	// var you = document.getElementById("you");
	// if(you){
	// 	you.parentElement.removeChild(you);
	// }
	// if(!style){
	// 	style="stroke:#f00"

	// }
	// var usa= document.getElementById("USA");
	// var circle = document.createElementNS("http://www.w3.org/2000/svg","circle");
	// circle.setAttribute("cx",x)
	// circle.setAttribute("cy",y)
	// circle.setAttribute("r","5")
	// circle.setAttribute("style",style);
	// circle.setAttribute("id","you");
	// usa.appendChild(circle);
}
var lookupzip = function(){
	var zip =document.getElementById("zip").value.toUpperCase();
	//only get major canada post codes
	if( zip.indexOf(" ") >0){
		zip = zip.substring(0,zip.indexOf(" "));
	}

//	console.log(zip);
	var pos = JSON.parse(ajax("http://127.0.0.1:9000/zip/"+zip));
	

	getTeams(pos[0], pos[1]);
	var pt = latLongtoSvgPoint(pos[0], pos[1]);
	addcircle(pt.x,pt.y);

	

}
//do some basic math here 
var getDist = function(x,y, coords){
	var _x = Math.abs(x - coords[0]);
	var _y = Math.abs(y - coords[1]);
	//console.log(_x, _y,x, y, coords)
	return _x +_y;
	return Math.sqrt(Math.pow(_x,2)+Math.pow(_y,2));
}
var latLongtoSvgPoint=function(lat,long){

	var r_px = 0.059134619;
 	var r_py = -0.07778875;
 	var r_long =16.91056;
 	var r_lat= -12.85532;
 	var lat_offset = 0;
 	var long_offset =0;
 	var x = lat * r_lat+lat_offset;
 	var y = long * r_long+long_offset;

	return {"x":x,"y":y};
}

//evaluate a mouse click to get the closet teams in each league
var getTeams = function(x,y){
	//console.log(mouseevent);


	var nearest = {};

	for(var lg in leagues){
		nearest[lg]={"team":"xx", "dist":9999};

		for (var i =0; i < leagues[lg].teams.length;i++){
			var dist= getDist(x,y, teams[leagues[lg].teams[i]].coords);
		//	console.log(dist ,leagues[lg].teams[i], teams[leagues[lg].teams[i]].coords);
			if(dist < nearest[lg].dist){
				nearest[lg].dist = dist;
				nearest[lg].team = teams[leagues[lg].teams[i]].id;
			}
		}
	}
	//console.log(nearest);
	///at this piint we need to fomrat
	formatTeams(nearest);
}

//display teams on the teams div
var formatTeams = function(closestteams){
	var el = document.getElementById("result");
	while(el.children.length>0){
		el.removeChild(el.children[0]);
	}
	var label =document.createElement("h3");
		label.innerText="Nearest Teams";
		el.appendChild(label);

	label =document.createElement("div");
		
	
	for(var league in closestteams){
		
		var team =teams[closestteams[league].team];
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
		lg_el.setAttribute("class","league_logo");
		
		var lg_img =document.createElement("img");
		lg_img.setAttribute("class","league_logo");
		lg_img.setAttribute("src","images/"+league+"/"+league+".svg");
		lg_el.appendChild(lg_img);
		tm_header.appendChild(lg_el);

		tm.appendChild(tm_header);

		var tm_details =document.createElement("p");
		tm_details.innerText= "About " +Math.ceil(closestteams[league].dist * 69) + " Miles Away";
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



		

		label.appendChild(tm);

		//add crest to item
		var locale = latLongtoSvgPoint(team.coords[0], team.coords[1]);
		console.log(locale);
		addcircle(locale.x, locale.y, "fill:"+team.colors[0] +"stroke:"+team.colors[1]);
	}
	el.appendChild(label);
}

