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
    database.Podcast.find({}, function(err, podcasts) {
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
    database.Podcast.findById(req.params.podcastID/*, {"episodes.link":0}*/)
        .populate('episodes')
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
    database.Podcast.findById(req.params.podcastID)
        .exec(function(err, podcast) {
        if(err) {
            next(err);
        }
        else {
            database.Episode.findById(req.params.episodeID)
                .exec(function(err, episode) {
                    if(err) {
                        next(err);
                    }
                    else {
                        res.json({
                            episode: episode,
                            podcast: podcast,
                        });
                    }
                });
        }
    })
});

var userHasPurchasedEpisode = function(req, episodeID){
    // Check session data.
    return (req.session.purchased != undefined) && req.session.purchased.includes(episodeID);
}


// GET podcast link
router.get('/podcast/:podcastID/:episodeID/link', function (req, res, next) {
    // If user has paid for episode
    if(userHasPurchasedEpisode(req, req.params.episodeID)) {
        // User has paid for episode
        database.Episode.findById(req.params.episodeID)
            .exec(function(err, episode) {
                if(err) {
                    next(err);
                }
                else {
                    res.json(episode.link);
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
