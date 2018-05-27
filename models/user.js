const mongoose = require('../db/mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');
const ProfileSchema = require('../models/profile');
const SocialSchema = require('../models/social');

const UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: (value) => {
                return validator.isEmail(value)
            },
            message: '{VALUE} is not a valid email'
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        minlength: 8
    },
    alias: {
        type: String,
        required: false,
        trim: true,
    },
    profile: ProfileSchema,
    social: [SocialSchema],
});



UserSchema.methods.generateAuthToken = function () {
    const user = this;
    return jwt.sign({_id: user.id}, 'abc123', {expiresIn: '8h'}).toString();
}


// hash password before save
// =======================================
UserSchema.pre('save', async function(next) {

    const user = this;

    if (user.isModified('password')) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(user.password, salt);
        user.password = hash;
        return next();
    } 
    return next();
});

module.exports = mongoose.model('User', UserSchema);