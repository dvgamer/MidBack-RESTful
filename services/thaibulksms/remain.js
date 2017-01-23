const request     = require('request');
const moment      = require('moment');

const _DEBUG_      = !Boolean(process.env.PRODUCTION || false);

let bulkUsername = 'travox_mbos@nippon';
let bulkPassword = 'trav0x';

module.exports = function(req, res) {
  let options = { 
    method: 'POST',
    url: _DEBUG_ ? 'http://www.thaibulksms.com/sms_api_test.php' : 'https://secure.thaibulksms.com/sms_api.php',
    formData: {
	    username: _DEBUG_ ? 'thaibulksms' : bulkUsername,
	    password: _DEBUG_ ? 'thisispassword' : bulkPassword,
    	tag: 'credit_remain_premium'
    }
  }
	res.writeHead(200);
  request(options, function (error, response, body) { 
  	res.end(JSON.stringify({ remain: body })); 
  });
}