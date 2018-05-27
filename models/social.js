const mongoose = require('../db/mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const SocialSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    url: {
        required: false,
        type: String,
        default: '',
        validate: {
            validator: (value) => {
                if (value !== '')
                return validator.isURL(value)
            },
            message: '{VALUE} is not a valid url'
        }
    },
});

module.exports = SocialSchema;