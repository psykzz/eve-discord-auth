'use strict';
var debug = require("debug")("BATBot:Discord");

var async = require('async');
var request = require('superagent');
var Discord = require("discord.js");
var client = new Discord.Client();

var mongo = require('../db');
var config = require('../../config');

var corpRole;
var allianceRole;

client.on('ready', () => {
  debug(`Logged in.`);
  client.user.setUsername("BATBot")
     .then(user => debug(`Updated username: ${user.username}`))
     .catch(err => debug(`Error updating username: ${err}`));


});

client.on('message', msg => {
  if (msg.channel.type === 'dm') {
    debug(`(Private) ${msg.author.username}: ${msg.content}`);
  } else {
    debug(`(${msg.guild.name} / ${msg.channel.name}) ${msg.author.username}: ${msg.content}`);
  }
});

client.on('message', msg => {
  if(/^!auth$/.test(msg.content)) {
    return msg.reply('Visit <url>');
  }
  var matches = /^!auth ([-a-zA-Z0-9]+)$/.exec(msg.content);
  if(matches && matches[1]) {
    // Find roles
    corpRole = msg.guild.roles.find("name", config.DISCORD_CORP_ROLE);
    allianceRole = msg.guild.roles.find("name", config.DISCORD_ALLIANCE_ROLE);
    if(!corpRole && !allianceRole) {
      return msg.reply("no roles defined, for corp or alliance.");
    }
    // Handle adding role and removing token
    handleToken(matches[1], (err, account) => {
      if(err) {
        return msg.reply(`Invalid code: ${matches[1]}`);
      }

      async.waterfall([
        function removeExistingUserRoles(cb) {
          var eve = mongo.getDb().collection('eve');
          eve.findOne({charId: account.charId}, (err, item) => {
            if(item && item.discordId) {
              var existingUser = msg.guild.members.get(item.discordId);
              var _;
              _ = (corpRole) ? existingUser.removeRole(corpRole) : null;
              _ = (allianceRole) ? existingUser.removeRole(allianceRole) : null;
            }
          });
          cb();
        },
        function getUserData(cb) {
          var url = `https://crest-tq.eveonline.com/characters/${account.charId}/`;
          request
            .get(url)
            .end(cb);
        },
        function parseReq(req, cb) {
          var data = req.body;
          cb(null, {
            corp: data.corporation.id === config.EVE_CORP_ID,
            alliance: false/*data.corporation.id === config.EVE_CORP_ID*/
          });
        },
        function addCorpRole(user, cb) {
          if(user.corp) {
            debug(`Adding corp role to ${msg.member}`);
            msg.member.addRole(corpRole);
          }
          cb(null, user);
        },
        function addAllianceRole(user, cb) {
          if(user.alliance) {
            debug(`Adding alliance role to ${msg.member}`);
            msg.member.addRole(allianceRole);
          }
          cb();
        }
      ], (err) => {
        if(err) {
          return msg.reply(err);
        }
        var eve = mongo.getDb().collection('eve');
        eve.update({charId: account.charId}, {$set:{discordId: msg.author.id}});
        return msg.reply("auth successful");
      });
    });
  }
});

function handleToken(token, callback) {
  var eve = mongo.getDb().collection('eve');
  eve.findOne({authToken: token}, (err, item) => {
    if(err || !item) {
      debug(err, item);
      return callback(err || true);
    }
    eve.update({authToken: token}, {$set:{authToken: null}});
    return callback(null, item);
  });
}


module.exports = client;
