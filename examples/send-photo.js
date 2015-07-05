var settings = require('./settings'),
    VowTelegramBot = require('../index'),
    bot = new VowTelegramBot(settings);

bot.on('message', function(message) {

    var from = message.from;

    console.log(from.first_name + ' ' + from.last_name + ': ' + message.text);

    bot.sendChatAction({
        chat_id: message.chat.id,
        action: 'upload_photo'
    });

    setTimeout(function() {
        bot.sendPhoto({
            chat_id: message.chat.id,
            photo: 'example.png',
            caption: 'Photo from bot'
        }).then(function(message) {
            console.log('Photo sent', message);
        });
    }, 5000);

});
