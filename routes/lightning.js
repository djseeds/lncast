var express = require('express');

var lightning = require('../controllers/lightning');
var db = require('../controllers/database');


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
                req.session.purchased = [];
            }
            // Add episode to list of paid episodes
            req.session.purchased.push(req.params.episodeID);
            req.session.save();
            if(req.user){
                db.User.findById(req.user._id, function (err, user) {
                    if(err){
                        console.log(err);
                        return;
                    }
                    user.purchased.push(req.params.episodeID);
                    user.save()
                })
            }
        })
        res.json(response_data);
    })
});


module.exports = router;
