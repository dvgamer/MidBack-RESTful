"use strict";
const inbox 			= require('inbox');
const moment      = require('moment');

let imap = {
  username: 'pgm',
  password: '123456',
  host: '192.168.10.2',
  port: 143,
  tls: false
};

// 
let verify_domain = /\[verify.domain\].*?`(.*?)`/ig;


let client = inbox.createConnection(false, imap.host, {
  secureConnection: false,
  auth:{ user: imap.username, pass: imap.password }
});


let moveMessage = function(UID){
  client.moveMessage(UID, "[MBOS]/Archive", function(err){ if(err) console.log(`client.moveMessage : ${err}`); });
}

client.on("connect", function(){
  console.log(`IMAP '${imap.host}' at ${moment().format("YYYY-MMM-DD HH:mm:ss")} Connected.`);
    client.openMailbox("INBOX", function(error, info){
        if(error) throw error;

        client.listMessages(-10, function(err, messages){
            messages.forEach(function(message){
              console.log(message.UID + ": " + message.title);
              moveMessage(message.UID);
            });
        });

        client.on("new", function(message){
          //message.date // Wed, 25 Apr 2012 12:23:05 GMT,
          //me.from.address

          console.log(`${message.UID}: ${message.title}`);
          console.log(`${moment(message.date).format("YYYY-MMM-DD HH:mm:ss")}`);
          console.log(`${message.from.address}`);
          moveMessage(message.UID);
        });



    });



});
module.exports = client;
