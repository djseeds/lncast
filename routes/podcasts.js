var express = require('express');
var crypto = require('crypto');
var lightning = require('../controllers/lightning');
var database = require('../controllers/database');
var sessionCtrl = require('../controllers/session');

var router = express.Router();

/* GET all podcasts. */
router.get('/podcasts', function(req, res, next) {
    database.Podcast.find({}, function(err, podcasts) {
        if(err) {
            return next(err);
        }
        else {
            res.json(podcasts);
        }
    });
});

/* GET podcast */
router.get('/podcast/:podcastID', function (req, res, next){
    database.Podcast.findById(req.params.podcastID)
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

var episodeIsFree = function(episodeID){
    // User has paid for episode
    database.Episode.findById(req.params.episodeID)
        .exec(function(err, episode) {
            if(err) {
                return false;
            }
            return episode.price == 0;
        })
}


// GET podcast link
router.get('/enclosure/:enclosureID', function (req, res, next) {
    // Check if enclosure exists in database
    database.Enclosure.findById(req.params.enclosureID)
        .exec(function(err, enclosure) {
            if(err) {
                var err = new Error('Not found.');
                err.status = 404;
                return next(err);
            }
            else {
                // If user has paid for episode content
                purchased = (sessionCtrl.purchased(req, req.params.enclosureID));
                if (purchased){
                    // User has paid for episode content
                    res.json(enclosure);
                }
                else {
                    // User has not paid for episode content
                    // 402
                    var err = new Error('Payment Required');
                    err.status = 402;
                    return next(err);
                }
            }
        })
});


/* GET all podcasts. */
router.post('/add', function(req, res, next) {
    if(req.isAuthenticated()) {
        database.addPodcast(req.body.feed, req.body.price, function(err, podcast){
            if(err){
                console.log(err);
                return next(err);
            }
            res.json(podcast);
        });
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
})


module.exports = router;
