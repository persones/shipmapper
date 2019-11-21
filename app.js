var express = require('express');

var exphbs = require('express-handlebars');
var net = require('net');
var exploais = require('../exploais/exploais');
var decoder = new exploais.createValDecoder();

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var fs = require('fs');

var db;

var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/shipdataharvester', {useNewUrlParser: true, useUnifiedTopology: true});

const SHIP_TYPE_ALL = -1;
const SHIP_TYPE_UNDEFINED = 0;
const SHIP_TYPE_CARGO = 1;
const SHIP_TYPE_TANKER = 2;
const SHIP_TYPE_TUG_PILOT = 3;
const SHIP_TYPE_PASSENGER = 4;
const SHIP_TYPE_COMMERCIAL = 5;
const SHIP_TYPE_PRIVATE = 6;
const SHIP_TYPE_MILITARY = 7;
const SHIP_TYPE_GOVERNMENT = 8;
const SHIP_TYPE_OTHER = 9;
const SHIP_TYPE_AMERICAS_CUP = 10;

const shipTypeId = {
  // America's Cup types
  1: SHIP_TYPE_AMERICAS_CUP,		// Racing yacht
  2: SHIP_TYPE_AMERICAS_CUP,		// Committee boat
  3: SHIP_TYPE_AMERICAS_CUP,		// Mark
  4: SHIP_TYPE_AMERICAS_CUP,		// Pin
  5: SHIP_TYPE_AMERICAS_CUP,		// Chase boat
  6: SHIP_TYPE_AMERICAS_CUP,		// undefined AC vessel
  7: SHIP_TYPE_AMERICAS_CUP,		// Umpire boat
  8: SHIP_TYPE_AMERICAS_CUP,		// Port gate
  9: SHIP_TYPE_AMERICAS_CUP,		// Starboard gate

  20: SHIP_TYPE_OTHER,		// Wing in ground (WIG), all ships of this type
  21: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Hazardous category A
  22: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Hazardous category B
  23: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Hazardous category C
  24: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Hazardous category D
  25: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Reserved for future use
  26: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Reserved for future use
  27: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Reserved for future use
  28: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Reserved for future use
  29: SHIP_TYPE_OTHER,		// Wing in ground (WIG), Reserved for future use
  30: SHIP_TYPE_COMMERCIAL,	// Fishing
  31: SHIP_TYPE_TUG_PILOT,	// Towing
  32: SHIP_TYPE_TUG_PILOT,	// Towing: length exceeds 200m or breadth exceeds 25m
  33: SHIP_TYPE_COMMERCIAL,	// Dredging or underwater ops
  34: SHIP_TYPE_COMMERCIAL,	// Diving ops
  35: SHIP_TYPE_MILITARY,	// Military Ops
  36: SHIP_TYPE_PRIVATE,		// Sailing
  37: SHIP_TYPE_PRIVATE,		// Pleasure Craft
  38: SHIP_TYPE_OTHER,	// Reserved
  39: SHIP_TYPE_OTHER,		// Reserved

  40: SHIP_TYPE_PASSENGER,	// High speed craft (HSC), all ships of this type
                      // NOTE: i've identified these as high-speed ferries
  41: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Hazardous category A
  42: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Hazardous category B
  43: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Hazardous category C
  44: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Hazardous category D
  45: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Reserved for future use
  46: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Reserved for future use
  47: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Reserved for future use
  48: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), Reserved for future use
  49: SHIP_TYPE_COMMERCIAL,	// High speed craft (HSC), No additional information

  50: SHIP_TYPE_TUG_PILOT,	// Pilot Vessel
  51: SHIP_TYPE_GOVERNMENT,	// Search and Rescue vessel
  52: SHIP_TYPE_TUG_PILOT,	// Tug
  53: SHIP_TYPE_OTHER,		// Port Tender
  54: SHIP_TYPE_GOVERNMENT,	// Anti-pollution equipment
  55: SHIP_TYPE_GOVERNMENT,	// Law Enforcement
  56: SHIP_TYPE_OTHER,		// Spare - Local Vessel
  57: SHIP_TYPE_OTHER,		// Spare - Local Vessel
  58: SHIP_TYPE_GOVERNMENT,	// Medical Transport
  59: SHIP_TYPE_MILITARY,	// Ship according to RR Resolution No. 18
                      // NOTE: i've identified this as military medical (thx to google)

  60: SHIP_TYPE_PASSENGER,	// Passenger, all ships of this type
  61: SHIP_TYPE_PASSENGER,	// Passenger, Hazardous category A
  62: SHIP_TYPE_PASSENGER,	// Passenger, Hazardous category B
  63: SHIP_TYPE_PASSENGER,	// Passenger, Hazardous category C
  64: SHIP_TYPE_PASSENGER,	// Passenger, Hazardous category D
  65: SHIP_TYPE_PASSENGER,	// Passenger, Reserved for future use
  66: SHIP_TYPE_PASSENGER,	// Passenger, Reserved for future use
  67: SHIP_TYPE_PASSENGER,	// Passenger, Reserved for future use
  68: SHIP_TYPE_PASSENGER,	// Passenger, Reserved for future use
  69: SHIP_TYPE_PASSENGER,	// Passenger, No additional information
  70: SHIP_TYPE_CARGO,		// Cargo, all ships of this type
  71: SHIP_TYPE_CARGO,		// Cargo, Hazardous category A
  72: SHIP_TYPE_CARGO,		// Cargo, Hazardous category B
  73: SHIP_TYPE_CARGO,		// Cargo, Hazardous category C
  74: SHIP_TYPE_CARGO,		// Cargo, Hazardous category D
  75: SHIP_TYPE_CARGO,		// Cargo, Reserved for future use
  76: SHIP_TYPE_CARGO,		// Cargo, Reserved for future use
  77: SHIP_TYPE_CARGO,		// Cargo, Reserved for future use
  78: SHIP_TYPE_CARGO,		// Cargo, Reserved for future use
  79: SHIP_TYPE_CARGO,		// Cargo, No additional information

  80: SHIP_TYPE_TANKER,		// Tanker, all ships of this type
  81: SHIP_TYPE_TANKER,	// Tanker, Hazardous category A
  82: SHIP_TYPE_TANKER,	// Tanker, Hazardous category B
  83: SHIP_TYPE_TANKER,		// Tanker, Hazardous category C
  84: SHIP_TYPE_TANKER,		// Tanker, Hazardous category D
  85: SHIP_TYPE_TANKER,		// Tanker, Reserved for future use
  86: SHIP_TYPE_TANKER,		// Tanker, Reserved for future use
  87: SHIP_TYPE_TANKER,		// Tanker, Reserved for future use
  88: SHIP_TYPE_TANKER,		// Tanker, Reserved for future use
  89: SHIP_TYPE_TANKER,		// Tanker, No additional information

  90: SHIP_TYPE_OTHER,		// Other Type, all ships of this type
  91: SHIP_TYPE_OTHER,		// Other Type, Hazardous category A
  92: SHIP_TYPE_OTHER,		// Other Type, Hazardous category B
  93: SHIP_TYPE_OTHER,		// Other Type, Hazardous category C
  94: SHIP_TYPE_OTHER,		// Other Type, Hazardous category D
  95: SHIP_TYPE_OTHER,		// Other Type, Reserved for future use
  96: SHIP_TYPE_OTHER,		// Other Type, Reserved for future use
  97: SHIP_TYPE_OTHER,		// Other Type, Reserved for future use
  98: SHIP_TYPE_OTHER,		// Other Type, Reserved for future use
  99: SHIP_TYPE_OTHER,		// Other Type, No additional information
};

