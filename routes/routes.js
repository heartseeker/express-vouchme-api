const express = require('express');

let router = express.Router();


// Users API endpoints
// ==============================================
router.use('/users', require('./users'));
router.use('/auth', require('./auth'));
router.use('/channels', require('./channels'));
router.use('/transactions', require('./transactions'));
router.use('/vouches', require('./vouches'));

module.exports = router;