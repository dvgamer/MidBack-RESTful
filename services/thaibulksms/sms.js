const request     = require('request');
const moment      = require('moment');
const sql         = require('mssql');

const _DEBUG_      = !Boolean(process.env.PRODUCTION || false);

let bulkUsername = 'travox_mbos@nippon';
let bulkPassword = 'trav0x';
let bulkForce  = 'premium';

// console.log()

module.exports = function(req, res) {
  if(req.headers['token-auth']) {
    let sender = req.body.sender || 'TRAVOX';
    let message = req.body.message;
    let msisdn = req.body.mobile;

    let data = {
      username: _DEBUG_ ? 'thaibulksms' : bulkUsername,
      password: _DEBUG_ ? 'thisispassword' : bulkPassword,
      msisdn: msisdn,
      message: message,
      sender: _DEBUG_ ? 'SMS' : sender,
      // ScheduledDelivery: '0901010101',
      force: _DEBUG_ ? 'standard' : bulkForce
    }
    let options = { 
      method: 'POST',
      url: _DEBUG_ ? 'http://www.thaibulksms.com/sms_api_test.php' : 'https://secure.thaibulksms.com/sms_api.php',
      formData: data
      // headers: { 'cache-control': 'no-cache', 'content-type': 'text/xml; charset=utf-8' },
    }

    res.writeHead(200, {"Content-Type": "application/json"});
    if(!message) {
        res.end(JSON.stringify({ error: 'Empty parameter `message`' }));
    } else if (!msisdn) {
        res.end(JSON.stringify({ error: 'Empty parameter `mobile`' }));
    } else {
      request(options, function (error, response, body) {
        error = error || (/<Detail>(.*?)<\/Detail>/i.exec(body)||[])[1];
          sql.connect("mssql://travoxmos:systrav@db3.ns.co.th/travox_system").then(function() {
            let item = /<QUEUE>[\w\W]+?<Transaction>(.*?)<\/Transaction>[\w\W]+?<UsedCredit>(.*?)<\/UsedCredit>[\w\W]+?<RemainCredit>(.*?)<\/RemainCredit>[\w\W]+?<\/QUEUE>/ig.exec(body)||[];
            error = !item.length ? 'mobile number cannot send.' : error;
            let query = `
              INSERT INTO [logs].[module_sms] ([msisdn],[message],[sender],[transaction],[used],[remain],[success],[status])
              VALUES ( '${data.msisdn}','${data.message}','${data.sender}',
                '${!error?item[1]:''}',${!error?item[2]:'NULL'},${!error?item[3]:'NULL'},'${!error?'Y':'N'}','${error?error:''}')
            `;
            return new sql.Request().query(query);
          }).then(function(){
            res.end(JSON.stringify({ error: error || null }));
          }).catch(function(err) {
            res.end(JSON.stringify({ error: err.message }));
          });
      });
    }
  } else {
    res.writeHead(404);
    res.end();
  }
}