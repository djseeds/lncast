const grpc = require('grpc');
const protoLoader = require('@grpc/proto-loader');
const fs = require('fs');
const os = require('os');
const events = require('events');
const db = require('./database');
// Default is ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384
// https://github.com/grpc/grpc/blob/master/doc/environment_variables.md
// Current LND cipher suites here:
// https://github.com/lightningnetwork/lnd/blob/master/lnd.go#L80
// eslint-disable-next-line max-len
process.env.GRPC_SSL_CIPHER_SUITES ='ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256';

const certPath = os.homedir() + '/.lnd/tls.cert';
const lndCert = fs.readFileSync(certPath);
const credentials = grpc.credentials.createSsl(lndCert);

const macaroonPath = os.homedir()
+ '/.lnd/data/chain/bitcoin/testnet/admin.macaroon';
const lndMacaroon = fs.readFileSync(macaroonPath).toString('hex');
const meta = new grpc.Metadata();
meta.add('macaroon', lndMacaroon);

const packageDefinition = protoLoader.loadSync(__dirname
    + '/../lnd/lnrpc/rpc.proto', {keepCase: true});
const lnrpcDescriptor = grpc.loadPackageDefinition(packageDefinition);
const lnrpc = lnrpcDescriptor.lnrpc;
const lightning = new lnrpc.Lightning('localhost:10009', credentials);

let pubkey = '';
// Get node pubkey
lightning.getInfo({}, meta, function(err, response) {
  if (err) {
    console.log(err);
  }
  pubkey = response.identity_pubkey;
});

emitter = new events.EventEmitter();

// Subscribe to invoice stream
const invoiceSub = lightning.subscribeInvoices({}, meta);
invoiceSub.on('data', function(invoice) {
  emitter.emit(invoice.payment_request, invoice);
})
    .on('end', function() {
    // The server has finished sending
    //
    })
    .on('status', function(status) {
    // Process status
    })
    .on('error', function(err) {
      console.log(err);
    });

module.exports = {
  addInvoice: function(value, memo, callback) {
    lightning.addInvoice({value: value, memo: memo}, meta,
        function(err, response) {
          if (err) {
            console.log(err);
            callback(err, null);
            return;
          }
          invoice = new db.Invoice(response);
          invoice.save();
          callback(null, invoice);
        });
  },

  sendPayment: function(payReq, callback) {
    lightning.sendPaymentSync({payment_request: payReq}, meta,
        function(err, response) {
          if (response.payment_error) {
            err = new Error(response.payment_error);
            console.log(err);
          }
          callback(err, response);
        });
  },

  decodePayReq: function(payReq, callback) {
    lightning.decodePayReq({payReq: payReq}, meta, function(err, response) {
      callback(err, response);
    });
  },
  emitter,
  getPubKey: function() {
    return pubkey;
  },
};
