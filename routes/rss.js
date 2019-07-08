const express = require('express');
const db = require('../controllers/database');
const rssController = require('../controllers/rssController');

// eslint-disable-next-line new-cap
const router = express.Router();

router.get('/:podcastId', function(req, res, next) {
  const {userId} = req.query;
  const {podcastId} = req.params;
  if (!userId) {
    next(new Error('userId is required'));
  } else {
    db.Podcast.findById(podcastId, function(err, podcast) {
      if (err) {
        err.status = 500;
        next(err);
      } else if (!podcast) {
        res.status(404);
        res.send('Podacast Not Found');
      } else {
        db.User.findById(userId, function(err, user) {
          if (err) {
            err.status = 500;
            next(err);
          } else if (!user) {
            res.status(404);
            res.send('User Not Found');
          } else {
            rssController.generateFeed(podcast, user, function(err, rssContent) {
              if (err) {
                err.status = 500;
                next(err);
              }
              res.type('application/xml');
              res.send(rssContent);
            });
          }
        });
      }
    });
  }
});

module.exports = router;