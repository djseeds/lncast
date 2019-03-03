const btcpay = require('btcpay');
const key = process.env.BTCPAYSERVER_PRIVATE_KEY;
if (key == null) {
  throw new Error('BTCPAYSERVER_PRIVATE_KEY not defined.');
}
// eslint-disable-next-line new-cap

module.exports.pairClient = function(btcpayUrl, pairCode, callback) {
  const privKey = btcpay.crypto.generate_keypair().getPrivate().toString();
  const keyPair = btcpay.crypto.load_keypair(new Buffer.from(privKey, 'hex'));
  new btcpay.BTCPayClient(btcpayUrl,
      keyPair)
      .pair_client(pairCode)
      .then(function(res) {
        callback(null, res.merchant, privKey);
      })
      .catch(function(err) {
        callback(err);
      });
};

module.exports.addInvoice = function(enclosure, callback) {
  enclosure.getPodcast(function(err, podcast) {
    const client = getBtcPayClient(podcast);
    if (err) {
      callback(err);
      return;
    }
    client.create_invoice({price: podcast.price, currency: 'USD'})
        .then(function(invoice) {
          callback(null, invoice);
        })
        .catch(function(err) {
          callback(err);
        });
  });
};

module.exports.getInvoice = function(invoiceId, enclosure, callback) {
  enclosure.getPodcast(function(err, podcast) {
    if (err) {
      callback(err);
      return;
    }
    getBtcPayClient(podcast).get_invoice(invoiceId)
        .then(function(invoice) {
          callback(null, invoice);
        })
        .catch(function(err) {
          callback(err);
        });
  });
};

const getBtcPayClient = function(podcast) {
  const serverInfo = podcast.btcPayServer;
  const keyPair = btcpay.crypto.load_keypair(
    new Buffer.from(serverInfo.privateKey, 'hex'));
  return new btcpay.BTCPayClient(
      serverInfo.serverUrl,
      keyPair,
      {merchant: serverInfo.merchantCode});
}
  ;
