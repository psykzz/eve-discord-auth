'use strict';
var debug = require("debug")("BATBot:Web");
var path = require('path');

var express = require('express');
var session = require('express-session');
var app = express();

var passport = require('passport');
var EveOnlineStrategy = require('passport-eve').Strategy;
var shortid = require('shortid');
var async = require('async');

var mongo = require('../db');

var config = require('../../config');

app.use('/', express.static(path.join(__dirname, 'public')));
app.use(passport.initialize());

passport.use(new EveOnlineStrategy({
    clientID: config.SSO_CLIENT_ID,
    clientSecret: config.SSO_SECRET_KEY,
    callbackURL: config.SSO_CALLBACK_URL,
    scope: "publicData"
  },
  function(accessToken, refreshToken, profile, done) {
    debug(accessToken, refreshToken, profile);
    var db = mongo.getDb();
    var eve = db.collection('eve');

    async.waterfall([
      function findUser(cb) {
        eve.findOne({charId: profile.characterID}, (err, item) => {
          debug("findUser", err, item);

          if (err) {
            debug("No user found", err);
            cb(null, false);
          }
          debug("Found user", item);
          cb(null, item);
        });
      },
      function createUserIfNeeded(user, cb) {
        debug("createUserIfNeeded", user);
        var token = shortid.generate();
        var isNew = false;

        if(!user) {
          isNew = true;
          debug('Creating new user object');

          user = {
            authToken: token,
            accessToken: accessToken,
            refreshToken: refreshToken,
            charId: profile.characterID,
            name: profile.characterName,
          };

        }
        else {
          debug('Updating user token');
          user.authToken = token;
        }

        cb(null, user, isNew);
      },
      function addUser(user, isNew, cb) {
        if(isNew) {
          debug("Inserting new user in db", user);
          eve.insert(user, {w:1}, cb);
        }
        else {
          debug("Updating user in db", {charId: user.charId}, {authToken: user.authToken});
          eve.update({charId: user.charId}, {$set:{authToken: user.authToken}}, {w: 1}, (err, item) => {
            cb(err, user);
          });
        }
      }
    ], (err, results) => {
      debug(err, results);
      done(err, results);
    });
  }
));

// Auth
app.get('/auth', passport.authenticate('eve_online'));
app.get('/auth/success', function(req, res) {
  res.send(`Login with \`!auth ${req.query.token}\``);
});
app.get('/auth/callback', passport.authenticate('eve_online', {
  failureRedirect: '/auth/failed',
  session: false
}),
function(req, res) {
  res.redirect("/auth/success?token=" + req.user.authToken);
});

// Temp
app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

app.get('/invite', (req, res) => {
  res.redirect('https://discordapp.com/oauth2/authorize?client_id=284331013440667648&scope=bot&permissions=0');
});


module.exports = app;
