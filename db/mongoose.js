const mongoose = require('mongoose');

// connect to mongoose
// ==============================================
mongoose.connect('mongodb://localhost/expressvouchme')
.then(() => {
    console.log('Connect to mongodb success!');
})
.catch((err) => {
    console.log('err: ', err);
});

module.exports = mongoose;