const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const _ = require('lodash');
const jwt = require('jsonwebtoken');

// authenticating a user
router.post('/', async (req, res) => {
    let user;
    let valid;
    try {
        user = await User.findOne(_.pick(req.body, ['username']));
        if (!user) {
            res.status(400).send('Invalid username or password');
            return;
        };

        valid = await bcrypt.compare(req.body.password, user.password);
        if (!valid) {
            res.status(400).send('Invalid username or password');
            return;
        } 

    } catch (err) {
        res.status(400).send(err);
    }
    
    const token = user.generateAuthToken();
    res.send({token});
});

module.exports = router;