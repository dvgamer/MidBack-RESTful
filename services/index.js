const express     = require('express');
const router      = express.Router();

router.post('/SMS/', require('./thaibulksms/sms.js'));
// router.post('/SMS/remain/', require('./thaibulksms/remain.js'));
// router.post('/callback/sms/', require('./thaibulksms/callback.js'));
router.post('/exchange-rate/', require('./travelport/exchange-rate.js'));

module.exports = router;