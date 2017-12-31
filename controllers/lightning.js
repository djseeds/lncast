var grpc = require('grpc');
var fs = require('fs');
var os = require('os'); var events = require('events');
var db = require('./database') 
var certPath = os.homedir() + '/.lnd/tls.cert';
var lndCert = fs.readFileSync(certPath);
var credentials = grpc.credentials.createSsl(lndCert);
var lnrpcDescriptor = grpc.load(__dirname + '/../lnd/lnrpc/rpc.proto');
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials);

var pubkey = "";
// Get node pubkey
lightning.getInfo({}, function(err, response) {
    pubkey = response.identity_pubkey;
});

emitter = new events.EventEmitter();

// Subscribe to invoice stream
var invoice_sub = lightning.subscribeInvoices({});
invoice_sub.on('data', function(invoice) {
    emitter.emit(invoice.payment_request, invoice);
})
.on('end', function() {
    // The server has finished sending
    //
})
.on('status', function(status) {
    // Process status
});

module.exports = {
    addInvoice: function(value, callback) {
        lightning.addInvoice({ value: value }, function(err, response) {
            if(err){
                callback(err, null);
                return;
            }
            invoice = new db.Invoice(response);
            console.log(invoice);
            invoice.save();
            callback(null, invoice);
        });
    },

    sendPayment: function(pay_req, callback) {
        lightning.sendPaymentSync({ payment_request: pay_req, }, function(err, response){
            if(response.payment_error){
                console.log("Error");
                err = new Error(response.payment_error);
                console.log(err);
            }
            callback(err, response);
        });
    },

    decodePayReq: function(pay_req, callback) {
        lightning.decodePayReq({ pay_req: pay_req, }, function(err, response){
            console.log("DecodePayReq:" + response);
            callback(err, response);
        });
    },
    emitter,
    getPubKey: function(){
        return pubkey;
    }
};
