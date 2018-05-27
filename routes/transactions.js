const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Transaction = require('../models/transaction');
const _ = require('lodash');
const authenticate = require('../middleware/authenticate');
const User = require('../models/user');
const Channel = require('../models/channel');
const Vouch = require('../models/vouch');


// Creating a transaction
router.post('/', authenticate, async (req, res) => {
    const payload = _.pick(req.body, ['channel', 'partner', 'url', 'status']);
    payload['origin'] = req.user.username;
    let transaction;
    
    // check if same email for partner
    if (payload.partner === req.user.username) {
        return res.status(400).send('Invalid request');
    }
    
    let partner = await User.findOne({ username: payload.partner });
    if (!partner) {
        payload['partner'] = { partner_id: null, username: payload['partner'] };
        transaction = new Transaction(payload);
        transaction = await transaction.save();
        return res.send(transaction);
    }

    payload['partner'] = { partner_id: partner.id, username: payload['partner'] };
    transaction = new Transaction(payload);

    try {
        transaction = await transaction.save();
    } catch (err) {
        return res.status(400).send(err);
    }

    return res.send(transaction);
});

// update a transaction status
router.put('/:id', authenticate , async (req, res) => {
    const id = req.params.id;
    const transaction = await Transaction.findOne({ _id: id });
    
    if (!transaction || !req.body.status) {
        return res.status(400).send('Invalid request');
    }
    
    if (transaction.partner.username !== req.user.username) {
        return res.status(401).send('Not authorized');
    }
    
    try {
        await Transaction.findOneAndUpdate({ _id: id }, { $set: { 'status': req.body.status } });
    } catch (err) {
        return res.status(400).send(err);
    }
    res.send();
});

// get all current user transactions
router.get('/', authenticate, async (req, res) => {
    let transactions = await Transaction.find({ $or: [
        { origin: req.user.username },
        { 'partner.username': req.user.username }
    ]})
    .populate('username profile')
    .populate('channel');
    // transactions = _.pick(transactions, ['_id', 'channel', 'partner', 'url', 'status', 'origin.username'])
    res.send(transactions);
});

// count all social vouches
router.get('/social', authenticate, async (req, res) => {

    const to = req.query.to;
    let user;
    try {
        user = await User.findOne({ _id: to });
        if (!user) {
            throw 'User does not exist!';
        }
    } catch (err) {
        return res.status(400).send(err);
    }
    
    const data = {};
    data['socials'] = {
        on_going: 0,
        success: 0,
        cancelled: 0
    };
    // Transaction
    const agg = [
        { $match: { $or: [{ origin: user.username }, { 'partner.username': user.username }] } },
        { $group: { _id: "$channel", count:{ $sum: 1} } }
    ];
    const socialAgg = [
        { $match: { $or: [{ origin: user.username }, { 'partner.username': user.username }] } },
        { $group: { _id: "$status", count:{ $sum: 1} } }
    ];

    const transactions = await Transaction.aggregate(agg);
    const socials = await Transaction.aggregate(socialAgg);

    socials.map(social => {
        if (social._id == 1)
            data['socials']['on_going'] = social.count;
        if (social._id == 2)
            data['socials']['success'] = social.count;
        if (social._id == 3)
            data['socials']['cancelled'] = social.count;
    });

    data['total'] = 0;

    channels = await Channel.find({ $or: [{ status: 1 }, { user: req.user._id }] });
    const p = transactions.map((v, index) => {
        const i = channels.findIndex(o => String(o._id) === String(v._id));
        transactions[index].name = channels[i].name;
        data.total += v.count;
    });

    // count number of vouches
    let vouchCount = await Vouch.count({ to:  to});
    data['vouch'] = vouchCount;

    await Promise.all(p);
    data['data'] = transactions;
    res.send(data);
});

module.exports = router;