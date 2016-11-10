var twilio = require('twilio');
var config = require('../config');
var chrono = require('chrono-node');
var mongoose = require('mongoose');
var moment = require('moment');
var request = require('request');
var querystring = require('querystring');

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

UserSchema = new Schema({
  name:String,
  number:String
});

var Reminder = mongoose.model('Reminder', ReminderSchema);
var User = mongoose.model('User', UserSchema);

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

function photoParse(response) {

  request({
      headers: {
        'Ocp-Apim-Subscription-Key': '708e44803f7d4b86b5c988d9c7816f3a'
      },
      uri: 'https://api.projectoxford.ai/vision/v1.0/ocr?language=unk&detectOrientation=true',
      body: "{'url':'https://api.twilio.com/2010-04-01/Accounts/AC9da8e02953dc14e2cf46f01c513f5592/Messages/MM79d849214fc1d4f0a59ba93f13fd6e21/Media/ME6054833a65fa309940aa464fb47ecac3'}",
      method: 'POST'
    }, function (err, res, body) {

      var json = JSON.parse(body);
      traverse(json,process);
      console.log(words);
      var parsedFromPhoto = chrono.parseDate(words);
      console.log(parsedFromPhoto);
    });
}

function process(key,value) {
    console.log(key + " : "+value);
    if (key == "text") {
      words += value + " ";
    }
}

// Handle a POST request from Twilio
exports.receiveMessageWebhook = function(request, response) {
  var message = request.body.Body;
  console.log(request);
  var parsedTime = chrono.parseDate(message);
  var parsedTimeLocal = moment(parsedTime).format(' dddd MMM DD, h:mm a ');
  var parsedMessage = message.split(" ");


  
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

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
