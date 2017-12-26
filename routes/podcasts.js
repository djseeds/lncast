var express = require('express');
var crypto = require('crypto');
var lightning = require('../controllers/lightning');
var database = require('../controllers/database');

var router = express.Router();

// Temporarily add constant podcasts
database.addPodcast('Daily Tech News Show', 'https://www.patreon.com/rss/dtns?auth=WQVIk-pJyPUuJcu2EDSoqZwhNJoSA7-8');
database.addPodcast('NodeUp', 'http://feeds.feedburner.com/NodeUp');

/* GET all podcasts. */
router.get('/podcasts', function(req, res, next) {
    database.Podcast.find({}, {"episodes.link":0}, function(err, podcasts) {
        if(err) {
            next(err);
        }
        else {
            res.json(podcasts);
        }
    })
});

/* GET podcast */
router.get('/podcast/:podcastID', function (req, res, next){
    database.Podcast.findById(req.params.podcastID, {"episodes.link":0})
        .exec(function(err, podcast) {
        if(err) {
            next(err);
        }
        else {
            res.json(podcast);
        }
    })
});

// GET single podcast episode page
router.get('/podcast/:podcastID/:episodeID', function (req, res, next) {
    database.Podcast.findById(req.params.podcastID, {"episodes.link":0})
        .exec(function(err, podcast) {
        if(err) {
            next(err);
        }
        else {
            res.json(podcast.episodes.id(req.params.episodeID));
        }
    })
});

// GET podcast link
router.get('/podcast/:podcastID/:episodeID/link', function (req, res, next) {
    // If user has paid for episode
    if(req.session.purchased
            && req.session.purchased[req.params.podcastID]
            && req.session.purchased[req.params.podcastID].indexOf(req.params.episodeID) >= 0) {
        // User has paid for episode
        database.Podcast.findById(req.params.podcastID)
            .exec(function(err, podcast) {
                if(err) {
                    next(err);
                }
                else {
                    res.json(podcast.episodes.id(req.params.episodeID).link);
                }
            })
    }
    else {
        // User has not paid for episode
        // 402
        var err = new Error('Payment Required');
        err.status = 402;
        next(err);
        return;
    }
});


module.exports = router;
