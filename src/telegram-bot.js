var EventEmitter = require('events').EventEmitter,
    debug = require('debug')('vow-telegram-bot'),
    inherit = require('inherit'),
    request = require('request'),
    vow = require('vow'),
    url = require('url'),
    fs = require('fs');

var VowTelegramBot = inherit(EventEmitter, {

    __constructor: function(options) {

        if (!options.token) {
            debug('No token for telegram bot api');
            throw new Error('Telegram Bot Token is required parameter!');
        }

        var _this = this;

        this._url = (options.url || 'https://api.telegram.org/bot') + options.token + '/';
        this._request = request.defaults({
            json: true,
            agent: options.agent,
        });

        if (options.webhook && options.webhook.url) {
            this._configureWebhook(options.webhook)
                .then(function(result) {
                    debug('_configureWebhook done: %j', result);
                    if (result && options.webhook.port) {
                        debug('Try to start WebHook server');
                        _this._configureWebhookListener(options.webhook);
                    } else {
                        debug('No listener');
                        throw new Error('Can\'t configure webhook');
                    }
                })
                .fail(function(result) {
                    throw new Error('Can\'t configure webhook');
                });
        } else if (options.polling) {
            // Remove webhook
            this.setWebhook({ url: '' })
                .then(function() {
                    _this._offset = 0;
                    debug('Start polling at init')
                    _this.polling(options.polling);
                })
        }

    },

    _apiMethods: {
        sendDocument: { gzip: true, file: 'document' },
        sendSticker: { gzip: true, file: 'sticker' },
        sendPhoto: { gzip: true, file: 'photo' },
        sendAudio: { gzip: true, file: 'audio' },
        sendVideo: { gzip: true, file: 'video' }
    },

    /**
     * @param {Object} params
     * @param {Number} params.url
     * @param {Function} [onSuccess]
     * @param {Function} [onError]
     */
    setWebhook: function(params, onSuccess, onError) {
        return this._processRequest('setWebhook', arguments);
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

        this._makeRequest('getUpdates', {
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
     * Use this method to send answers to the inline query. On success, True is returned.
     * @param {String} inline_query_id - Unique identifier for answered query
     * @param {InlineQueryResult[]} results - Results of inline query
     * @param {Boolean} [is_media] - Pass True, if results must be treated as media files
     * @param {Integer} [cache_time] - Maximal time, result of the inline query may be cached on the server
     * @param {Boolean} [is_personal] - Pass True, if results can be cached on the server side only for the user sent inline query. By default result can be returned to any user, searched for the same query
     * @param {String} [next_offset] - Pass offset that client should send with next inline query with the same text to receive more results, pass empty string, if there is no more results or pagination is not supported. Its length can't exceed 64 bytes.
     */
    answerInlineQuery: function(params) {
        return this._processRequest('answerInlineQuery', arguments);
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

    getFile: function(params) {
        return this._processRequest('getFile', arguments);
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

    _processQuery: function(query) {
        debug('Inline query: %j', query);
        this.emit('inline_query', query);
    },

    _processMessage: function(message) {

        var nameRE = new RegExp('(@' + this.username + ')', 'gi');

        // TODO: move it
        message.text && (message.text = message.text.replace(nameRE, '').trim());
        this.emit('message', message);

    },

    polling: function(options) {
        this._pollingTimeout = options && options.timeout || 3;
        this._pollingLimit = options && options.limit || 100;
        this._startPolling();
    },

    telegramRequest: function(req, res, onSuccess, onError) {

        var _this = this,
            message, cq;

        debug('telegramRequest start');

        this._processTelegramRequest(req, res)
            .then(function(update) {
                message = update.message;
                cq = update.inline_query;
                message && _this._processMessage(message);
                cq && _this._processQuery(cq);
            })
            .fail(function(error) {
                debug('_processTelegramRequest rejected');
            });

    },

    /**
     * @param {Object} options
     * @param {String} options.url
     * @param {String} [options.key]
     * @param {String} [options.cert]
     * @param {String} [options.port] - if no port, use telegramRequest to process messages
     */
    _configureWebhook: function(options) {
        this._webhookPath = url.parse(options.url).path;
        return this.setWebhook({ url: options.url });
    },

    _configureWebhookListener: function(options) {

        debug('Start _configureWebhookListener with options=%j', options);

        this._onWebHookError = options.onError;

        if (options.key && options.cert && fs.existsSync(options.key) && fs.existsSync(options.cert)) {
            this._hookServer = require('https').createServer({
                key: fs.readFileSync(options.key),
                cert: fs.readFileSync(options.cert)
            }, this.telegramRequest.bind(this));
        } else {
            this._hookServer = require('http').createServer(this.telegramRequest.bind(this));
        }

        this._hookServer.listen(options.port, options.host, function () {
            debug('WebHook listening on port %s', options.port);
        });

    },

    _processTelegramRequest: function(req, res) {

        debug('Process request [%s] %s', req.method, req.url);

        var defer = vow.defer(),
            onWebHookError = this._onWebHookError,
            hasErrorCB = typeof onWebHookError === 'function',
            body = '';

        if (req.url === this._webhookPath && req.method === 'POST') {
            debug('Process request [%s] %s', req.method, req.url);
            req
                .on('data', function (chunk) {
                    body += chunk.toString();
                })
                .on('end', function() {
                    try {
                        debug('Try process request with body: %j', body);
                        defer.resolve(JSON.parse(body || '{}'));
                    } catch(e) {
                        debug(e);
                        defer.reject(e);
                    }
                    res.end('OK');
                });
        } else {
            if (hasErrorCB) {
                onWebHookError(req, res);
                defer.resolve();
            } else {
                debug('Skip request [%s] %s', req.method, req.url);
                res.statusCode = 401;
                res.end();
                defer.reject('Skip request [' + req.method + '] ' + req.url);
            }
        }

        return defer.promise();

    },

    _startPolling: function() {

        var _this = this;

        debug('Start polling with timeout=%s, limit=%s, offset=%s', this._pollingTimeout, this._pollingLimit, this._offset);

        this.getMe()
            .then(function (data) {
                console.log('Hi! My name is %s', data.username);
                _this.username = data.username;
                _this.id = data.id;
                debug('Everything is ok, current bot is [%s] %s', data.id, data.username);
                _this._polling();
            })
            .fail(function(data) {
                debug('getMe error, check your token: [%s] %s', data.description, data.error_code);
                debug('Trying to start polling after 1s...');
                setTimeout(_this._startPolling.bind(_this), 1000);
            });

    },

    _polling: function() {

        var _this = this,
            message, cq;

        this.getUpdates()
            .then(function(updates) {
                debug('[getUpdates] messages count: %s', updates ? updates.length : 0);
                for (var i = 0, l = updates.length; i < l; i++) {
                    message = updates[i].message;
                    cq = updates[i].inline_query;
                    message && _this._processMessage(message);
                    cq && _this._processQuery(cq);
                }
                _this._polling();
            })
            .fail(function(res) {
                debug('[getUpdates] failed: %j', res);
                _this._polling();
            });

    },

    _processRequest: function(method, params) {

        var args = [method],
            keys = Object.keys(params);

        for (var i = 0, l = keys.length; i < l; i++) {
            args.push(params[keys[i]]);
        }

        return this._makeRequest.apply(this, args);

    },

    _makeRequest: function(method, params, onSuccess, onError) {

        if (params) {
            debug('[%s] params: %j', method, params);
        } else {
            debug('[%s] no params', method);
        }

        this.emit('request', { method: method, params: params });

        var defer = vow.defer(),
            action = this._apiMethods[method] || {},
            options = {
                url: this._url + method
            },
            files = params && params[action.file],
            index = 0,
            isURL;

        if (method === 'answerInlineQuery' || method === 'setWebhook') {
            options.body = params;
        }

        if (action.file) {
            debug('[%s] Detecting file field format', method);
            if (fs.existsSync(params[action.file])) {
                // Local file
                debug('[%s] Local file %s is exists', method, params[action.file]);
                try {
                    params[action.file] = fs.createReadStream(params[action.file]);
                } catch (e) {}
            } else if (params.base64) {
                // Base64-encoded file
                debug('[%s] base64-encoded file', method);
                params.isFile = true;
                params[action.file] = new Buffer(params[action.file], 'base64');
            } else {
                // URL
                debug('[%s] File is URL', method);
                isURL = true;
            }
        }

        action.gzip && (options.gzip = action.gzip);

        debug('[%s] Try to make a request to telegram with options: %j', method, options);
        debug('[%s] Try to make a request to telegram with action: %j', method, action);

        if (isURL) {
            debug('[%s] Try to upload file and make a request to telegram', method);
            this._tryRequest(defer, index, {
                params: params,
                action: action,
                options: options,
                files: files,
                onSuccess: onSuccess,
                onError: onError
            })
        } else {
            debug('[%s] Try to make a request to telegram', method);
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

        debug('[_tryRequest] Started');
        this._requestExternalFiles(deferExternals, files, index)
            .then(function(res) {
                debug('[_tryRequest] Request external files done, try to make a request to telegram');
                params[action.file] = new Buffer(res.data);
                params.isFile = true;
                _this._requestAPI(options, params, action, onSuccess, onError)
                    .then(function(res) {
                        debug('[_tryRequest] Request to telegram API done');
                        defer.resolve(res);
                    })
                    .fail(function(res) {
                        debug('[_tryRequest] Request to telegram API rejected: %j', res);
                        if ((files instanceof Array) && index < files.length - 1) {
                            debug('[_tryRequest] But we have more files to try :)');
                            _this._tryRequest(defer, index, ext);
                        } else {
                            debug('[_tryRequest] And we have no more files to try :(');
                            defer.reject(res);
                        }
                    });
            })
            .fail(function(res) {
                debug('[_tryRequest] Request external files rejected: %j', res);
                defer.reject(res);
            });

        return defer.promise();
    },

    _requestAPI: function(options, params, action, onSuccess, onError) {

        var defer = vow.defer();

        debug('[_requestAPI] Start');

        try {

            var r = this._request.post(options, function(err, msg, res) {
                if (err) {
                    debug('[_requestAPI] options: %j', options);
                    debug('[_requestAPI] Error: %j', err);
                }
                if (res && res.ok) {
                    debug('[_requestAPI] Done: %j', res);
                    typeof onSuccess === 'function' && onSuccess(res.result);
                    defer.resolve(res.result);
                } else {
                    debug('[_requestAPI] Failed: %j', res);
                    typeof onError === 'function' && onError(res);
                    defer.reject(res);
                }
            });

            if (params && !options.body) {
                var form = r.form();
                for (var i in params) {
                    if (params.hasOwnProperty(i) && i !== 'base64' && i !== 'isFile') {
                        form.append(i, params[i], params.isFile && i === action.file ? { filename: 'image.jpg' } : undefined);
                    }
                }
            }

        } catch (e) {
            debug('[_requestAPI] Exception: %j', e);
            defer.reject({ status: 'error', exception: e });
        }

        return defer.promise();

    },

    _requestExternalFiles: function(defer, urls, index) {

        urls instanceof Array || (urls = [urls]);

        var _this = this;

        debug('[_requestExternalFiles] Try to load external files, count: %s', urls.length);

        this._requestFile(urls[index])
            .then(function(res) {
                debug('[_requestExternalFiles] File downloaded successfully: %s', urls[index]);
                defer.resolve(res);
            })
            .fail(function(res) {
                debug('[_requestExternalFiles] File not downloaded: %s', urls[index]);
                index++;
                if (urls[index]) {
                    debug('[_requestExternalFiles] But we have more files, try: %s', index);
                    _this._requestExternalFiles(defer, urls, index);
                } else {
                    debug('[_requestExternalFiles] And we have no more files');
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
            debug('[_requestFile] Start: %s', url);
            req = this._request({ url: url, timeout: 400 })
                .on('data', function(chunk) {
                    data = Buffer.concat([data, chunk]);
                })
                .on('end', function(res) {
                    debug('[_requestFile] File downloaded: %s', url);
                    defer.resolve({ status: 'ok', url: url, data: data });
                })
                .on('error', function(err) {
                    debug('[_requestFile] File download failed: %s', url);
                    defer.reject({ status: 'error', url: url, error: err });
                });
        } catch (e) {
            debug('[_requestFile] Exception: %j', e);
            defer.reject({ status: 'error', error: 'Unknown exception', exception: e });
        }

        return defer.promise();

    }

});

module.exports = VowTelegramBot;
