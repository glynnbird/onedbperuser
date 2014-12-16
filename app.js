// app.js
var express = require('express'),
  app = express(),
  bodyParser = require('body-parser'),
  cloudant = require('./lib/db.js'),
  datacache = require('./lib/cache.js'),
  sms = require('./lib/sms.js'),
  email = require('./lib/email.js'),
  uuid = require('node-uuid'),
  url = require('url'),
  cors = require('cors');

// enable CORS
app.use(cors());


// sign up a new user (uniquely identified by mobile or email)
// creating a new database and assigning an api key & password for access to it
var signUp = function(mobile, email, appname, callback) {
  
  // create a hash of the mobile or the email
  var crypto = require('crypto'),
    shasum = crypto.createHash('sha1');
  if(mobile && mobile.length>0) {
    shasum.update(mobile);
  } else {
    shasum.update(email);
  }
  
  // formulate a database name
  var dbname = appname.replace(/[^A-Za-z0-9]/g,'').toLowerCase() + "_" + shasum.digest('hex');
  
  // create a new database
  cloudant.db.create(dbname, function(err, body) {

    // create an api key
    cloudant.generate_api_key(function(er, api) {
      if (er) {
        return callback(err, null);
      }
      
      // set the permissions of that key
      cloudant.set_permissions({database:dbname, username:api.key, roles:['_reader','_writer']}, function(er, result) {
        if (er) {
          return callback(err, null);
        }
        
        // return the api key, database name and hostname
        api.db = dbname;
        var parsed = url.parse(cloudant.config.url);
        api.host = parsed.host
        callback(null, api);

      })
    });
  });
};

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// need to have HTTP 200 at "/" or Bluemix reboots the service
app.get('/', function(req,res) {
  res.send({"ok": true});
})

// POST /register API call
app.post('/register', function(req, res){
  
  // check for mandatory parameters
  if(!req.body.appname) {
    return res.status(403).send({"ok": false, "msg": "Missing appname"});
  }
  if(!req.body.mobile  && !req.body.email) {
    return res.status(403).send({"ok": false, "msg": "Missing mobile or email. One must be supplied."});
  }
  
  // construct data to squirrel away in the cache
  var pin = Math.floor(Math.random()*900000 + 100000);
  var obj = {
    registration_id: "id" + uuid.v4(),
    mobile: req.body.mobile,
    email: req.body.email,
    appname: req.body.appname,
    pin: pin.toString()
  };
  
  // push a record into cach
  datacache.put(obj.registration_id, obj, function(err, data) {

    obj.ok="true";
    
    // send registraton text
    if(req.body.mobile && req.body.mobile.length>0) {
      
      // send an SMS message
      sms.send(obj.mobile, process.env.TWILIO_PHONE, "Your PIN CODE is " + obj.pin + ". Please enter the PIN into the application to register.", function(err, message) {
        console.log("SMS sent to", obj.mobile);
        var retval = JSON.parse(JSON.stringify(obj))
        delete retval.pin; // don't send the pin back in the api call
        res.send(retval);
      });
    } else {
      
      // send registration email
      email.send(req.body.email, obj.pin, function(err, data) {
        console.log("EMAIL sent to ", req.body.email);
        var retval = JSON.parse(JSON.stringify(obj))
        delete retval.pin; // don't send the pin back in the api call
        res.send(retval);
      })
      
    }
  
  });

});



// POST /signup API call
app.post('/signup', function(req, res){
  // check for mandatory parameters
  if (!req.body.registration_id) {
    return res.status(403).send({"ok": false, "msg": "Missing registration id"});
  }
  
  // retrieve object from cache
  datacache.get(req.body.registration_id, function(err, data) {
    if (err) {
      return res.status(403).send({"ok": false, "msg": "Invalid registration id"});
    }

    // if the incoming pin matches
    if (data.pin == req.body.pin) {

      // do the sign up
      signUp(data.mobile, data.email, data.appname, function(err,data) {
        if(err) {
          res.status(403).send({"ok": false, err: "Could not create user" });
        } else {
          data.ok="true";
          res.send(data);
          
          // kill the cache key
          datacache.remove(req.body.registration_id, function(err, data) {
            
          });
        }
      })

    } else {
      return res.status(403).send({"ok": false, "msg": "Invalid pin id"});
    }

  });

});

// The IP address of the Cloud Foundry DEA (Droplet Execution Agent) that hosts this application:
var host = (process.env.VCAP_APP_HOST || 'localhost');
// The port on the DEA for communication with the application:
var port = (process.env.VCAP_APP_PORT || 3000);
// Start server
app.listen(port, host);
console.log('App started on port ' + port);


