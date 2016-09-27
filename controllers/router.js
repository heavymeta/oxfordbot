var home = require('./home');
var message = require('./message');
var voice = require('./voice');
var voip = require('./voip');
var basic = require('../middleware/basic-auth');

// Map routes to controller functions
module.exports = function(app) {
    // Render home page
    app.get('/', home.show);

    // Routes for messaging examples
    app.get('/message/send', message.showSendMessage);
    app.post('/message/send', basic, message.sendMessage);
    app.get('/message', message.showReceiveMessage);
    app.post('/message', message.receiveMessageWebhook);

    app.get('/remind', message.fireReminders);

};
