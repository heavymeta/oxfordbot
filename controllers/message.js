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
exports.testParsing = function(r, response) {


var form = {
    url: 'https://api.twilio.com/2010-04-01/Accounts/AC9da8e02953dc14e2cf46f01c513f5592/Messages/MM79d849214fc1d4f0a59ba93f13fd6e21/Media/ME6054833a65fa309940aa464fb47ecac3'
};

var formData = querystring.stringify(form);
var contentLength = formData.length;

request({
    headers: {
      'Content-Length': contentLength,
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': '708e44803f7d4b86b5c988d9c7816f3a'
    },
    url: 'https://api.projectoxford.ai/vision/v1.0/ocr?',
    qs: {language: 'unk', detectOrientation: 'true'},
    body: form,
    method: 'POST'
  }, function (err, res, body) {
    console.log(res);
    console.log(body);
    console.log(err);
  });



}

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
            var buddy = {name: property, number: friends[property]}
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
  console.log(request);
  var parsedTime = chrono.parseDate(message);
  var parsedTimeLocal = moment(parsedTime).format(' dddd MMM DD, h:mm a ');
  var parsedMessage = message.split(" ");


  User.findOne({ 'number': request.body.From }, 'name number', function (err, person) {
    if (err) return handleError(err);
    if (!person) {
      var newUser = new User()
      newUser.number = request.body.From;
      newUser.save(
        function(err){
          console.error("Error while saving");
        }
      );
      console.log("New user created!");
      client.messages.create({
        body: 'Hi I\'m Oxfordbot! Just text in what you want to do and when, and I\'ll remind you to do it 30 mins before.',
        to: request.body.From,
        from: config.twilioNumber
        //mediaUrl: 'https://demo.twilio.com/owl.png'
      }, function(err, message) {
        if(err) {
          console.error(err.message);
        } else {
          console.log("Message sent");
        }
      });
    } else {

      if (message == "thanks" || message == "thank you") {
        client.messages.create({
          body: 'That\'s what I\'m here for :)',
          to: request.body.From,
          from: config.twilioNumber
          //mediaUrl: 'https://demo.twilio.com/owl.png'
        }, function(err, message) {
          if(err) {
            console.error(err.message);
          } else {
            console.log("Message sent");
          }
        });
      } else {
      if (parsedTimeLocal != "Invalid date") {
      // Look for buddy reminders to set
      var buddy = findBuddy(message);


      // Save the remimder

      var myReminder = new Reminder()
      myReminder.from = request.body.From;
      myReminder.item = request.body.Body;
      myReminder.when = moment(chrono.parseDate(request.body.Body)).format();
      myReminder.fired = false;

      if (buddy) {
        myReminder.buddy = buddy.name;
        myReminder.buddyNumber = buddy.number;
      }
      myReminder.save(
        function(err){
          //console.error("Error while saving");
        }
      );

      response.send("I got it");

      var expressions = [ "Cool!", "Got it!", "I'm on it.", "Ok then!" ];
      var sel = getRandomInt(0, expressions.length);

      client.messages.create({
        body: expressions[sel] + ' I\'m going to remind you on ' + parsedTimeLocal,
        to: request.body.From,
        from: config.twilioNumber
        //mediaUrl: 'https://demo.twilio.com/owl.png'
      }, function(err, message) {
        if(err) {
          console.error(err.message);
        } else {
          console.log("Message sent");
        }
      });

      if (buddy) {
        client.messages.create({
          body: 'I\'ll also text your friend, ' + buddy.name + ', and ask them to remind you 30 minutes ahead of time.',
          to: request.body.From,
          from: config.twilioNumber
          //mediaUrl: 'https://demo.twilio.com/owl.png'
        }, function(err, message) {
          if(err) {
            console.error(err.message);
          } else {
            console.log("Message sent");
          }
        });

        client.messages.create({
          body: 'Hey ' + buddy.name + '! Your friend Ian asked for you to call and remind them to do something at ' + parsedTimeLocal,
          to: buddy.number,
          from: config.twilioNumber
          //mediaUrl: 'https://demo.twilio.com/owl.png'
        }, function(err, message) {
          if(err) {
            console.error(err.message);
          } else {
            console.log("Message sent");
          }
        });

      }
    } else {
      client.messages.create({
        body: 'Whoops. Could you be a little more specific? I didn\'t get that.',
        to: request.body.From,
        from: config.twilioNumber
        //mediaUrl: 'https://demo.twilio.com/owl.png'
      }, function(err, message) {
        if(err) {
          console.error(err.message);
        } else {
          console.log("Message sent");
        }
      });
    }
  }
    }

  })
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
