var express = require('express');
var request = require('request');

var lightning = require('../controllers/lightning');
var db = require('../controllers/database');
var sessionCtrl = require('../controllers/session');


var router = express.Router();


// GET new payment request
router.get('/buy/:enclosureID', function (req, res, next) {
    response_data = {
        pubkey: lightning.getPubKey(),
        hostname: req.headers.host,
    };
            // If enclosure does not exist in database, return 404
    db.Enclosure.findById(req.params.enclosureID).exec(function(err, enclosure) {
        if(err) {
            var err = new Error('Not found.');
            err.status = 404;
            return next(err);
        }
        // If already purchased, return 400 error, Bad Request
        if(sessionCtrl.purchased(req, req.params.enclosureID)){
            var err = new Error('Bad Request.');
            err.status = 400;
            return next(err);
        }
        // If invoice pending, return pending invoice
        var pendingInvoice = sessionCtrl.getPendingInvoice(req, req.params.enclosureID);
        if(pendingInvoice){
            response_data.invoice = pendingInvoice;
            res.json(response_data);
        }
        else {
            // Get parent episode
            db.Episode.findOne({"enclosure": enclosure._id}, function(err, episode){
                if(err || !episode){
                    //500 Error
                    var err = new Error('Server Error.');
                    err.status = 500;
                    return next(err);
                }
                db.getEnclosurePrice(enclosure._id, function(err, priceUSD){
                    if(err){
                        //500 Error
                        var err = new Error('Server Error.');
                        err.status = 500;
                        return next(err);
                    }

                    //Convert price to satoshis
                    request({
                        url:'https://blockchain.info/tobtc' ,
                        qs:{
                            currency: 'USD',
                            value: priceUSD,
                        }}, function(err, response, body){
                            if(err){
                                //500 Error
                                var err = new Error('Server Error.');
                                err.status = 500;
                                return next(err);
                            }
                            var priceSat = Number(body) * 100000000;
                            // Create invoice
                            lightning.addInvoice(priceSat, episode.title, function(err, invoice){
                                if(err){
                                    return next(err);
                                }
                                // Add to pending invoices
                                sessionCtrl.addPendingInvoice(req, invoice, req.params.enclosureID);
                                //
                                // Return invoice info
                                response_data.invoice = invoice;
                                response_data.price = {
                                    satoshis: priceSat,
                                    usd: priceUSD,
                                };
                                res.json(response_data);
                                lightning.emitter.on(invoice.payment_request, function(invoice){
                                    if(invoice.settled){
                                        sessionCtrl.removePendingInvoice(req, invoice);
                                        sessionCtrl.addPurchased(req, req.params.enclosureID);
                                        db.payOwnerOfEnclosure(req.params.enclosureID, invoice.value);
                                    }
                                });

                            })


                        })
                });

            });
        }
    });
});



module.exports = router;
