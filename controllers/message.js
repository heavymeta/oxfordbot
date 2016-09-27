var twilio = require('twilio');
var config = require('../config');

// Create an authenticated Twilio REST API client
var client = twilio(config.accountSid, config.authToken);

// Render a form that will allow the user to send a text (or picture) message
// to a phone number they entered.
exports.showSendMessage = function(request, response) {
    response.render('sendMessage', {
        title: 'Sending Messages with Twilio'
    });
};

// Handle a form POST to send a message to a given number
exports.sendMessage = function(request, response) {
  client.messages.create({
   body: 'Hello from Node',
   to: config.myNumber,  // Text this number
   from: config.twilioNumber // From a valid Twilio number
}, function(err, message) {
   if(err) {
       console.error(err.message);
   } else {
     console.log("success");
   }
});
};

// Show a page displaying text/picture messages that have been sent to this
// web application, which we have stored in the database
exports.showReceiveMessage = function(request, response) {

};

// Handle a POST request from Twilio for an incoming message
exports.receiveMessageWebhook = function(request, response) {
  console.log(request.body.Body);
  response.send("I got it");
  client.messages.create({
   body: 'So what you\'re saying is ' + request.body.Body,
   to: config.myNumber,  // Text this number
   from: config.twilioNumber // From a valid Twilio number
}, function(err, message) {
   if(err) {
       console.error(err.message);
   } else {
     console.log("success");
   }
});
};

// Update the configured Twilio number for this demo to send all incoming
// messages to this server.
exports.configureNumber = function(request, response) {

};
