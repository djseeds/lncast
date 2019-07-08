const express = require('express');
const session = require('express-session');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const httpsRedirect = require('express-https-redirect');
const cron = require('node-cron');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const podcasts = require('./routes/podcasts');
const rss = require('./routes/rss');
const account = require('./routes/account');
const db = require('./controllers/database');
const sessionCtrl = require('./controllers/session');
const createSwaggerMiddleware = require('swagger-express-middleware');

// Refresh all podcasts every 15 minutes.
cron.schedule('*/15 * * * *', db.refreshAll);
db.refreshAll();

const app = express();

const swaggerFile = path.join(__dirname, '/api/swagger.yaml');
const swaggerDocument = YAML.load(swaggerFile);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

createSwaggerMiddleware(swaggerFile, app, (err, middleware) => {
  app.use(
      middleware.metadata(),
      middleware.files(),
      middleware.parseRequest(),
      middleware.validateRequest(),
  );

  // Enable express sessions
  app.use(session({
    secret: 'keyboard cat',
    //    secret: require('crypto').randomBytes(64).toString('hex'),
    resave: false,
    saveUninitialized: true,
    cookie: {maxAge: 3600000},
  }));

  app.use(require('prerender-node'));

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(db.User.createStrategy());
  passport.serializeUser(db.User.serializeUser());
  passport.deserializeUser(db.User.deserializeUser());

  app.use(express.static('public'));
  app.use('/node_modules/qrcode-generator',
      express.static(__dirname + '/node_modules/qrcode-generator'));
  app.use('/node_modules/angular-qrcode',
      express.static(__dirname + '/node_modules/angular-qrcode'));
  app.use('/node_modules/ngclipboard',
      express.static(__dirname + '/node_modules/ngclipboard'));

  app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  app.use(cookieParser());
  app.use(express.static(path.join(__dirname, 'public')));

  // Redirect to https
  app.use('*', httpsRedirect());

  app.use('/api', podcasts);
  app.use('/rss', rss);
  app.use('/api/account', account);

  app.post('/api/account/register', function(req, res, next) {
    db.User.register(new db.User({username: req.body.username}),
        req.body.password, function(err, account) {
          if (err) {
            console.log(err);
            return next(err);
          }
          passport.authenticate('local')(req, res, function() {
            sessionCtrl.synchronizeSession(req);
            res.redirect('/');
          });
        });
  });

  app.post('/api/account/login', passport.authenticate('local'),
      function(req, res) {
        sessionCtrl.synchronizeSession(req);
        res.redirect('/');
      });

  app.post('/api/account/logout', function(req, res) {
    sessionCtrl.resetSession(req);
    req.logout();
    res.redirect('/');
  });

  // Default error handler
  app.use(function(err, req, res, next) {
    console.log(err);
    res.status(err.status || 500).send(err || 'Internal server error');
  });

  app.get('*', function(req, res) {
    res.sendFile(__dirname + '/public/index.html');
  });
});

module.exports = app;
