'use strict';

(function(){

	// declare necessary global variables
	var request = require('request'),
		cheerio = require ('cheerio'),
		jbuilder = require('jbuilder');

	var	links = [];


	// Print to console in human readable format
	function printInformation(buildingNames, address, index){
		var currentCountry = countryNames[index].replace(/\s/g, '');
		console.log('****************\n' + (index+1) + '. ' + currentCountry + '\n****************');

		buildingNames.forEach(function(name, i){
			console.log(name + '\n-----------');
			console.log(address[i] + '\n');
		});

		console.log('\n ');
	}

	// Print to console in JSON
	function printJson(countryName, buildingNames, address, index){

		var output = jbuilder.create(function(json){
			json.set(countryName, function(json){
				buildingNames.forEach(function(buildingName, index){
					json.child( function(json){
						json.set('name', buildingName );
						json.set('address', address[index]);
					});
				});
			});
		}); 

		console.log(output.target());
	}

	// this function scrapes the servcorp website for names and link information
	function getWorldwideNamesLinks(callback){

		// retrieve the body HTML document
		request('http://www.servcorp.com.au/en/worldwide-locations', function(error, response, body){
		
			// if everything is ok then proceed
			if(!error && response.statusCode == 200){

				var $ = cheerio.load(body);

				// load links into an array
				$('ul.locations li a').each( function(i, a){
					var link = 'http://www.servcorp.com.au' + $(this).attr('href');
					links.push(link);
				});

				// print the number of locations
				console.log('Servcorp operates in ' + links.length + ' different countries all over the world.');

			} else {
				console.log('There was an error retrieving the data.');
			}

			// execute callback (when this finishes loading then you can start to parse the price pages)
			callback && callback();
		});
		
	}

	function getBuildingNamesAddresses(url, index, json, callback){
		
		var countryName = "";
		var addresses = [];
		var buildingNames = [];

		request(url, function(error, response, body){
			if(!error && response.statusCode == 200){
				var $ = cheerio.load(body);

				countryName = $('.module.page-title h1', '.last').text().replace(/[\s]{2,}/g, '');

				$('p.building-address', 'div.building-details').each(function(i, span){
					addresses[i] = $(this).html();
					addresses[i] = addresses[i].replace (/\<br\>/g, ' ' );
				});

				$('p.building-name strong', 'div.building-details').each(function(i, strong){
					buildingNames[i] = $(this).text();
				});	

			} else {
				console.log("There was an error retrieving the information.");
			}

			printJson(countryName, buildingNames, addresses, index);

		});
		
		callback && callback();	
	}


	getWorldwideNamesLinks( function(){
		links.forEach( function(link, i){
			getBuildingNamesAddresses(link, i);
		});
	});

})();