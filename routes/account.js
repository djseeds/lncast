const express = require('express');
const db = require('../controllers/database');

// eslint-disable-next-line new-cap
const router = express.Router();

/* GET user info. */
router.get('/', function(req, res, next) {
  if (req.isAuthenticated()) {
    console.log(req.user);
    db.User.findById(req.user._id)
        .populate('owns')
        .exec(function(err, user) {
          if (err) {
            res.json(req.user);
          } else {
            res.json(user);
          }
        });
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

/* Delete User account. */
router.delete('/', function(req, res, next) {
  if (req.isAuthenticated()) {
    req.user.remove(function(err) {
      if (err) {
        return next(err);
      }
      res.send('OK');
    });
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

router.get('/subscriptions', function(req, res, next) {
  if (req.isAuthenticated()) {
    db.User.findById(req.user._id)
        .populate('subscriptions')
        .exec(function(err, user) {
          if (err) {
            return next(err);
          } else {
            res.json(user.subscriptions);
          }
        });
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

module.exports = router;
