"use strict";
const inbox 			= require('inbox');
const moment      = require('moment');
const sql         = require('mssql');
const Q           = require('q');

let imap = {
  username: 'pgm',
  password: '123456',
  host: '192.168.10.2',
  port: 143,
  tls: false
};

// 


let client = inbox.createConnection(false, imap.host, {
  secureConnection: false,
  auth:{ user: imap.username, pass: imap.password }
});


let moveArchive = function(UID, folder){
  let def = Q.defer();
  client.moveMessage(UID, `[MBOS]/${folder}`, function(err){ 
    if(err) {
      console.log(`client.moveMessage : ${err}`);
      def.reject(err);
    } else { 
      def.resolve();
    }
  });
  return def.promise;
}



let moveMessage = function(message) {
  console.log(`${message.UID}: ${message.title}`);
  verifyMessage(message);
}


var db = new sql.Connection({
  user: 'travoxmos',
  password: 'systrav',
  server: 'db3.ns.co.th',
  database: 'travox_system'
});

let verifyMessage = function(message){
  let contents = '';
  let msg = client.createMessageStream(message.UID);
  msg.on('data', function(chunk) { contents += chunk.toString(); })
  msg.on('end', function() {
    contents = contents.replace(/=\r\n/ig, '');
    let getDB  = /VERIFY.DB.\[(.*?)\]/ig;
    let getBody = (/<body>([\W\w]*?)<\/body>/ig.exec(contents) || [])[1];
    let getUID = (/<title>MESSAGEID:.(\d+?)<\/title>/ig.exec(contents) || [])[1];
    getDB = (getDB.exec(getBody || '') || [])[1];

    if(getUID) {

      let tran = new sql.Transaction(db);
      tran.begin().then(function() {
        var request = new sql.Request(tran);

        let company_profile_config = `UPDATE ${getDB}.travoxmos.company_profile_config SET [value]='Y' WHERE [key]='CUSTOM_SMTP_EMAIL_VERIFY'`;
        let module_email = `UPDATE logs.module_email SET verify = GETDATE() WHERE id = ${getUID} AND verify IS NULL`;

        return request.query(module_email).then(function(){
          let verify_domain = /\[verify.domain\].*?`(.*?)`/ig;
          if(verify_domain.test(message.title)) {
            console.log(`${message.UID}: Verify Domain update company_profile_config`);
            return request.query(company_profile_config).then(function(){

              console.log(`${message.UID} ${moment(message.date).format("YYYY-MMM-DD HH:mm:ss")}: moveArchive(Archive)`);
              return moveArchive(message.UID, 'Archive');
            });
          } else {
            console.log(`${message.UID} ${moment(message.date).format("YYYY-MMM-DD HH:mm:ss")}: moveArchive(Notifications)`);
            return moveArchive(message.UID, 'Notifications');
          }
        }).then(function(){
          return tran.commit();
        }).catch(function(e){
          tran.rollback();
          console.log('rollback', e);
        });
      }).catch(function(e){
        console.log('begin', e);
      });
    }
  })
}

client.on("connect", function(){
  console.log(`IMAP '${imap.host}' at ${moment().format("YYYY-MMM-DD HH:mm:ss")} Connected.`);
    client.openMailbox("INBOX", function(error, info){
      if(error) throw error;
        
      db.connect().then(function() {
        client.listMessages(-10, function(err, messages){
          messages.forEach(moveMessage);
        });
        client.on("new", function(message){ moveMessage(message); });
      }).catch(function(err) {
        db.close();
        console.log('connect', err);
      });
    });
});
process.on('SIGINT', function() {
  db.close();
  client.close();
  client.on('close', function (){
    console.log(`IMAP '${imap.host}' at ${moment().format("YYYY-MMM-DD HH:mm:ss")} Disconnected.`);
    console.log(`REST-API at ${moment().format("HH:mm:ss")} Shutdown...`);
    process.exit();
  });
}); 

module.exports = client;
