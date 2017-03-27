"use strict";
const inbox 			= require('inbox');
const moment      = require('moment');
const sql         = require('mssql');
const Q           = require('q');

let imap = {
  username: 'pgm',
  password: '123456',
  host: 'mail.ns.co.th',
  port: 143,
  tls: true
};

let client = inbox.createConnection(false, imap.host, {
  secureConnection: imap.tls,
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
    contents = (/Content-Type: text\/html;[\W\w]*?\r\n\r\n([\W\w]+?)(\r\n\r\n|----)/ig.exec(contents)||[]);
    if (!contents) throw new Error('Content-Type unknow');

    let endcoding = (/Content-Transfer-Encoding:.(.*?)\r\n/ig.exec(contents[0])||[])[1];
    if (!endcoding) throw new Error('Content-Transfer-Encoding unknow');

    if(endcoding == 'base64') {
      let buf = Buffer.from(contents[1].toString().trim(), 'base64');
      contents = buf.toString()
    }

    let getDB  = /VERIFY.DB.\[(.*?)\]/ig;
    let getBody = (/<body>([\W\w]*?)<\/body>/ig.exec(contents) || [])[1];
    let getUID = (/<title>MESSAGEID:.(\d+?)<\/title>/ig.exec(contents) || [])[1];

    if(!getUID) {
      moveArchive(message.UID, '.unknow');
    } else {

      let tran = new sql.Transaction(db);
      tran.begin().then(function() {
        var request = new sql.Request(tran);

        let module_email = `UPDATE logs.module_email SET verify = GETDATE() WHERE id = ${getUID} AND verify IS NULL`;

        return request.query(module_email).then(function(){
          let verify_domain = /\[verify.domain\].*?`(.*?)`/ig;
          if(verify_domain.test(message.title)) {

            getDB = (getDB.exec(getBody || '') || [])[1];
            console.log(`${getUID}: Verify Domain update company_profile_config`);
            
            let company_profile_config = `UPDATE ${getDB}.travoxmos.company_profile_config SET [value]='Y' WHERE [key]='CUSTOM_SMTP_EMAIL_VERIFY'`;
            return request.query(company_profile_config).then(function(){

              console.log(`${getUID} ${moment(message.date).format("YYYY-MMM-DD HH:mm:ss")}: moveArchive(Archive)`);
              return moveArchive(message.UID, 'Archive');
            });
          } else {
            console.log(`${getUID} ${moment(message.date).format("YYYY-MMM-DD HH:mm:ss")}: moveArchive(Notifications)`);
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
        client.listMessages(-100, function(err, messages){
          if (err) console.log('listMessages', err); else (messages || []).forEach(moveMessage);
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
