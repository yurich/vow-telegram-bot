var settings = require('./settings'),
    VowTelegramBot = require('../index'),
    bot = new VowTelegramBot(settings);

bot.on('context_query', function(message) {

    var from = message.from;

    console.log(from.first_name + ' ' + from.last_name + ': ' + message.query);

});
