var mongodb = require('mongodb');
var url = 'mongodb://localhost:27017/pibot2_dev';

var _db;

module.exports = {
  connectToServer: function(callback) {
    mongodb.MongoClient.connect(url, function(err, db) {
      _db = db;
      return callback(err);
    });
  },
  getDb: function() {
    return _db;
  }
}