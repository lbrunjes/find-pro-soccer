/*
REst api for Soccer Zips.




*/
const fs = require('fs');

var rest_api = function(){
	api = this;

	this.zips = JSON.parse(fs.readFileSync("./zips.js"));
	
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

					case "zip": //zip/T1G
						var key = api_request.length>1?api_requested[2] : "xxx";
						if(api.zips[key]){
							response.writeHead(200,headers);
							response.end(JSON.stringify(api.zip[key]));
						}
						else{
							response.writeHead(404,headers);
							response.end(JSON.stringify({"zip not found": "Invalid post code, expected 23223 OR T1G "}));
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
				
			response.end(JSON.stringify({"error":ex}));
			throw(ex);
		}

	}

}


module.exports = new rest_api();