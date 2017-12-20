var express = require('express');

var podcatcher = require('podcatcher');
var lightning = require('../controllers/lightning');


var router = express.Router();

// Temporarily add a single feed
podcatcher.putFeed('NodeUp', 'http://feeds.feedburner.com/NodeUp', function(err, res) {
        if (err) console.log(err);
        console.log(res);
        });

/* GET podcast list page. */
router.get('/', function(req, res, next) {
    podcatcher.getDB(function(err, results) {
        if (err) console.log(err);
        var links = [];
        results.forEach(function(podcast) {
            links.push({ title: podcast["key"],
                path: "http://" + req.get('host') + req.originalUrl + "/" + podcast["key"]})
        });
        res.render('podcasts', {podcasts: links});
    })
});

/* GET podcast page */
router.get('/:podcastName', function (req, res){
    podcatcher.getFeed(req.params['podcastName'], function (err, results) {
        if (err) console.log(err);
        podcatcher.getAll(results, function(err, meta, articles) {
            if (err) console.log(err);
            articles.forEach(function(article, i, articles){
                articles[i]["path"] = "http://" + req.get('host') + req.originalUrl + "/" +  encodeURIComponent(articles[i]["title"]);
            });
            res.render('episodes', {header: req.params["podcastName"], episodes: articles});
        });
    });
});

// GET single podcast episode page
router.get('/:podcastName/:episodeTitle', function (req, res, next) {
    episode = {
        podcast: decodeURIComponent(req.params['podcastName']),
        title: decodeURIComponent(req.params['episodeTitle']),
    }
    episodeStr = episode.podcast + "/" + episode.title;

    // Get episode from feed
    podcatcher.getFeed(episode.podcast, function (err, results) {
        if (err) console.log(err);
        podcatcher.getAll(results, function(err, meta, articles) {
            if (err) console.log(err);
            // Check if episode exists
            var i = articles.findIndex(function(article) {
                return article.title == episode.title;
            });

            if(i >= 0) { 
                var link = articles[i].link;
                if(req.session.episodes && req.session.episodes.indexOf(episodeStr) >= 0) {
                    // User has paid for episode
                    res.render('player', {header: episode.podcast, header2: episode.title, link: link});
                }
                else{
                    console.log(req.session);
                    console.log(req.sessionID);
                    // User has not paid for episode
                    // Generate invoice
                    // Subscibe invoice
                    // 402
                    console.log("Adding invoice!");
                    lightning.addInvoice(1, function(err, pay_req){
                        if(err) console.log(err);
                        // Subscribe to invoice
                        lightning.emitter.on(pay_req, function(){
                            if (!req.session.episodes) {
                                req.session.episodes = [];
                            }
                            req.session.episodes.push(episodeStr);
                            req.session.save();
                        })
                    });
                    var err = new Error('Payment Required');
                    err.status = 402;
                    next(err);
                }

            }
            else {
                // Episode does not exist in feed
                // 404
                var err = new Error('Not Found');
                err.status = 404;
                next(err);
            }
        });
    });
});

module.exports = router;
