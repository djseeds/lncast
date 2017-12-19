var express = require('express');
var router = express.Router();
var podcatcher = require('podcatcher');

podcatcher.putFeed('NodeUp', 'http://feeds.feedburner.com/NodeUp', function(err, res) {
    if (err) console.log(err);
    console.log(res);
})

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
            console.log(articles[0])
            res.render('episodes', {header: req.params["podcastName"], episodes: articles});
        });
    });
});

router.get('/:podcastName/:episodeTitle', function (req, res) {
    podcatcher.getFeed(req.params['podcastName'], function (err, results) {
        if (err) console.log(err);
        podcatcher.getAll(results, function(err, meta, articles) {
            if (err) console.log(err);
            articles.forEach(function(article){
                if (article["title"] === decodeURIComponent(req.params["episodeTitle"])) {
                    res.render('player', {header: req.params['podcastName'], header2: article["title"], link: article["link"]});
                }
            });
        });
    });
});

module.exports = router;
