const fs = require('fs');
const request = require('request');

function download(uri, filename, callback) {
    request.head(uri, function(err, res, body){
      console.log('content-type:', res.headers['content-type']);
      console.log('content-length:', res.headers['content-length']);
      request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
    });
}


const url = 'https://graph.facebook.com/1862472557104491/picture?type=normal';

download(url, 'public/uploads/test.jpg', () => {
    console.log('success!');
});