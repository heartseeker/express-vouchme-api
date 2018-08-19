const express = require('express');

let router = express.Router();


// Users API endpoints
// ==============================================
router.use('/users', require('./users'));
router.use('/auth', require('./auth'));
router.use('/channels', require('./channels'));
router.use('/transactions', require('./transactions'));
router.use('/vouches', require('./vouches'));
router.use('/infames', require('./infames'));

module.exports = router;