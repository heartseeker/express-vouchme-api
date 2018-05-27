const mongoose = require('../db/mongoose');
const Schema = mongoose.Schema;

/*
 * Status Values
 * 1 = public
 * 2 = private
 */
const ChannelSchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    status: {
        type: Number,
        required: true,
        default: 2
    },
    user: {
        type: Schema.Types.ObjectId, ref: 'User',
        required: false,
    }
});

module.exports = mongoose.model('Channel', ChannelSchema);