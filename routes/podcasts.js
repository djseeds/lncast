var express = require('express');
var crypto = require('crypto');

var podcatcher = require('podcatcher');
var lightning = require('../controllers/lightning');


var router = express.Router();

// Temporarily add a single feed
podcatcher.putFeed('NodeUp', 'http://feeds.feedburner.com/NodeUp', function(err, res) {
        if (err) console.log(err);
        });
// Temporarily add a single feed
podcatcher.putFeed('Daily Tech News Show', 'https://www.patreon.com/rss/dtns?auth=WQVIk-pJyPUuJcu2EDSoqZwhNJoSA7-8', function(err, res) {
        if (err) console.log(err);
        });

/* GET all podcasts. */
router.get('/podcasts', function(req, res, next) {
    podcatcher.getDB(function(err, results) {
        if (err) console.log(err);
        var podcasts = [];
        results.forEach(function(podcast) {
            podcasts.push({
                name: podcast["key"],
            });
        });
        res.json(podcasts);
    });
});

/* GET podcast */
router.get('/podcast/:podcastName', function (req, res, next){
    podcastName = decodeURIComponent(req.params['podcastName']);
    podcatcher.getFeed(podcastName, function (err, results) {
        if (err) {
            next(err);
            return;
        }
        podcatcher.getAll(results, function(err, meta, articles) {
            if (err) {
                next(err);
                return;
            }
            articles.forEach(function(article, i, articles){
                articles[i].hash = crypto.createHash('md5').update(article['guid']).digest('hex')
            });
            res.json(articles);
        });
    });
});

// GET single podcast episode page
router.get('/podcast/:podcastName/:episodeHash', function (req, res, next) {
    episode = {
        podcast: decodeURIComponent(req.params['podcastName']),
        hash: decodeURIComponent(req.params['episodeHash']),
    }
    episodeStr = episode.podcast + "/" + episode.hash;

    // Get episode from feed
    podcatcher.getFeed(episode.podcast, function (err, results) {
            if (err) {
                next(err);
                return;
            }
        podcatcher.getAll(results, function(err, meta, articles) {
            if (err) {
                next(err);
                return;
            }
            // Check if episode exists
            var i = articles.findIndex(function(article) {
                // Hash guid, compare against query
                hash = crypto.createHash('md5').update(article['guid']).digest('hex')
                return hash == episode.hash;
            });

            if(i >= 0) { 
                // Episode exists
                if(articles[i]["summary"]){
                    episode.summary = articles[i].summary;
                    episode.title = articles[i].title;
                }
                else{
                    episode.summary = articles[i]["itunes:summary"]["#"];
                }
                if(req.session.episodes && req.session.episodes.indexOf(episodeStr) >= 0) {
                    // Send over the link!
                    episode.link = articles[i].link;
                    res.json(episode);
                }
                else {
                    // User has not paid for episode
                    // 402
                    res.status(402).json(episode);
                }
            }
            else {
                // Episode does not exist in feed
                // 404
                var err = new Error('Not Found');
                err.status = 404;
                next(err);
                return;
            }
        });
    });
});


module.exports = router;
