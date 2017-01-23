const express     = require('express');
const router      = express.Router();

router.get('/callback/sms/', require('./thaibulksms/callback.js'));

module.exports = router;