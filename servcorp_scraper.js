'use strict';

(function(){

	// declare necessary global variables
	var request = require('request'),
		cheerio = require ('cheerio'),
		jbuilder = require('jbuilder');

	var	links = [],
		buildingLinks = [];


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
	function printJson(countryName, buildLink, buildingNames, address, index){

		var output = jbuilder.create(function(json){
			json.set(countryName, function(json){
				buildingNames.forEach(function(buildingName, index){
					json.child( function(json){
						json.set('name', buildingName );
						json.set('address', address[index]);
						json.set('link', buildLink );
					});
				});
			});
		}); 

		console.log(output.target());
	}

	// this function scrapes the servcorp website for names and link information
	function getWorldwideNamesLinks(url, callback){

		// retrieve the body HTML document
		request(url, function(error, response, body){
		
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

	function getInfo (url, buildingName, type, selector, callback) {
	  
	  var res = '';
	  var res2 = '';

		request(url, function(error, response, body){
			if(!error && response.statusCode == 200){
				var $ = cheerio.load(body);

				if(type ==='text' && body){
	   			$(selector[0], selector[1]).each(function( index, element ){
		   			res = $(element).text().replace(/\s{2,}/g, '');
				  });
				} else if (type === 'html') {
  				$(selector[0][0], selector[0][1]).each( function( index, element){
  					res = $(element).html().replace(/\s{2,}/g, '');
  				});
  				$(selector[1][0], selector[1][1]).each( function( index, element){
  					res2 = $(element).html().match(/\d{1,3}.\d{1,}/g);
  				});
  				
				} else {
				  throw error;
				}

			}
			callback && callback(res, res2, buildingName);
		});
	}

	function getBuildingNamesAddresses(url, index, callback){
		
		var countryName = "";
		var addresses = [];
		var buildingName = '';
		var buildingLink = '';

		request(url, function(error, response, body){
			if(!error && response.statusCode == 200){
				var $ = cheerio.load(body);

				countryName = $('.module.page-title h1', '.last').text().replace(/[\s]{2,}/g, '');

				// $('p.building-address', 'div.building-details').each(function(i, span){
				// 	addresses[i] = $(this).html();
				// 	addresses[i] = addresses[i].replace (/\<br\>/g, ' ' );
				// });
				$('p.building-name strong', 'div.building-details').each(function(i, strong){
					buildingName = $(this).text();
				});	

				$('a.button-small-round-white:first-child', '.building-call-to-action').each( function(i, a){
					buildingLink = $(this).attr('href');
					callback && callback( buildingLink, buildingName );
				});

			} else {
				console.log("There was an error retrieving the information.");
			}

			// printJson(countryName, buildingLink, buildingNames, addresses, index);
				
		});
	}


	getWorldwideNamesLinks('http://www.servcorp.com.au/en/worldwide-locations', function(){
		links.forEach( function(link, i){
//			getBuildingNamesAddresses(link, i);
			getBuildingNamesAddresses(link, i, function( buildingLink, buildingName ){
				getInfo(buildingLink, buildingName, 'html', [['p','.location-info address'],['script','.module.building-location-map .column-container']], function(res, res2, buildingName){
					console.log(res);
					console.log(res2);
					console.log(buildingName);
				});
			});
		});
	});

})();