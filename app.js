const express = require('express');
const app = express();
const port = process.env.PORT || 8000;
const routes = require('./routes/routes');
const path = require('path');

app.use("/images", express.static(path.resolve(__dirname, 'public/uploads')));

// configure app to use bodyParser() as middleware
app.use(express.json());

// app.use('/images', express.static(__dirname + '/public/uploads'))
// app.use(express.static(path.join(__dirname, 'public/uploads')));
// app.use(express.static(__dirname + '/public'));

app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'PUT, DELETE, GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'x-auth, X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
});

app.get('/', (req, res) => {
    return res.status(200).send('This is the root of my express application');
});

// api route
// ==============================================
app.use('/api', routes);


app.listen(port, () => {
    console.log('listening on port: ' + port);
});