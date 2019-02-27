var express = require('express');
var crypto = require('crypto');
var db = require('../controllers/database');
var sessionCtrl = require('../controllers/session');
var twitter = require('../controllers/twitter');
var btcpay = require('../controllers/btcpay')

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
            // If user is logged in, check if they are subscribed
            if(req.user){
                console.log("IsSubscribed");
                podcast.subscribed = req.user.isSubscribed(podcast._id);
                res.json(podcast);
            }
            else{
                res.json(podcast);
            }
        }
    })
});

/* POST (update) podcast */
router.post('/podcast/:podcastID', function (req, res, next){
    if(req.isAuthenticated() && req.user.owns.findIndex(function(id){
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


// GET episode contents
router.get('/enclosure/:enclosureID', function (req, res, next) {
    db.Enclosure.findById(req.params.enclosureID).exec(function (err, enclosure) {
        if (err) {
            var err = new Error('Not found.');
            err.status = 404;
            return next(err);
        }
        var invoiceId = sessionCtrl.getInvoice(req, enclosure._id);
        // User hasn't yet purchased enclosure.
        if (invoiceId == null) {
            // First check if enclosure is free:
            enclosure.getPrice(function (err, price) {
                if (price == 0) {
                    enclosure.listen();
                    res.json(enclosure);
                }
                else {
                    // Create invoice
                    btcpay.addInvoice(enclosure, function (err, invoice) {
                        if (err) {
                            err.status = 500;
                            return next(err);
                        }
                        // Add to pending invoices
                        invoice = new db.Invoice(invoice);
                        invoice.save();
                        sessionCtrl.addInvoice(req, invoice._id, req.params.enclosureID);
                        // Return invoice info
                        res.status(402).json(invoice);
                    })
                }
            })
        }
        else {
            db.Invoice.findById(invoiceId).exec(function (err, invoice) {
                if(err) {
                    return next(err);
                }
                btcpay.getInvoice(invoice.id, enclosure, function (err, invoice) {
                    if (err) {
                        err.status = 500;
                        return next(err);
                    }
                    switch (invoice.status) {
                        case "complete":
                            // Enclosure has been paid for, so return it.
                            enclosure.listen();
                            res.json(enclosure);
                            break;
                        case "expired":
                        case "invalid":
                            // Remove existing invoice.
                            sessionCtrl.removeInvoice(req, enclosure._id);
                            // Create new invoice.
                            btcpay.addInvoice(enclosure, function (err, invoice) {
                                if (err) {
                                    err.status = 500;
                                    return next(err);
                                }
                                // Add to pending invoices
                                invoice = new db.Invoice(invoice);
                                invoice.save();
                                sessionCtrl.addInvoice(req, invoice._id, req.params.enclosureID);
                                // Return invoice info
                                response_data = invoice;
                                res.json(response_data);
                            });
                        default:
                            // Invoice is pending.
                            // Return pending invoice.
                            res.status(402).json(invoice);
                            break;
                    }

                })
            })
        }
    });

});


/* Add a podcast. */
router.post('/add', function (req, res, next) {
    if (req.isAuthenticated()) {
        if(req.body.btcPayServer == null) {
            var err = new Error("btcPayServer is required.");
            err.status = 400;
            return next(err);
        }
        else if (req.body.btcPayServer.storeId == null) {
            var err = new Error("btcPayServer.storeId is required.");
            err.status = 400;
            return next(err);
        }
        btcpay.pairClient(req.body.btcPayServer.url, req.body.btcPayServer.pairCode, function (err, merchantId) {
            if (err) {
                return next(err);
            }
            var btcPayServerInfo = {
                serverUrl: req.body.btcPayServer.url,
                storeId: req.body.btcPayServer.storeId,
                merchantCode: merchantId,
            }
            db.addPodcast(req.body.feed, req.body.price, btcPayServerInfo, function (err, podcast) {
                if (err) {
                    return next(err);
                }
                res.json(podcast);
                req.user.owns.push(podcast._id);
                req.user.save();
                twitter.announcePodcast(podcast, function (err) {
                    if (err) {
                        console.log("Failed to announce podcast!");
                        console.log(err);
                    }
                    else {
                        console.log("Successfully announced new podcast!");
                    }
                });
            });
        });
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
})

/* Subscribe to a podcast. */
router.post('/subscribe', function(req, res, next) {
    if(req.isAuthenticated()) {
        req.user.subscribe(req.body.podcast, function(err){
            if(err){
                return next(err);
            }
            res.send("OK");
        });
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
})

/* Unsubscribe to a podcast. */
router.post('/unsubscribe', function(req, res, next) {
    if(req.isAuthenticated()) {
        req.user.unsubscribe(req.body.podcast, function(err){
            console.log("Callback");
            if(err){
                return next(err);
            }
            res.send("OK");
        });
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
})

module.exports = router;
