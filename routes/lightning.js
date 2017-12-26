var express = require('express');

var lightning = require('../controllers/lightning');


var router = express.Router();

// GET new payment request
router.get('/buy/:podcastID/:episodeID', function (req, res, next) {
    response_data = {
        pubkey: lightning.getPubKey(),
        hostname: req.headers.host,
    }
    lightning.addInvoice(1, function(err, pay_req){
        if(err){
            next(err);
        }
        response_data.pay_req = pay_req;
        lightning.emitter.on(pay_req, function(){
            if (!req.session.purchased){
                req.session.purchased = {};
            }
            if(!req.session.purchased[req.params.podcastID]){
                req.session.purchased[req.params.podcastID] = [];
            }
            // Add episode to list of paid episodes
            req.session.purchased[req.params.podcastID].push(req.params.episodeID);
            req.session.save();
        })
        res.json(response_data);
    })
});


module.exports = router;
