const User = require('../models/user');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

const authenticate = async (req, res, next) => {
    const token = req.header('x-auth');

    // check if x-auth exist
    if (!token) {
        return res.status(401).send('Token not exist');
    }

    let user;
    try {
        user = jwt.decode(token);
        if (!user) 
            throw 'Not Authenticated';
    } catch(err) {
        return res.status(401).send('Not Authenticated');
    }

    console.log('user', user);

    user = await User.findOne({_id: user._id}).select('-password');
    if (!user) {
        return res.status(401).send('Not Authenticated');
    }
    req.user = user;
    next();
}

module.exports = authenticate;