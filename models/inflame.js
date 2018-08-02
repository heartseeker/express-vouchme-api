const mongoose = require('../db/mongoose');
const Schema = mongoose.Schema;

const InflameSchema = new Schema({
    from: {
        type: Schema.Types.ObjectId, ref: 'User',
        required: true,
        trim: true,
    },
    to: {
        type: Schema.Types.ObjectId, ref: 'User',
        required: true,
        trim: true,
    }
});

module.exports = mongoose.model('Inflame', InflameSchema);