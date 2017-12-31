var express = require('express');

var lightning = require('../controllers/lightning');
var db = require('../controllers/database');
var sessionCtrl = require('../controllers/session');


var router = express.Router();


// GET new payment request
router.get('/buy/:enclosureID', function (req, res, next) {
    console.log("Buy");
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
            var err = new Error('Not found.');
            err.status = 404;
            return next(err);
        }
        // If invoice pending, return pending invoice
        var pendingInvoice = sessionCtrl.getPendingInvoice(req, req.params.enclosureID);
        if(pendingInvoice){
            response_data.invoice = pendingInvoice;
            res.json(response_data);
        }
        else {
            // Create invoice
            lightning.addInvoice(1, function(err, invoice){
                if(err){
                    return next(err);
                }
                // Add to pending invoices
                sessionCtrl.addPendingInvoice(req, invoice, req.params.enclosureID);
                //
                // Return invoice info
                response_data.invoice = invoice;
                res.json(response_data);
                lightning.emitter.on(invoice.payment_request, function(invoice){
                    console.log(invoice);
                    if(invoice.settled){
                        sessionCtrl.removePendingInvoice(req, invoice);
                        sessionCtrl.addPurchased(req, req.params.enclosureID);
                        db.payOwnerOfEnclosure(req.params.enclosureID, invoice.value);
                    }
                });
            })
        }
    });


});


module.exports = router;
