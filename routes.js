var express = require('express');
var router = express.Router();

var db = require('./db').getDb();
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var bcrypt = require('bcrypt');

passport.use('login', new LocalStrategy(function(username, password, done) {
  if (username.length > 20 && password.length > 20) {
    return done(null, false);
  }
  return db.collection('credentials').findOne({'username': username})
  .then(function(user) {
    if (!user) {
      return done(null, false);
    }
    bcrypt.compare(password, user.password)
    .then(function(res) {
      if (!res) {
        return done(null, false);
      }
      return done(null, user);
    });
  });
}));

router.get('/views/:filename', function(req, res, next) {
  return res.render(req.params.filename);
})

.post('/login', function(req, res, next) {
  return passport.authenticate('login', function(err, user, info) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).send();
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.status(200).send();
    });
  })(req, res, next);
})

.post('/signup', function(req, res, next) {
  if (req.body.username.length > 20 && req.body.password.length > 20) {
    return res.status(400).send();
  }
  return db.collection('credentials').findOne({'username': req.body.username})
  
  .then(function(user) {
    if (user) {
      return res.status(400).send();
    }
    return bcrypt.hash(req.body.password, 12);
  })
  
  .then(function(hash) {
    var newUser = {
      'username': req.body.username,
      'password': hash
    };
    return db.collection('credentials').insertOne(newUser);
  })
  
  .then(function() {
    return res.status(200).send();
  });
})

.post('/logout', function(req, res, next) {
  if (req.isAuthenticated()) {
    req.logout();
    return res.status(200).send();
  }
  return res.status(401).send();
})

.post('/authenticated', function(req, res, next) {
  if (req.isAuthenticated()) {
    return res.status(200).send(true);
  }
  return res.status(200).send(false);
})

.get('*', function(req, res, next) {
  return res.render('layout');
});

module.exports = router;
