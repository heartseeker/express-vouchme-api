const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const _ = require('lodash');
const authenticate = require('../middleware/authenticate');
const Inflame = require('../models/inflame');
const Vouch = require('../models/vouch');

router.post('/', authenticate, async(req, res) => {
    const to = req.body.to;
    let i = await Inflame.findOne({ from: req.user._id, to: to});
    let v = await Vouch.findOne({ from: req.user._id, to: to});

    if (v) {
        return res.status(200).send({ error: 'You already vouch this person' });
    }

    // toggle Inflame me to remove
    if (i) {
        try {
            const remove = await Inflame.findOneAndRemove({ from: req.user._id, to: to });
            if (!remove) {
                throw 'Fail Inflaming';
            }
            return res.send({ status: false });
        } catch (err) {
            return res.status(200).send(err);
        }
    }

    v = new Inflame({ from: req.user._id, to: to });

    try {
        let save = await v.save();
        if (!save) 
            throw 'Fail saving Inflame';
    } catch (err) {
        return res.status(200).send(err);
    }

    res.send({ status: true });
});

router.post('/verify', authenticate, async(req, res) => {
    const to = req.body.to;
    let v = await Inflame.findOne({ from: req.user._id, to: to});

    if (v) {
        return res.send({ status: true});
    }
    return res.send({ status: false});
});

router.get('/list', async(req, res) => {
    const to = req.query['to'];

    let inflame = await Inflame.find({ to: to})
    .populate({ 
        path: 'from',
        select: 'profile'
    });

    return res.send(inflame);
});

module.exports = router;