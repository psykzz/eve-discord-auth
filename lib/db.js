'use strict';
var MongoClient = require( 'mongodb' ).MongoClient;
var _db;

var config = require('../config');

module.exports = {
  connectToServer: function( callback ) {
    MongoClient.connect( config.MONGO_URL, function( err, db ) {
      _db = db;
      return callback( err );
    } );
  },

  getDb: function() {
    return _db;
  }
};
