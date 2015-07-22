var EventEmitter = require('events').EventEmitter,
    inherit = require('inherit'),
    request = require('request'),
    vow = require('vow'),
    fs = require('fs');

var apiMethods = {
        sendPhoto: {
            gzip: true,
            file: 'photo'
        },
        sendAudio: {
            gzip: true,
            file: 'audio'
        },
        sendDocument: {
            gzip: true,
            file: 'document'
        },
        sendSticker: {
            gzip: true,
            file: 'sticker'
        },
        sendVideo: {
            gzip: true,
            file: 'video'
        }
    };

request = request.defaults({ json: true });

var VowTelegramBot = inherit(EventEmitter, {

    __constructor: function(options) {
        if (!options.token) {
            throw new Error('Telegram Bot Token is required parameter!');
        }

        this._offset = 0;
        this._url = 'https://api.telegram.org/bot' + options.token + '/';
        //this._webhook = options.webhook;

        this._apiMethods = apiMethods;

        if (options.polling) {
            this.polling(options.polling);
        }

        // this._configureWebHookServer();

    },

    polling: function(options) {
        this._pollingTimeout = options && options.timeout || 3;
        this._pollingLimit = options && options.limit || 100;
        this._startPolling();
    },

    /**
     * Use this method to receive incoming updates using long polling. An Array of Update objects is returned.
     * @param {Object} [params]
     * @param {Number} [params.timeout]
     * @param {Number} [params.limit]
     * @param {Number} [params.offset]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    getUpdates: function(params, onSuccess, onError) {

        var defer = vow.defer(),
            _this = this,
            timeout,
            offset,
            limit;

        if (params) {
            timeout = params.timeout;
            limit = params.limit;
            offset = params.offset;
        }

        this._request('getUpdates', {
                timeout: timeout || this._pollingTimeout,
                limit: limit || this._pollingLimit,
                offset: offset || this._offset + 1
            })
            .then(function(result) {
                var last = result[result.length - 1]
                last && (_this._offset = last.update_id);
                typeof onSuccess === 'function' && onSuccess(result);
                defer.resolve(result);
            })
            .fail(function(result) {
                typeof onError === 'function' && onError(result);
                defer.reject(result);
            });

        return defer.promise();

    },

    /**
     * A simple method for testing your bot's auth token. Requires no parameters. Returns basic information about the bot in form of a User object.
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    getMe: function() {
        return this._processRequest('getMe', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {String} params.text
     * @param {Boolean} [params.disable_web_page_preview]
     * @param {Number} [params.reply_to_message_id]
     * @param {ReplyKeyboardMarkup|ReplyKeyboardHide|ForceReply} [params.reply_markup]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendMessage: function(params) {
        return this._processRequest('sendMessage', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {Number} params.from_chat_id
     * @param {Number} params.message_id
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    forwardMessage: function(params) {
        return this._processRequest('forwardMessage', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {InputFile|String} params.photo
     * @param {String} [params.caption]
     * @param {Number} [params.reply_to_message_id]
     * @param {ReplyKeyboardMarkup|ReplyKeyboardHide|ForceReply} [params.reply_markup]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendPhoto: function(params) {
        return this._processRequest('sendPhoto', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {InputFile|String} params.audio
     * @param {Number} [params.reply_to_message_id]
     * @param {ReplyKeyboardMarkup|ReplyKeyboardHide|ForceReply} [params.reply_markup]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendAudio: function(params) {
        return this._processRequest('sendAudio', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {InputFile|String} params.document
     * @param {Number} [params.reply_to_message_id]
     * @param {ReplyKeyboardMarkup|ReplyKeyboardHide|ForceReply} [params.reply_markup]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendDocument: function(params) {
        return this._processRequest('sendDocument', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {InputFile|String} params.sticker
     * @param {Number} [params.reply_to_message_id]
     * @param {ReplyKeyboardMarkup|ReplyKeyboardHide|ForceReply} [params.reply_markup]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendSticker: function(params) {
        return this._processRequest('sendSticker', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {InputFile|String} params.video
     * @param {Number} [params.reply_to_message_id]
     * @param {ReplyKeyboardMarkup|ReplyKeyboardHide|ForceReply} [params.reply_markup]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendVideo: function(params) {
        return this._processRequest('sendVideo', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {Number} params.latitude
     * @param {Number} params.longitude
     * @param {Number} [params.reply_to_message_id]
     * @param {ReplyKeyboardMarkup|ReplyKeyboardHide|ForceReply} [params.reply_markup]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendLocation: function(params) {
        return this._processRequest('sendLocation', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.chat_id
     * @param {String} params.action (typing for text messages, upload_photo for photos, record_video or upload_video for videos, record_audio or upload_audio for audio files, upload_document for general files, find_location for location data)
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    sendChatAction: function(params) {
        return this._processRequest('sendChatAction', arguments);
    },

    /**
     * @param {Object} params
     * @param {Number} params.user_id
     * @param {Number} [params.offset]
     * @param {Number} [params.limit]
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    getUserProfilePhotos: function(params) {
        return this._processRequest('getUserProfilePhotos', arguments);
    },

    _processMessages: function(messages) {

        var nameRE = new RegExp('(@' + this.username + ')', 'gi'),
            message;

        for (var i = 0, l = messages.length; i < l; i++) {
            message = messages[i].message;
            if (message) {
                // TODO: move it
                message.text && (message.text = message.text.replace(nameRE, '').trim());
                this.emit('message', message);
            }
        }

    },

    _startPolling: function() {

        var _this = this;

        this.getMe()
            .then(function (data) {
                console.log('Hi! My name is %s', data.username);
                _this.username = data.username;
                _this.id = data.id;
                _this._polling();
            })
            .fail(function(data) {
                console.log(
                    data.description
                        ? data.description + ' [' + data.error_code + ']'
                        : 'Unknown error. Check your token.'
                );
                setTimeout(_this._startPolling.bind(_this), 1000);
            });

    },

    _polling: function() {

        var _this = this;
        this.getUpdates()
            .then(function(messages) {
                _this._processMessages(messages);
                _this._polling();
            })
            .fail(function() {
                _this._polling();
            });

    },

    _processRequest: function(method, params) {

        var args = [method],
            keys = Object.keys(params);

        for (var i = 0, l = keys.length; i < l; i++) {
            args.push(params[keys[i]]);
        }

        return this._request.apply(this, args);

    },

    _request: function(method, params, onSuccess, onError) {

        var defer = vow.defer(),
            action = this._apiMethods[method] || {},
            options = {
                url: this._url + method
            },
            files = params && params[action.file],
            index = 0,
            isURL;

        if (action.file) {
            if (fs.existsSync(params[action.file])) {
                // Local file
                try {
                    params[action.file] = fs.createReadStream(params[action.file]);
                } catch (e) {}
            } else if (params.base64) {
                // Base64-encoded file
                params.isFile = true;
                params[action.file] = new Buffer(params[action.file], 'base64');
            } else {
                // URL
                isURL = true;
            }
        }

        action.gzip && (options.gzip = action.gzip);
        action.headers && (options.headers = action.headers);

        if (isURL) {
            this._tryRequest(defer, index, {
                params: params,
                action: action,
                options: options,
                files: files,
                onSuccess: onSuccess,
                onError: onError
            })
        } else {
            this._requestAPI(options, params, action, onSuccess, onError)
                .then(function(res) {
                    defer.resolve(res);
                })
                .fail(function(res) {
                    defer.reject(res);
                });
        }

        return defer.promise();

    },

    _tryRequest: function(defer, index, ext) {
        var params = ext.params,
            action = ext.action,
            options = ext.options,
            files = ext.files,
            onSuccess = ext.onSuccess,
            onError = ext.onError,
            deferExternals = vow.defer(),
            _this = this;

        this._requestExternalFiles(deferExternals, files, index)
            .then(function(res) {
                params[action.file] = new Buffer(res.data);
                params.isFile = true;
                _this._requestAPI(options, params, action, onSuccess, onError)
                    .then(function(res) {
                        defer.resolve(res);
                    })
                    .fail(function(res) {
                        if ((files instanceof Array) && index < files.length - 1) {
                            _this._tryRequest(defer, index, ext);
                        } else {
                            defer.reject(res);
                        }
                    });
            })
            .fail(function(res) {
                defer.reject(res);
            });

        return defer.promise();
    },

    _requestAPI: function(options, params, action, onSuccess, onError) {

        var defer = vow.defer();

        try {

            var r = request.post(options, function(err, msg, res) {
                if (res && res.ok) {
                    typeof onSuccess === 'function' && onSuccess(res.result);
                    defer.resolve(res.result);
                } else {
                    typeof onError === 'function' && onError(res);
                    defer.reject(res);
                }
            });

            if (params) {
                var form = r.form();
                for (var i in params) {
                    if (params.hasOwnProperty(i) && i !== 'base64' && i !== 'isFile') {
                        form.append(i, params[i], params.isFile && i === action.file ? { filename: 'image.jpg' } : undefined);
                    }
                }
            }

        } catch (e) {
            defer.reject({ status: 'error', exception: e });
        }

        return defer.promise();

    },

    _requestExternalFiles: function(defer, urls, index) {

        urls instanceof Array || (urls = [urls]);

        var _this = this;

        this._requestFile(urls[index])
            .then(function(res) {
                defer.resolve(res);
            })
            .fail(function(res) {
                index++;
                if (urls[index]) {
                    _this._requestExternalFiles(defer, urls, index);
                } else {
                    defer.reject(res);
                }
            });

        return defer.promise();

    },

    _requestFile: function(url) {

        var defer = vow.defer(),
            data = new Buffer(0),
            req;

        try {
            req = request({ url: url, timeout: 400 })
                .on('data', function(chunk) {
                    data = Buffer.concat([data, chunk]);
                })
                .on('end', function(res) {
                    defer.resolve({ status: 'ok', url: url, data: data });
                })
                .on('error', function(err) {
                    defer.reject({ status: 'error', url: url, error: err });
                });
        } catch (e) {
            defer.reject({ status: 'error', error: 'Unknown exception', exception: e });
        }

        return defer.promise();

    }

});

module.exports = VowTelegramBot;
