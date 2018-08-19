const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const _ = require('lodash');
const authenticate = require('../middleware/authenticate');
const Vouch = require('../models/vouch');
const Infame = require('../models/infame');

router.post('/', authenticate, async(req, res) => {
    const to = req.body.to;
    let v = await Vouch.findOne({ from: req.user._id, to: to});

    let i = await Infame.findOne({ from: req.user._id, to: to});

    if (i) {
        return res.status(200).send({ error: 'You already infame this person' });
    }

    // toggle vouch me to remove
    if (v) {
        try {
            const remove = await Vouch.findOneAndRemove({ from: req.user._id, to: to });
            if (!remove) {
                throw 'Fail unvouching';
            }
            return res.send({ status: false });
        } catch (err) {
            return res.status(200).send(err);
        }
    }

    v = new Vouch({ from: req.user._id, to: to });

    try {
        let save = await v.save();
        if (!save) 
            throw 'Fail saving vouch';
    } catch (err) {
        return res.status(200).send(err);
    }

    res.send({ status: true });
});

router.post('/verify', authenticate, async(req, res) => {
    const to = req.body.to;
    let v = await Vouch.findOne({ from: req.user._id, to: to});

    if (v) {
        return res.send({ status: true});
    }
    return res.send({ status: false});
});

router.get('/list', async(req, res) => {
    const to = req.query['to'];

    let vouch = await Vouch.find({ to: to})
    .populate({ 
        path: 'from',
        select: 'profile'
    });

    return res.send(vouch);
});

module.exports = router;