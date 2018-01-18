var express = require('express');
var crypto = require('crypto');
var lightning = require('../controllers/lightning');
var db = require('../controllers/database');
var sessionCtrl = require('../controllers/session');

var router = express.Router();

/* GET all podcasts. */
router.get('/podcasts', function(req, res, next) {
    db.Podcast.find({}, function(err, podcasts) {
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
    db.Podcast.findById(req.params.podcastID)
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

/* POST (update) podcast */
router.post('/podcast/:podcastID', function (req, res, next){
    if(req.isAuthenticated() && req.user.owns.findIndex(function(id){
        console.log("findIndex");
        return id.toString() == req.params.podcastID;
    }) != -1) {
        db.Podcast.findById(req.params.podcastID, function(err, podcast){
            if(err){
                return next(err);
            }
            if(!podcast){
                res.status(404);
                res.send("Not Found");
                return;
            }
            if(req.body && req.body.price){
                podcast.price = req.body.price;
            }
            podcast.save();
            res.send("OK");
        })
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
});

/* DELETE podcast */
router.delete('/podcast/:podcastID', function (req, res, next){
    if(req.isAuthenticated() && req.user.owns.findIndex(function(id){
        return id.toString() == req.params.podcastID;
    }) != -1) {
        console.log("Deleting");
        db.Podcast.removeById(req.params.podcastID, function(err){
            if(err){
                console.log(err);
                return next(err);
            }
            res.send("OK");
        })
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
})

// GET single podcast episode page
router.get('/podcast/:podcastID/:episodeID', function (req, res, next) {
    db.Podcast.findById(req.params.podcastID)
        .exec(function(err, podcast) {
        if(err) {
            next(err);
        }
        else {
            db.Episode.findById(req.params.episodeID)
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


// GET podcast link
router.get('/enclosure/:enclosureID', function (req, res, next) {
    // Check if enclosure exists in db
    db.Enclosure.findById(req.params.enclosureID)
        .exec(function(err, enclosure) {
            if(err) {
                var err = new Error('Not found.');
                err.status = 404;
                return next(err);
            }
            else {
                // If user has paid for episode content
                purchased = (sessionCtrl.purchased(req, req.params.enclosureID));
                if (purchased || enclosure.price == 0) {
                    // User has paid for episode content
                    // or episode is free.
                    res.json(enclosure);
                }
                else {
                    // Payment required.
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
        db.addPodcast(req.body.feed, req.body.price, function(err, podcast){
            if(err){
                console.log(err);
                return next(err);
            }
            res.json(podcast);
            req.user.owns.push(podcast._id);
            req.user.save();
        });
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
})


module.exports = router;
