
// parse BlueMix  configuration from environment variables, if present
var services = process.env.VCAP_SERVICES,
  credentials = null,
  client = null;
 
// load BlueMix credentials from session
if(typeof services != 'undefined') {
  services = JSON.parse(services);
  credentials = services['user-provided'][0].credentials;
} 

// Your accountSid and authToken from twilio.com/user/account
if(credentials != null) {
  var accountSid = credentials.accountSID;
  var authToken = credentials.authToken;
  client = require('twilio')(accountSid, authToken);
}
 
// send an SMS 
var send = function(to, from,  message, callback) {
  if(client== null) {
    return callback(true, null);
  }
  client.messages.create({
      body: message,
      to: to,
      from: from
  }, function(err, message) {
    console.log("SMS",err,message);
    callback(err, message);
  });
} 

module.exports = {
  send: send
}