const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user');
const Profile = require('../models/profile');
const _ = require('lodash');
const authenticate = require('../middleware/authenticate');
const nodemailer = require('nodemailer');
const multer  = require('multer');
const path = require('path');
const https = require('https');
const Email = require('email-templates');
const Social = require('../models/social');

// get current profile
router.get('/me', authenticate, (req, res) => {
    res.send(req.user);
});

// get current profile
router.get('/alex', async (req, res) => {
    res.send('TEST!!!');
});

// search user
router.get('/search', authenticate, async (req, res) => {
    let query = req.query.q;
    // if(query.indexOf(' ') >= 0){
    //     query = query.split(' ');
    // }
    // $options: 'imxs' 
    // console.log('query ==>', query);
    const users = await User.find({
        $and: [
            { $or: [
                { 'profile.first_name': { $regex: query, $options: 'ix' } },
                { 'profile.last_name': { $regex: query, $options: 'ix' } },
                { 'username': { $regex: query, $options: 'ix' } }
            ]},
            { '_id': { $ne: req.user._id } }
        ]
    });

    res.send(users);
});


// search user in public
router.get('/find', async (req, res) => {
    let query = req.query.q;

    const users = await User.find({
        $and: [
            { $or: [
                { 'profile.first_name': { $regex: query, $options: 'ix' } },
                { 'profile.last_name': { $regex: query, $options: 'ix' } },
                { 'username': { $regex: query, $options: 'ix' } }
            ]}
        ]
    });

    res.send(users);
});

// Creating a user
router.post('/', async (req, res) => {
    let user = new User(_.pick(req.body, ['username', 'password']));
    let profile = _.pick(req.body, ['first_name', 'last_name']);
    user['profile'] = profile;

    try {
        user = await user.save();
    } catch (err) {
        return res.status(400).send(err);
    }

    const id = user.id;
    const update = await User.findOneAndUpdate({_id: id}, { $set: { 'alias': id } });

    const token = user.generateAuthToken();
    return res.header('x-auth', token).send();
});

router.post('/signup', async(req, res) => {
    let userData = _.pick(req.body, ['username', 'alias', 'password']);
    const profileData = _.pick(req.body, ['first_name', 'last_name', 'middle_name', 'phone', 'address', 'region', 'zip', 'gender', 'date']);
    userData = userData;
    userData['profile'] = profileData;
    let user = new User(userData);

    try {
        user = await user.save();
        if (!user) {
            throw 'Error creating account';
        }
    } catch(err) {
        return res.status(500).send({ error: err });
    }

    if (userData.alias) {
        const id = user.id;
        const update = await User.findOneAndUpdate({_id: id}, { $set: { 'alias': id } });
    }
    
    const token = user.generateAuthToken();
    return res.header('x-auth', token).send();
});

// getting public info of a user
router.get('/:alias', async (req, res) => {
    alias = req.params.alias;
    let user;
    try {
        user = await User.findOne({alias}).select('-password');
        if (!user) throw 'User not found' 
    } catch (err) {
        res.status(404).send(err);
    }
    res.send(user);
});

// Updating a user
router.put('/', authenticate, async (req, res) => {

    let user = await User.findOne({ _id: req.user._id });

    req.body.profile['picture'] = user.profile.picture;
    req.body.profile['id1'] = user.profile.id1;
    req.body.profile['id2'] = user.profile.id2;
    req.body.profile['billing'] = user.profile.billing;

    user = await User.findOneAndUpdate(
        { _id: req.user._id}, 
        { $set: { 'profile': req.body.profile, 'alias': req.body.alias, 'username': req.body.username  } }, 
        { new: true, runValidators: true }
    );
    res.send(user);
});

// Upload ids, billing info
router.post('/upload', authenticate , async function (req, res) {

    let fileData = [];
    let fileNames = [];

    const storage = multer.diskStorage({
        destination: 'public/uploads/' + req.user._id,
        filename: function(req, file, cb) {
            fileData.push(file);
            const name = file.fieldname + '_' + Date.now() + path.extname(file.originalname);
            fileNames.push(name);
            cb(null, name);
        }
    });

    const upload = multer({
        storage: storage,
        fileFilter: function (req, file, callback) {
            var ext = path.extname(file.originalname);
            if(ext !== '.png' && ext !== '.jpg' && ext !== '.gif' && ext !== '.jpeg') {
                return callback(new Error('Only images are allowed'))
            }
            callback(null, true)
        },
        limits: {
            fileSize: 1024 * 1024
        }
    }).any();

    upload(req, res, async (err) => {
        if (err) {
            res.status(400).send('Invalid request, ' + err); 
            return;
        } else {
            let obj = {};
            let user = await User.findOne({_id: req.user._id}).select('-password');
            
            fileData.map((file, index) => {
                    // obj['profile.' + file.fieldname] = fileNames[index];
                user.profile[file.fieldname] = fileNames[index];
            });

            try {
                user = user.save();
                if (!user) {
                    throw 'Error in updating name of images'
                }
            } catch(err) {
                return res.status(400).send(err);
            }

            res.send('upload successfully');
        }
    });

})

// get social data base on id
router.get('/social/:id', authenticate, async(req, res) => {
    const id = req.params['id'];
    try {
        user = await User.findOne({ 'social._id': id }, {'social.$': 1});

        if (!user) {
            throw 'Invalid request';
        }

        return res.status(200).send(user['social'][0]);

    } catch (err) {
        return res.status(400).send(err);
    }
});


