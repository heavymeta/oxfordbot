var cfg = {};

// HTTP Port to run our web application
cfg.port = process.env.PORT || 3000;

// Username/pass to protect demo pages for this app. This application can send
// messages and make calls for your account, so we don't want just anyone doing
// it!
cfg.basic = {
    username: process.env.HTTP_BASIC_USERNAME || 'admin',
    password: process.env.HTTP_BASIC_PASSWORD || 'password'
};

// A random string that will help generate secure one-time passwords and
// HTTP sessions
cfg.secret = 'keyboard cat';

// Your Twilio account SID and auth token, both found at:
// https://www.twilio.com/user/account
//
// A good practice is to store these string values as system environment
// variables, and load them from there as we are doing below. Alternately,
// you could hard code these values here as strings.
cfg.accountSid = "AC9da8e02953dc14e2cf46f01c513f5592";
cfg.authToken = "b8e016ea151e9067e9930e90b6b88716";

// A Twilio number you control - choose one from:
// https://www.twilio.com/user/account/phone-numbers/incoming
// Specify in E.164 format, e.g. "+16519998877"
cfg.twilioNumber = "+14126936731";

// Your own mobile phone number! The app will be calling and texting you to
// test things out. Specify in E.164 format, e.g. "+16519998877"
cfg.myNumber = "+17187558562";

// MongoDB connection string - MONGO_URL is for local dev,
// MONGOLAB_URI is for the MongoLab add-on for Heroku deployment
cfg.mongoUrl = "mongodb://bday:abc123@ds011271.mlab.com:11271/heroku_1ptkn26d"

// Export configuration object
module.exports = cfg;
