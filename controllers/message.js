var twilio = require('twilio');
var config = require('../config');
var chrono = require('chrono-node');
var mongoose = require('mongoose');

// Create an authenticated Twilio REST API client
var client = twilio(config.accountSid, config.authToken);

var Schema = mongoose.Schema;
mongoose.connect(config.mongoUrl);

ReminderSchema = new Schema({
  from:String,
  item:String,
  when:Date,
});

var Reminder = mongoose.model('Reminder', ReminderSchema);

var conn = mongoose.connection;

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

  var myReminder = new Reminder()

  myReminder.from = "+17187558562";
  myReminder.item = request.body.Body;
  myReminder.when = chrono.parseDate(request.body.Body);
  myReminder.save(
  function(err){
    console.error(err.message);
  }
  );

  response.send("I got it");
  client.messages.create({
   body: 'So what you\'re saying is ' + chrono.parseDate(request.body.Body),
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

function parseAndSave(message) {
var userModel = mongoose.model('User', userSchema);
var test = new userModel({name: "test", password: "test"})

console.log("me: " + test)

test.save(function (err, test) {
  console.log("saved?")
  if (err) {
    console.log("error");
    return console.error(err);
  }
  console.log("saved!")
});
}

// Update the configured Twilio number for this demo to send all incoming
// messages to this server.
exports.configureNumber = function(request, response) {

};
