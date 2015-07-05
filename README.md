# vow-telegram-bot
```sh
npm install vow-telegram-bot
```

```js
var VowTelegramBot = require('vow-telegram-bot'),
    bot = new VowTelegramBot({
        token: 'TELEGRAM_BOT_TOKEN',
        polling: {
            timeout: 3,
            limit: 100
        }
    });

bot.on('message', function(message) {

    var from = message.from;

    console.log(from.first_name + ' ' + from.last_name + ': ' + message.text);

    bot.sendMessage({
        chat_id: message.chat.id,
        text: 'Test message from bot'
    });

});
```

```js
var VowTelegramBot = require('vow-telegram-bot'),
    bot = new VowTelegramBot({
        token: 'TELEGRAM_BOT_TOKEN',
        polling: {
            timeout: 3,
            limit: 100
        }
    });

bot.on('message', function(message) {

    bot.sendChatAction({
        chat_id: message.chat.id,
        action: 'upload_photo'
    });

    setTimeout(function() {
        bot.sendPhoto({
            chat_id: message.chat.id,
            photo: 'example.png',
            caption: 'Photo from bot'
        });
    }, 5000);

});
```

# API
See https://core.telegram.org/bots/api

## getUpdates([params], [onSuccess], [onError])
Use this method to receive incoming updates using long polling. An Array of Update objects is returned.

See https://core.telegram.org/bots/api#getupdates

## getMe([onSuccess], [onError])
A simple method for testing your bot's auth token. Requires no parameters.

See https://core.telegram.org/bots/api#getme

## sendMessage(params, [onSuccess], [onError])
Use this method to send text messages.

See https://core.telegram.org/bots/api#sendmessage

## forwardMessage(params, [onSuccess], [onError])
Use this method to forward messages of any kind.

See https://core.telegram.org/bots/api#forwardmessage

## sendPhoto(params, [onSuccess], [onError])
Use this method to send photos.

See https://core.telegram.org/bots/api#sendphoto

## sendAudio(params, [onSuccess], [onError])
Use this method to send audio files, if you want Telegram clients to display the file as a playable voice message. For this to work, your audio must be in an .ogg file encoded with OPUS (other formats may be sent as Document). Bots can currently send audio files of up to 50 MB in size, this limit may be changed in the future.

See https://core.telegram.org/bots/api#sendaudio

## sendDocument(params, [onSuccess], [onError])
Use this method to send general files. Bots can currently send files of any type of up to 50 MB in size, this limit may be changed in the future.

See https://core.telegram.org/bots/api#senddocument

## sendSticker(params, [onSuccess], [onError])
Use this method to send .webp stickers.

See https://core.telegram.org/bots/api#sendsticker

## sendVideo(params, [onSuccess], [onError])
Use this method to send video files, Telegram clients support mp4 videos (other formats may be sent as Document). Bots can currently send video files of up to 50 MB in size, this limit may be changed in the future.

See https://core.telegram.org/bots/api#sendvideo

## sendLocation(params, [onSuccess], [onError])
Use this method to send point on the map.

See https://core.telegram.org/bots/api#sendlocation

## sendChatAction(params, [onSuccess], [onError])
Use this method when you need to tell the user that something is happening on the bot's side. The status is set for 5 seconds or less (when a message arrives from your bot, Telegram clients clear its typing status).

See https://core.telegram.org/bots/api#sendchataction

## getUserProfilePhotos(params, [onSuccess], [onError])
Use this method to get a list of profile pictures for a user.

See https://core.telegram.org/bots/api#getuserprofilephotos
