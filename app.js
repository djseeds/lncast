var express = require('express');
var session = require('express-session');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var httpsRedirect = require('express-https-redirect');
var uniqueConcat = require('unique-concat');

var podcasts = require('./routes/podcasts');
var lightning = require('./routes/lightning');
var db = require('./controllers/database')

var LocalStrategy = require('passport-local').Strategy;

var app = express();

// Enable express sessions
app.use(session({
    secret: 'keyboard cat',
//    secret: require('crypto').randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 3600000 },
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

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

app.post('/register', function(req, res, next){
    db.User.register(new User({ username: req.body.username }), req.body.password, function(err, account){
        if(err) {
            console.log(err);
            next(err);
            return;
        }
        passport.authenticate('local')(req, res, function() {
            res.redirect('/');
        })
    })
});

var synchronizeSession = function(req){
    // Add newly purchased episodes to user database
    db.User.findById(req.user._id, function (err, user) {
        if(err){
            console.log(err);
            return;
        }
        if(req.session.purchased){
            user.purchased = uniqueConcat(user.purchased, req.session.purchased);
            req.session.purchased = user.purchased;
            user.save();
            req.session.save();
        }
        else {
            console.log("Not purchased")
            req.session.purchased = user.purchased;
            req.session.save();
        }
    })
}

app.post('/login', passport.authenticate('local'), function(req, res) {
    console.log("Login");
    synchronizeSession(req);
    res.redirect('/');
});

app.post('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// Default error handler
app.use(function(err, req, res, next) {
    // render the error page
    res.status(err.status || 500).send(err || "Internal server error");
});

app.get('*', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
});

module.exports = app;
