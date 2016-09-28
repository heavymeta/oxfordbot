var twilio = require('twilio');
var config = require('../config');
var chrono = require('chrono-node');
var mongoose = require('mongoose');
var moment = require('moment');

// Create an authenticated Twilio REST API client
var client = twilio(config.accountSid, config.authToken);

var Schema = mongoose.Schema;
mongoose.connect(config.mongoUrl);

ReminderSchema = new Schema({
  from:String,
  item:String,
  when:Date,
  fired:Boolean,
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
  var parsedTime = chrono.parseDate(request.body.Body);
  var parsedTimeLocal = moment(parsedTime).utcOffset('-0700').format(' dd MMM DD h:m a ');

  var myReminder = new Reminder()

  myReminder.from = "+17187558562";
  myReminder.item = request.body.Body;
  myReminder.when = chrono.parseDate(request.body.Body);
  myReminder.fired = false;
  myReminder.save(
  function(err){
    console.error("Error while saving");
  }
  );

  response.send("I got it");

  //var localTime  = moment.utc(chrono.parseDate(request.body.Body)).toDate();
  //localTime = moment(localTime).utcOffset('-0700').format('YYYY-MM-DD HH:mm:ss');
  //console.log("Local time is: " + localTime);

  client.messages.create({
   body: 'So what you\'re saying is ' + parsedTimeLocal,
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

function findReminders() {
  var foundReminders = Reminder.find({
    fired: false,
    when: { $gt: new Date() }
  })
  return foundReminders;
}

function sendReminders(reminder) {
  client.messages.create({
   body: reminder.item,
   to: reminder.from,  // Text this number
   from: config.twilioNumber // From a valid Twilio number
  }, function(err, message) {
   if(err) {
       console.error(err.message);
   } else {
     console.log("Successfully reminded: " + reminder.item);
     markSent(reminder);
   }
  });
}

function markSent(reminder) {
  Reminder.update({_id: reminder._id },{"$set":{fired:true}},{ multi: false }, function(err, affected, resp) {
   console.log(affected);
});
  console.log("Marked as sent: " + reminder._id);
}

// Run a query to determine which messages need to be sent. Send them.
exports.fireReminders = function(request, response) {
  var query = findReminders();
  query.exec(function(err,reminders){
   if(err)
      return console.log(err);
   reminders.forEach(function(reminder){
      sendReminders(reminder);
      console.log("Found: " + reminder.item);
   });
});
  //response.sendMessage(200);
};
