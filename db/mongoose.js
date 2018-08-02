const mongoose = require('mongoose');

// connect to mongoose
// ==============================================
mongoose.connect('mongodb://localhost/expressvouchme')
// mongoose.connect('mongodb://vouchadmin:dbvouch123@ds221228.mlab.com:21228/vouchme')
.then(() => {
    console.log('Connect to mongodb success!');
})
.catch((err) => {
    console.log('err: ', err);
});

module.exports = mongoose;