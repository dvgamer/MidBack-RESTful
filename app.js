"use strict";
// oauth.touno-k.com/sentinel?code=bb42f3a8f7298cd65d7d&state=xxxx
const express 		= require('express')();
const bodyParser 	= require('body-parser')
const morgan 			= require('morgan');
const http 				= require("http").createServer(express);
const io 					= require('socket.io')(http);
const moment  		= require('moment');
const chalk   		= require('chalk');
const cron 				= require('cron');

const imap        = require('./webmail/');

const port				= 3000;
// const api         = require('./api-v3/');

// parse application/x-www-form-urlencoded
express.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
express.use(bodyParser.json());
// HTTP request logger
express.use(morgan(`:date[iso] :method :status :remote-addr :response-time ms\t:url`));

// index.html -- test socket.io
// express.set("view options", { layout: false });
// express.use(require('express').static(__dirname + '/views/'));

express.post('/oauth', require('./oauth/authorize.js'));
express.get('/token', require('./oauth/token.js'));

express.use('/API-v3', require('./services/index-v3.js'));
express.use('/API', require('./services/index-v1.js'));
express.get('/', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  // res.render('/view/index.html');
  res.end(JSON.stringify({ status: true }))
});



let noti = io.of('/noti').on('connection', function(socket){
  console.log(`SOCKET\t/noti client +1.`);

  socket.on('message', function(msg){
    console.log('message: ' + msg);
  });

  socket.on('disconnect', function(msg){
    console.log(`SOCKET\t/noti client -1.`);
  });
});

// SIGINT, SIGTERM, and SIGKILL
process.on('SIGINT', function() {
  console.log(`REST-API at ${moment().format("HH:mm:ss")} Shutdown...`);
  process.exit();
}); 

imap.connect();

http.listen(port, () => { console.log(`REST-API at ${moment().format("YYYY-MMM-DD HH:mm:ss")} Started`); });