var Schema = mongoose.Schema;

var shipSchema = new Schema({
  name:  String,
  mmsi: Number,
  imo: Number,
  callsign:   String,
  shipType: Number,
  shipTypeId: Number,
  lastUpdate: { type: Date, default: Date.now },
});

var navUpdateSchema = new Schema(
  {
    mmsi: Number,
    time: { type: Date, default: Date.now },
    hour: Number,
    lat: Number,
    lon: Number,
    rot: Number,
    sog: Number,
    cog: Number,
    heading: Number,
    status: Number,
    draught: Number,
    eta: Number,
    dest: String
  }, 
  { collection: 'navUpdates' }
);

var Ship = mongoose.model('Ship', shipSchema);
var NavUpdate = mongoose.model('NavUpdate', navUpdateSchema);

var config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
var ais_stream = config.ais_stream;

var str = "";
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
	socket.on("close", () => {
		numClients--;
		delete clients[socket.key];
	});
});

app.get('/stats', function(req, res) {
  db.stats()
  .then(data => { res.send(data) })
  .catch(err => {
     res.send(err);
     console.log(err); 
    }
  );
});

setInterval(function() {
  if (!dataReceived) {
    console.log("idle too long. trying to reconnect");
    try {
      aisStream.destroy();
      aisStream.connect(ais_stream.port, ais_stream.url, function() {
        console.log("connected to stream");
      }); 
    }
    catch(err) {
      console.log(err);
      console.error(err);
    }
  }
  dataReceived = false;
}, 60000);

