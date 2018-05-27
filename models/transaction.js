const mongoose = require('../db/mongoose');
const Schema = mongoose.Schema;
const validator = require('validator');

const TransactionSchema = new Schema({
    channel: {
        type: Schema.Types.ObjectId, ref: 'Channel',
        required: true,
        trim: true,
    },
    origin: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: (value) => {
                return validator.isEmail(value)
            },
            message: '{VALUE} is not a valid email'
        }
    },
    partner: {
        type: new Schema({
            partner_id: { type: String },
            username: { 
                type: String, 
                validate: {
                validator: (value) => {
                    return validator.isEmail(value)
                },
                message: '{VALUE} is not a valid email'
            } }
        }),
        required: true,
        trim: true,
    },
    url: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: String,
        required: true,
        trim: true,
    }
});

module.exports = mongoose.model('Transaction', TransactionSchema);