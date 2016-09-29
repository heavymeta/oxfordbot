var twilio = require('twilio');
var config = require('../config');
var chrono = require('chrono-node');
var mongoose = require('mongoose');
var moment = require('moment');

var friends = { "Dan": "+17187558562", "Rachel": "+17187558562", "Sam": "+17187558562" };

// Create an authenticated Twilio REST API client
var client = twilio(config.accountSid, config.authToken);

var Schema = mongoose.Schema;
mongoose.connect(config.mongoUrl);

ReminderSchema = new Schema({
  from:String,
  item:String,
  when:Date,
  fired:Boolean,
  buddy: String,
  buddyNumber:String
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
    from: config.twilioNumber, // From a valid Twilio number
    mediaUrl: 'https://demo.twilio.com/owl.png'
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
exports.testParsing = function(request, response) {

  var message = "Ask Rachel to remind me to take the trash out tomorrow morning at 7am";
  var words = message.split(" ");

  var lastWord;

  words.forEach(function(word){
    for (var property in friends) {
      if (friends.hasOwnProperty(property)) {
        if (property == word) {
          if (lastWord == "Ask") {
            console.log("found a friend " + friends[property] + " " + property);
          }
        }
      }
    }
    lastWord = word;
  });
};

function findBuddy(message) {
  var words = message.split(" ");
  var lastWord = null;
  var foundBuddy = null;

  words.forEach(function(word){
    for (var property in friends) {
      if (friends.hasOwnProperty(property)) {
        if (property == word) {
          if (lastWord == "Ask") {
            console.log("found a friend " + friends[property] + " " + lastWord + " " + property);
            var buddy = {property: friends[property]}
            foundBuddy = buddy;
          }
        }
      }
    }
    lastWord = word;
  });
  return foundBuddy;
}

// Handle a POST request from Twilio
exports.receiveMessageWebhook = function(request, response) {
  var message = request.body.Body;
  var parsedTime = chrono.parseDate(message);
  var parsedTimeLocal = moment(parsedTime).format(' dddd MMM DD, h:mm a ');
  var parsedMessage = message.split(" ");

  // Look for buddy reminders to set
  var buddy = findBuddy(message);
  console.log ("This is your buddy " + buddy);

  // Save the remimder to the database

  var myReminder = new Reminder()
  myReminder.from = request.body.From;
  myReminder.item = request.body.Body;
  myReminder.when = moment(chrono.parseDate(request.body.Body)).format();
  myReminder.fired = false;
  myReminder.save(
    function(err){
      //console.error("Error while saving");
    }
  );

  response.send("I got it");

  client.messages.create({
    body: 'Got it. I\'m going to remind you on ' + parsedTimeLocal,
    to: config.myNumber,
    from: config.twilioNumber
    //mediaUrl: 'https://demo.twilio.com/owl.png'
  }, function(err, message) {
    if(err) {
      console.error(err.message);
    } else {
      console.log("Message sent");
    }
  });

};

// Find all the reminders that have not been sent
function findReminders() {
  console.log(moment(new Date()).format());
  var foundReminders = Reminder.find({
    fired: false,
    when: { $lt: moment().utcOffset('-0700').format() }
  })
  return foundReminders;
}

// Send reminder messages
function sendReminders(reminder) {
  client.messages.create({
    body: reminder.item,
    to: reminder.from,
    from: config.twilioNumber
  }, function(err, message) {
    if(err) {
      console.error(err.message);
    } else {
      console.log("Successfully reminded: " + reminder.item);
      markSent(reminder);
    }
  });
}

// Mark reminders as sent once they're fired.
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
