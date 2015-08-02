var VowTelegramBot = require('../index'),
    bot = new VowTelegramBot({
        token: 'TELEGRAM_BOT_TOKEN',
        webhook: {
            url: 'https://example.com/web/hook/path',
            port: 3333 // listen http requests on port 3333 (ssl maybe configured in nginx)
        }
    });

bot.on('message', function(message) {

    var from = message.from;

    console.log(from.first_name + ' ' + from.last_name + ': ' + message.text);

    bot.sendMessage({
        chat_id: message.chat.id,
        text: 'Bot recieved message with webhook'
    }).then(function(message) {
        console.log('Message sent', message);
    });

});
