'use strict';

(function(){

	// declare necessary global variables
	var request = require('request'),
		cheerio = require ('cheerio'),
		jbuilder = require('jbuilder');

	var	links = [],
		buildingLinkss = [];


	// Print to console in human readable format
	function printInformation(buildingNamess, address, index){
		var currentCountry = countryNames[index].replace(/\s/g, '');
		console.log('****************\n' + (index+1) + '. ' + currentCountry + '\n****************');

		buildingNamess.forEach(function(name, i){
			console.log(name + '\n-----------');
			console.log(address[i] + '\n');
		});

		console.log('\n ');
	}

	// Print to console in JSON
	function printJson(countryName, buildLink, buildingNamess, address, index){

		var output = jbuilder.create(function(json){
			json.set(countryName, function(json){
				buildingNamess.forEach(function(buildingNames, index){
					json.child( function(json){
						json.set('name', buildingNames );
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

	function getInfo (urls, buildingNames, type, selector, callback) {
	  
	  var res = '';
	  var res2 = '';

	  urls.forEach(function(url, index){
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
	  					res2 = $(element).html().match(/\d{1,3}.\d{8,}/g);
	  				});
	  				
					} else {
					  throw error;
					}
				}
				callback && callback(res, res2, buildingNames[index]);
			});
	  });
	}

	function getBuildingLinksAndNames(links, callback){
		
		var countryName = "";
		var addresses = [];
		var buildingNames = [];
		var buildingLinks = [];

		links.forEach( function(url, index){

			request(url, function(error, response, body){
				if(!error && response.statusCode == 200){
					var $ = cheerio.load(body);

					countryName = $('.module.page-title h1', '.last').text().replace(/[\s]{2,}/g, '');

					// $('p.building-address', 'div.building-details').each(function(i, span){
					// 	addresses[i] = $(this).html();
					// 	addresses[i] = addresses[i].replace (/\<br\>/g, ' ' );
					// });
					$('p.building-name strong', 'div.building-details').each(function(i, strong){
						buildingNames.push($(this).text());
					});	

					$('a.button-small-round-white:first-child', '.building-call-to-action').each( function(i, a){
						buildingLinks.push($(this).attr('href'));
					});

				} else {
					console.log("There was an error retrieving the information.");
				}
				
				callback && callback( buildingLinks, buildingNames );
				// printJson(countryName, buildingLinks, buildingNamess, addresses, index);
			});
		});
	}

  //go to servcorp australia website
	getWorldwideNamesLinks('http://www.servcorp.com.au/en/worldwide-locations', function(){
			// get all of the links to the location webpages and take their names (this should occur in two arrays)
			getBuildingLinksAndNames(links, function( buildingLinks, buildingNames ){
				// for each location link
				buildingLinks.forEach( function( building, index ){
					// retrieve the html on the page, parse it and give me the gps location and address
					getInfo(buildingLinks, buildingNames, 'html', [['p','.location-info address'],['script','.module.building-location-map .column-container']], function(address, gps, buildingName ){
						console.log(buildingName);
						console.log(address);
						console.log(gps);
					});
				});
			});
	});

})();