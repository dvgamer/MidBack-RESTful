const express     = require('express');
const router      = express.Router();

router.use('/*', function(req, res, next){
  if(!req.headers['token-auth']) {
    res.writeHead(404);
    res.end();
  } else {
  	next();
  }
})

router.post('/SMS/', require('./thaibulksms/sms.js'));
// router.post('/SMS/remain/', require('./thaibulksms/remain.js'));
router.post('/exchange-rate/', require('./travelport/exchange-rate.js'));

module.exports = router;