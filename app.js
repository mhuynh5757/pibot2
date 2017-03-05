var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var db = require('./db').getDb();
var session = require('express-session');
var DatastoreStore = require('@google-cloud/connect-datastore')(session);
var passport = require('passport');

var routes = require('./routes');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'public', 'views'));
app.set('view engine', 'pug');

// uncomment after placing your favicon in /public
// app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// set up session middleware so logins are persistent
app.use(session({
  store: new DatastoreStore({ dataset: db }),
  secret: '#yoloswag',
  resave: false,
  saveUninitialized: false
}));

// set up passport
app.use(passport.initialize());
app.use(passport.session());

// static files
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', routes);

// serialize and deserialize users
passport.serializeUser(function(user, done) {
  done(null, {username: user.username});
});
passport.deserializeUser(function(user, done) {
  db.runQuery(db.createQuery('Credential').filter('username', '=', user.username))
  .then(function(users) {
    return done(null, users[0][0]);
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
