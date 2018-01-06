var express = require('express');
var db = require('../controllers/database');
var lightning = require('../controllers/lightning');

var router = express.Router();

/* GET user info. */
router.get('/', function(req, res, next) {
    if(req.isAuthenticated()){
        req.user.populate('owns', function(err, user){
            if(err){
                res.json(req.user);
            }
            else{
                res.json(user);
            }
        });
        req.user.depopulate('owns');
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
});

/* GET user info. */
router.post('/withdraw', function(req, res, next) {
    if(req.isAuthenticated()){
        var pay_req = req.body.payment_request.replace("lightning:", "");
        lightning.decodePayReq(pay_req, function(err, info){
            if(err || info.num_satoshis > req.user.balance){
                // Bad request
                res.status(400);
                res.send("Bad Request");
                return;
            }
            lightning.sendPayment(pay_req, function(err){
                if(err){
                    console.log(err);
                    // Payment error 
                    // Bad request
                    res.status(500);
                    res.send("Internal Server Error");
                    return;
                }
                // Payment successful
                db.withdraw(req.user._id, info.num_satoshis, function(err, balance){
                    if(err){
                        req.user.balance -= info.num_satoshis;
                        req.user.save();
                        balance = req.user.balance;
                    }
                    res.json({balance:balance});
                });
            });
        });
    }
    else {
        res.status(401);
        res.send("Access denied");
    }
});

module.exports = router;
