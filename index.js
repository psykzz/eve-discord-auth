'use strict';
var debug = require("debug")("BATBot:index");
var web = require('./lib/web');
var bot = require('./lib/discord');
var db = require('./lib/db');
var config = require('./config');
require('heroku-self-ping')(config.APP_URL);


db.connectToServer((err) => {
  if(err) {
    return;
  }

  bot.login(config.DISCORD_TOKEN);
  web.listen(config.LISTEN_PORT, () => {
    debug(`Listening on port ${config.LISTEN_PORT}!`);
  });
});
