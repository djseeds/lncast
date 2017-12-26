var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var httpsRedirect = require('express-https-redirect');

var podcasts = require('./routes/podcasts');
var lightning = require('./routes/lightning');

var app = express();

// Enable express sessions
app.use(session({
    secret: require('crypto').randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
}));

app.use(express.static('public'));

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Redirect to https
app.use('*', httpsRedirect());

app.use('/api', podcasts);
app.use('/api/lightning', lightning)



// Default error handler
app.use(function(err, req, res, next) {
    // render the error page
    res.status(err.status || 500).send(err || "Internal server error");
});

app.get('*', function(req, res) {
    res.sendFile('./public/index.html');
});

module.exports = app;