// add social info
router.post('/social', authenticate, async(req, res) => {
    let user;
    try {
        user = await User.findOne({ _id: req.user._id }).select('-password');

        if (!user) {
            throw 'Invalid request';
        }

    } catch (err) {
        return res.status(400).send(err);
    }

    const social = user['social'];
    social.push(req.body);

    try {
        user = await User.findOneAndUpdate({ _id: req.user._id }, {
            $set: { social }
        },
        { runValidators: true, new: true }).select('-password');
        if (!user) {
            throw 'Invalid request';
        }
    } catch (err) {
        return res.status(400).send(err);
    }
    
    return res.send(user);
});

// edit social info
router.put('/social/:id', authenticate, async(req, res) => {
    const id = req.params['id'];
    let user;
    try {
        user = await User.findOne({ _id: req.user._id }).select('social -_id');

        if (!user) {
            throw 'Invalid request';
        }
    } catch (err) {
        return res.status(400).send(err);
    }

    const index = user['social'].findIndex((e) => { return e._id == id });
    user['social'][index]['name'] = req.body.name;
    user['social'][index]['url'] = req.body.url;
    const social = user['social'];
    
    try {
        user = await User.findOneAndUpdate({ _id: req.user._id }, {
            $set: { social }
        },
        { runValidators: true, new: true }).select('-password');
        if (!user) {
            throw 'Invalid request';
        }
    } catch (err) {
        return res.status(400).send(err);
    }

    return res.send(user);
});

// deleting social schema
router.delete('/social/:id', authenticate, async(req, res) => {
    const id = req.params.id;
    let user = await User.findOne({ _id: req.user._id });

    const i = user.social.findIndex(o => o._id == id);
    
    if (i < 0) {
        return res.status(400).send('Bad request');
    }
    user.social.splice(i, 1);
    await user.save();
    res.send(user.social);
});

router.post('/mail', (req, res) => {
    // Generate test SMTP service account from ethereal.email
    // Only needed if you don't have a real mail account for testing
    nodemailer.createTestAccount((err, account) => {
        // create reusable transporter object using the default SMTP transport
        let transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: account.user, // generated ethereal user
                pass: account.pass // generated ethereal password
            }
        });

        // setup email data with unicode symbols
        let mailOptions = {
            from: '"Fred Foo 👻" <foo@example.com>', // sender address
            to: 'alexinformationtech@gmail.com', // list of receivers
            subject: 'Hello ✔', // Subject line
            text: 'Hello world?', // plain text body
            html: '<b>Hello world?</b>' // html body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                return console.log(error);
            }
            console.log('Message sent: %s', info.messageId);
            // Preview only available when sending through an Ethereal account
            console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
            res.send('success send mail!');
            // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
            // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
        });
    });
});

router.post('/gmail', (req, res) => {
    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: 'alex.strauss06@gmail.com',
               pass: 'yns123456'
           }
       });
    
    const mailOptions = {
        from: 'sender@email.com', // sender address
        to: 'alexinformationtech@gmail.com', // list of receivers
        subject: 'Subject of your email', // Subject line
        // html: '<p>Your html here</p>'// plain text body
        // html: require('../templates/register.htm')
    };

    // transporter.sendMail(mailOptions, function (err, info) {
    //     if(err)
    //       console.log(err)
    //     else {
    //         console.log(info);
    //         res.send('success send');
    //     }
    //  });

    const email = new Email({
        message: {
          from: 'niftylettuce@gmail.com'
        },
        // uncomment below to send emails in development/test env:
        send: true,
        // transport: transporter
        transport: {
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: 'alex.strauss06@gmail.com',
                pass: 'yns123456'
            }
        }
      });
      
      email
        .send({
          template: '../emails/registration',
          message: {
            to: 'alexinformationtech@gmail.com'
          },
          locals: {
            name: 'Elon'
          }
        })
        .then((data) => {
            console.log(data);
            res.send('success');
        })
        .catch(console.error);

});


router.post('/contact', (req, res) => {

    const name = req.body.name;
    const email = req.body.email;
    const subject = req.body.subject;
    const message = req.body.message;

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
               user: 'alex.strauss06@gmail.com',
               pass: 'yns123456'
           }
       });
    
    const mailOptions = {
        from: email, // sender address
        to: 'alexinformationtech@gmail.com', // list of receivers
        subject: subject, // Subject line
        html: message// plain text body
    };

    transporter.sendMail(mailOptions, function (err, info) {
        if(err)
          console.log(err)
        else {
            res.send({ ok: 'ok' });
        }
     });

});


router.post('/facebook', async(req, res) => {
    const data = _.pick(req.body, ['email', 'firstName', 'lastName', 'photoUrl']);
    let user = await User.findOne({ username: data.email });
    let token;
    // if already registered send token
    if (user) {
        token = user.generateAuthToken();
        return res.header('x-auth', token).send({ token });
    }

    // if not yet registered. save it to database
    user = new User({ username: data.email });
    let profile = { first_name: data.firstName, last_name: data.lastName, photo_url: data.photoUrl };
    user['profile'] = profile;

    try {
        user = await user.save({ validateBeforeSave: false });
    } catch (err) {
        return res.status(400).send(err);
    }

    const id = user.id;
    const update = await User.findOneAndUpdate({_id: id}, { $set: { 'alias': id } });

    token = user.generateAuthToken();
    return res.header('x-auth', token).send({ token });
});


module.exports = router;