const moment      = require('moment');
const sql         = require('mssql');

module.exports = function(req, res) {
	let param = req.query;

// http://localhost:3000/api/callback/sms/?Transaction=7c5e6fb018bf4970b87a06848a36680b&Status=Delivered&Time=1485152408
	if (param['Transaction'] || param['Status'] || param['Time']) {
		let datatime = moment(parseInt(param['Time'])*1000).format('YYYY-MM-DD HH:mm:ss:SSS') //2017-01-23 14:32:23
		let success = param['Status'] === 'Delivered' ? 'Y' : 'N';
		res.writeHead(200);
    sql.connect("mssql://travoxmos:systrav@db3.ns.co.th/travox_system").then(function() {

      let query = `
        UPDATE [logs].[module_sms] 
        SET [response_date] = CONVERT(DATETIME, '${datatime}', 120), [status] = '${param['Status']}', [success] = '${success}'
        WHERE [transaction] = '${param['Transaction'].trim()}'
      `;

      return new sql.Request().query(query);
    }).then(function(){
			res.end();
    }).catch(function(err) {
			res.end(err);
    });

	} else {
		res.writeHead(404);
		res.end();
	}
}