var grpc = require('grpc');
var fs = require('fs');
var os = require('os');
var events = require('events');
var db = require('./database') 
// Default is ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384
// https://github.com/grpc/grpc/blob/master/doc/environment_variables.md
// Current LND cipher suites here:
// https://github.com/lightningnetwork/lnd/blob/master/lnd.go#L80
process.env.GRPC_SSL_CIPHER_SUITES = 'ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256'

var certPath = os.homedir() + '/.lnd/tls.cert';
var lndCert = fs.readFileSync(certPath);
var credentials = grpc.credentials.createSsl(lndCert);

var macaroonPath = os.homedir() + '/.lnd/admin.macaroon';
var lndMacaroon = fs.readFileSync(macaroonPath).toString("hex");
var meta = new grpc.Metadata();
meta.add('macaroon', lndMacaroon);

var lnrpcDescriptor = grpc.load(__dirname + '/../lnd/lnrpc/rpc.proto');
var lnrpc = lnrpcDescriptor.lnrpc;
var lightning = new lnrpc.Lightning('localhost:10009', credentials);

var pubkey = "";
// Get node pubkey
lightning.getInfo({}, meta, function(err, response) {
    if(err){console.log(err)}
    pubkey = response.identity_pubkey;
});

emitter = new events.EventEmitter();

// Subscribe to invoice stream
var invoice_sub = lightning.subscribeInvoices({}, meta);
invoice_sub.on('data', function(invoice) {
    emitter.emit(invoice.payment_request, invoice);
})
.on('end', function() {
    // The server has finished sending
    //
})
.on('status', function(status) {
    // Process status
})
.on('error', function(err){
    console.log(err);
});

module.exports = {
    addInvoice: function(value, memo, callback) {
        lightning.addInvoice({ value: value, memo: memo}, meta, function(err, response) {
            if(err){
                console.log(err);
                callback(err, null);
                return;
            }
            invoice = new db.Invoice(response);
            invoice.save();
            callback(null, invoice);
        });
    },

    sendPayment: function(pay_req, callback) {
        lightning.sendPaymentSync({ payment_request: pay_req, }, meta, function(err, response){
            if(response.payment_error){
                err = new Error(response.payment_error);
                console.log(err);
            }
            callback(err, response);
        });
    },

    decodePayReq: function(pay_req, callback) {
        lightning.decodePayReq({ pay_req: pay_req, }, meta, function(err, response){
            callback(err, response);
        });
    },
    emitter,
    getPubKey: function(){
        return pubkey;
    }
};
