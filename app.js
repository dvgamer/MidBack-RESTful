"use strict";
// oauth.touno-k.com/sentinel?code=bb42f3a8f7298cd65d7d&state=xxxx
const express 		= require('express')();
const bodyParser 	= require('body-parser')
const morgan 			= require('morgan');
const http 				= require("http").createServer(express);
const moment  		= require('moment');
const chalk   		= require('chalk');
const cron 				= require('cron');
const port				= 80;

// parse application/x-www-form-urlencoded
express.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
express.use(bodyParser.json());
// HTTP request logger
let common = `:method :url :status - :remote-addr :response-time ms`;
express.use(morgan(common));

express.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({ server: 'online' }));
});

http.listen(port, function() {
  console.log(`REST-API at ${moment().format("HH:mm:ss")} Started`);
});

// SIGINT, SIGTERM, and SIGKILL
process.on('SIGINT', function() {
  console.log(`REST-API at ${moment().format("HH:mm:ss")} Shutdown...`);
  process.exit();
}); 