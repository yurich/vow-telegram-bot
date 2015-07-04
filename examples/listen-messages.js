var settings = require('./settings'),
    VowTelegramBot = require('../index'),
    bot = new VowTelegramBot(settings);

bot.on('message', function(message) {

    var from = message.from;

    console.log(from.first_name + ' ' + from.last_name + ': ' + message.text);

    bot.sendMessage({
        chat_id: message.chat.id,
        text: 'Test message from bot'
    });

});
