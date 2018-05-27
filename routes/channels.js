const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Channel = require('../models/channel');
const _ = require('lodash');
const authenticate = require('../middleware/authenticate');


// list of all channels
router.get('/', authenticate, async (req, res) => {
    const channels = await Channel.find({ $or: [{ status: 1 }, { user: req.user._id }] });
    res.send(channels);
});

// Creating a channel
router.post('/', authenticate , async (req, res) => {
    let channel = new Channel({name: req.body.name, user: req.user._id});
    try {
        channel = await channel.save();
    } catch (err) {
        res.status(400).send(err);
    }
    res.send(_.pick(channel, ['id', 'name', 'user']));
});

router.delete('/:id', authenticate, async (req, res) => {
    const id = req.params.id;
    try {
        const channel = await Channel.remove({ _id: id, user: req.user._id })
        if (!channel) throw 'Bad Request';
    } catch(err) {
        return res.status(400).send(err);
    }
    res.send();
});

module.exports = router;