var aisStream = new net.Socket();
console.log("trying to connect to stream...");
aisStream.connect(ais_stream.port,ais_stream.url, function() {
  console.log('Connected to stream');
});

aisStream.on('data', function(data) {
  dataReceived = true;
  for (var i = 0; i < data.length; i++) {
    str += String.fromCharCode(data[i]);
    if (data[i] == 10) {
      let decodedData = decoder.decode(str);
      io.emit('ship_data', decodedData); 
      str = "";

      if (!decodedData) {
        return;
      }

      Ship.findOne({ mmsi: decodedData.mmsi }, function (err, ship) {
        if (ship) {
          ship.lastUpdate = new Date();
        } else {
          ship = new Ship({mmsi: decodedData.mmsi});
        }

        if (decodedData.shipname && !ship.shipName) {
          let shipInfo = {
            name:  decodedData.shipname,
            imo: decodedData.imo,
            callsign:   decodedData.callsign,
            shipType: decodedData.shiptype,
            shipTypeId: shipTypeId[decodedData.shiptype],
          }
          Object.assign(ship, shipInfo);


        };        
        if (decodedData.lat) {
          let update = {
            mmsi: decodedData.mmsi,
            hour: Math.floor(new Date().getTime() / 3600000),
            lat: decodedData.lat,
            lon: decodedData.lon,
            sog: decodedData.speed,
            heading: decodedData.heading,
            status: decodedData.status,
            draught: 0,
            eta: 0,
            dest: ''
          }

          if (('turn' in decodedData) && (decodedData.turn != 'not turning')) {
            update.rot = decodedData.rot;
          } else {
            update.rot = 128;
          }

          if (decodedData.course) {
            update.cog = decodedData.course * 10;
          }


          let nav = new NavUpdate(update);
          nav.save();
        }
        
        ship.save();

      });
    }
  }
});

setInterval(() => {
  let timeCap  = new Date();
  timeCap.setDate(timeCap.getDate() - 4);
  NavUpdate.deleteMany({time: {$lt: timeCap}}, (err) => {
    if (err) {
      console.log(`delete err: ${err}`);
    }
  });
}, 1000 * 60 * 60); // one hour

// native connection, just for sizes.
const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = 'mongodb://localhost:27017';

// Database Name
const dbName = 'shipdataharvester';

// Use connect method to connect to the server
MongoClient.connect(url, function(err, client) {
  assert.equal(null, err);
  console.log("Connected successfully to server");
  db = client.db(dbName);
});  






