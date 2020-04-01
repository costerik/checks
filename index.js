/*
 * Primary file for the API
 *
 * */

// Dependencies
const http = require('http');
const https = require('https');
const url = require("url");
const stringDecoder = require('string_decoder').StringDecoder;
const fs = require("fs");

const config = require("./config");
const helpers = require("./lib/helpers");

const handlers = require("./lib/handlers")

function setupServer(req, res){
	const { method , url: urlReq, headers}  = req;
	const parseUrl = url.parse(urlReq, true);

	const {pathname: path, query: queryStringObject} = parseUrl;
	const trimmedPath = path.replace(/^\/+|\/+$/g,"");
	const decoder = new stringDecoder("utf-8");
	let buffer='';

	req.on("data", function(data){
		buffer+=decoder.write(data);
	});

	req.on("end", function(){
		buffer +=decoder.end();

		let data = {
			headers,
			trimmedPath,
			method,
			payload: helpers.parseJsonToObject(buffer),
			query: queryStringObject,
		}

		const handler = handlers[trimmedPath] || handlers.notFound;

		handler(data, function(statusCode, response){
			res.setHeader('Content-Type','application/json');
			res.writeHead(statusCode);
			res.end(JSON.stringify(response || {}));

			console.log("method:", method);
			console.log("query", queryStringObject);
			console.log("payload", buffer);
			console.log("response", response);
		});
	});
}

const httpServer = http.createServer(function(req, res){
	setupServer(req, res);
});

httpServer.listen(config.httpPort, function(){
	console.log(`The server is listening on port ${config.httpPort} in ${config.env} mode`);
});

const httpsServerOptions = {
	key: fs.readFileSync('./https/key.pem'),
	cert: fs.readFileSync('./https/cert.pem'),
}

const httpsServer = https.createServer(httpsServerOptions, function(req, res){
	setupServer(req, res);
});

httpsServer.listen(config.httpsPort, function(){
	console.log(`The server is listening on port ${config.httpsPort} in ${config.env} mode`);
});
