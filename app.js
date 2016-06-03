
var express = require('express');

var exphbs = require('express-handlebars');
var net = require('net');
var exploais = require('exploais');
var decoder = new exploais.textDecoder();

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var fs = require('fs');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var ais_stream = config.ais_stream;

var str = "";
var dataReceived = false;

app.engine('html', exphbs({extname:'html'}));
app.set('view engine', 'hbs');
app.use('/static', express.static(__dirname + '/'));
app.use('/public', express.static(__dirname + '/public/'));
app.use('/socket.io', express.static(__dirname + '/socket.io/lib/'));


app.get('/', function(req, res){
  res.render('shipmapper.html');
});
server.listen(1337);

setInterval(function() {
  if (!dataReceived) {
    console.log("idle too long. trying to reconnect");
    try {
      aisStream.destroy();
      aisStream.connect(ais_stream.port, ais_stream.url, function() {
        console.log('Connected to bitway');
      }); 
    }
    catch(err) {
      console.error(err);
    }
  }
  dataReceived = false;
}, 60000);

var aisStream = new net.Socket();
console.log("connecting to stream");
aisStream.connect(ais_stream.port,ais_stream.url, function() {
  console.log('...Connected to stream');
});


aisStream.on('data', function(data) {
  console.log(data.toString());
  dataReceived = true;
  for (var i = 0; i < data.length; i++) {
    str += String.fromCharCode(data[i]);
    if (data[i] == 10) {
      console.log("decoding: " + str.toString());
      //var splitData = data.toString().split('\n');
      //for (var i = 0; i < splitData.length; i++) {
      //  if (splitData[i].length === 0) {
      //    continue;
      //  }
      io.emit('ship_data', decoder.decode(str));
      str = "";
    }
  }
});
