/*jslint esnext: true */
/*jslint node: true */

var express = require('express');

var exphbs = require('express-handlebars');
var net = require('net');
var exploais = require('exploais');
var decoder = new exploais.createTextDecoder();

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var fs = require('fs');

//var pasileyMonitor = require("/home/person/local_servers/paisley-mon/monlib.js")("shipmapper");

pasileyMonitor = require('monlib')('shipmapper');

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var ais_stream = config.ais_stream;

var dataReceived = false;
var clients = {};
var numClients = 0;

app.engine('html', exphbs({extname:'html'}));
app.set('view engine', 'hbs');
app.use('/static', express.static(__dirname + '/'));
app.use('/public', express.static(__dirname + '/public/'));
app.use('/socket.io', express.static(__dirname + '/socket.io/lib/'));


app.get('/', function(req, res){
  res.render('shipmapper.html');
});
server.listen(1337);
server.on("connection", (socket) => {
	socket.key = socket.remoteAddress + ":" + socket.remotePort;
  clients[socket.key] = socket;
	numClients++;
	pasileyMonitor.message("clients: " + numClients);
	socket.on("close", () => {
		numClients--;
		pasileyMonitor.message("clients: " + numClients);
		delete clients[socket.key];
	});
});

setInterval(function() {
  if (!dataReceived) {
    pasileyMonitor.log("idle too long. trying to reconnect");
    try {
      aisStream.destroy();
      aisStream.connect(ais_stream.port, ais_stream.url, function() {
        pasileyMonitor.message("connected to stream");
      }); 
    }
    catch(err) {
      pasileyMonitor.log(err);
      console.error(err);
    }
  }
  dataReceived = false;
}, 60000);

var aisStream = new net.Socket();
pasileyMonitor.message("connectig to stream");
aisStream.connect(ais_stream.port,ais_stream.url, function() {
  pasileyMonitor.message('Connected to stream');
});

aisStream.on('data', function(data) {
  dataReceived = true;
  var splitData = data.toString().split('\n');
  for (var i = 0; i < splitData.length; i++) {
    if (splitData[i].length === 0) {
      continue;
    }
    var decodedData = decoder.decode(splitData[i]);
    if (decodedData) {
      io.emit('ship_data', decodedData);
    }
  }
});
