var express = require('express');

var lightning = require('../controllers/lightning');


var router = express.Router();

// GET new payment request
router.get('/buy/:podcastName/:episodeHash', function (req, res, next) {
    episodeStr = decodeURIComponent(req.params.podcastName) + "/" + decodeURIComponent(req.params.episodeHash);
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
            if (!req.session.episodes){
                req.session.episodes = [];
            }
            req.session.episodes.push(episodeStr);
            req.session.save();
        })
        res.json(response_data);
    })
});


module.exports = router;
