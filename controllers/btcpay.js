const btcpay = require('btcpay');
const key = process.env.BTCPAYSERVER_PRIVATE_KEY
if(key == null) {
  throw new Error("BTCPAYSERVER_PRIVATE_KEY not defined.");
}
const keypair = btcpay.crypto.load_keypair(new Buffer.from(key, 'hex'));

module.exports.pairClient = function (btcpayUrl, pairCode, callback) {
  new btcpay.BTCPayClient(btcpayUrl,
    keypair)
    .pair_client(pairCode)
    .then(function (res) {
      callback(null, res.merchant);
    })
    .catch(function (err) {
      callback(err);
    })
}

module.exports.addInvoice = function (enclosure, callback) {
  enclosure.getPodcast(function (err, podcast) {
    var client = getBtcPayClient(podcast);
    if (err) {
      callback(err);
      return;
    }
    client.create_invoice({ price: podcast.price, currency: 'USD' })
      .then(function (invoice) {
        callback(null, invoice);
      })
      .catch(function (err) {
        callback(err);
      })
  })
}

module.exports.getInvoice = function (invoiceId, callback) {
  enclosure.getPodcast(function (err, podcast) {
    if (err) {
      callback(err);
      return;
    }
    getBtcPayClient(podcast).get_invoice(invoiceId)
      .then(function (invoice) {
        callback(invoice);
      })
      .catch(function (err) {
        callback(err);
      })
  })
}

var getBtcPayClient = function (podcast) {
  var serverInfo = podcast.btcPayServer;
  return new btcpay.BTCPayClient(serverInfo.serverUrl, keypair, { merchant: serverInfo.merchantCode })
}