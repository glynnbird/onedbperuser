var api_user = "glynn_bird",
   api_key = "EneZ8sGR925eTQvlKqCs",
   template_id = "864f7bcf-fa52-4c2a-832d-7d3f2d20d8c4",
  from = "glynn@cloudant.com";
var sendgrid  = require('sendgrid')(api_user, api_key);


var send = function(to, pin, callback) {
  var email = new sendgrid.Email({ to: to});
  var filters = { 
                  templates: {
                     settings: {
                        enable: 1,
                        template_id: template_id
                    }
                  }
                };
  email.setFilters(filters);
  email.subject=" ";
  email.setText(" ");   
  email.setFrom(from);  
  email.addSubstitution("-pin-", pin);               
  sendgrid.send(email, callback);
}

module.exports = {
  send: send
}