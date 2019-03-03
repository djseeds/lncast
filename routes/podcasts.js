const express = require('express');
const db = require('../controllers/database');
const sessionCtrl = require('../controllers/session');
const twitter = require('../controllers/twitter');
const btcpay = require('../controllers/btcpay');
const flatten = require('flat');

// eslint-disable-next-line new-cap
const router = express.Router();

/* GET all podcasts. */
router.get('/podcasts', function(req, res, next) {
  db.Podcast.find({}, function(err, podcasts) {
    if (err) {
      return next(err);
    } else {
      res.json(podcasts);
    }
  });
});

/* GET podcast */
router.get('/podcast/:podcastID', function(req, res, next) {
  db.Podcast.findById(req.params.podcastID)
      .populate('episodes')
      .exec(function(err, podcast) {
        if (err) {
          next(err);
        } else {
          // If user is logged in, check if they are subscribed
          if (req.user) {
            console.log('IsSubscribed');
            podcast.subscribed = req.user.isSubscribed(podcast._id);
            res.json(podcast);
          } else {
            res.json(podcast);
          }
        }
      });
});

/* POST (update) podcast */
router.post('/podcast/:podcastID', function(req, res, next) {
  if (req.isAuthenticated() && req.user.owns.findIndex(function(id) {
    return id.toString() == req.params.podcastID;
  }) != -1) {
    if (req.body.btcPayServer) {
      if ((req.body.btcPayServer.serverUrl == null)
                != (req.body.btcPayServer.pairCode == null)) {
        return next(
            new Error('serverUrl and pairCode can only be updated together.')
        );
      } else if (req.body.btcPayServer.serverUrl
        && req.body.btcPayServer.pairCode) {
        btcpay.pairClient(req.body.btcPayServer.serverUrl,
            req.body.btcPayServer.pairCode,
            function(err, merchantId, privateKey) {
              if (err) {
                return next(err);
              }
              // Update merchant ID.
              req.body.btcPayServer.merchantCode = merchantId;
              req.body.btcPayServer.privateKey = privateKey;
              updateAndSendPodcast(res, next, req.params.podcastID, req.body);
            });
      } else {
        updateAndSendPodcast(res, next, req.params.podcastID, req.body);
      }
    } else {
      updateAndSendPodcast(res, next, req.params.podcastID, req.body);
    }
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

/**
 * Updates a podcast in database and responds to caller with
 * updated podcast object.
 *
 * @param {*} res - Express response object.
 * @param {*} next - Next Express middleware function.
 * @param {*} podcastId - Mongo ID of podcast to update.
 * @param {*} podcastData - Object containing updates to podcast.
 */
function updateAndSendPodcast(res, next, podcastId, podcastData) {
  // Flatten nested data.
  podcastData = flatten(podcastData);
  db.Podcast.findByIdAndUpdate(podcastId, podcastData, function(err, podcast) {
    if (err) {
      return next(err);
    } else if (podcast == null) {
      res.status(404);
      res.send('Not Found');
    } else {
      res.send('OK');
    }
  });
}

/* DELETE podcast */
router.delete('/podcast/:podcastID', function(req, res, next) {
  if (req.isAuthenticated() && req.user.owns.findIndex(function(id) {
    return id.toString() == req.params.podcastID;
  }) != -1) {
    console.log('Deleting');
    db.Podcast.removeById(req.params.podcastID, function(err) {
      if (err) {
        console.log(err);
        return next(err);
      }
      res.send('OK');
    });
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

// GET single podcast episode page
router.get('/podcast/:podcastID/:episodeID', function(req, res, next) {
  db.Podcast.findById(req.params.podcastID)
      .exec(function(err, podcast) {
        if (err) {
          next(err);
        } else {
          db.Episode.findById(req.params.episodeID)
              .exec(function(err, episode) {
                if (err) {
                  next(err);
                } else {
                  res.json({
                    episode: episode,
                    podcast: podcast,
                  });
                }
              });
        }
      });
});


// GET episode contents
router.get('/enclosure/:enclosureID', function(req, res, next) {
  db.Enclosure.findById(req.params.enclosureID).exec(function(err, enclosure) {
    if (err) {
      const err = new Error('Not found.');
      err.status = 404;
      return next(err);
    }
    const invoiceId = sessionCtrl.getInvoice(req, enclosure._id);
    // User hasn't yet purchased enclosure.
    if (invoiceId == null) {
      // First check if enclosure is free:
      enclosure.getPrice(function(err, price) {
        if (price == 0) {
          enclosure.listen();
          res.json(enclosure);
        } else {
          returnNewInvoice(req, res, next, enclosure);
        }
      });
    } else {
      db.Invoice.findById(invoiceId).exec(function(err, invoice) {
        if (err) {
          return next(err);
        }
        btcpay.getInvoice(invoice.id, enclosure, function(err, invoice) {
          if (err) {
            if (err.statusCode == 404) {
              sessionCtrl.removeInvoice(req, enclosure._id);
              returnNewInvoice(req, res, next, enclosure);
            } else {
              err.status = 500;
              return next(err);
            }
          } else {
            switch (invoice.status) {
              case 'complete':
                // Enclosure has been paid for, so return it.
                enclosure.listen();
                res.json(enclosure);
                break;
              case 'expired':
              case 'invalid':
                // Remove existing invoice.
                sessionCtrl.removeInvoice(req, enclosure._id);
                returnNewInvoice(req, res, next, enclosure);
                break;
              default:
                // Invoice is pending.
                // Return pending invoice.
                res.status(402).json(invoice);
                break;
            }
          }
        });
      });
    }
  });
});

/**
 * Creates and returns a new invoice to caller.
 *
 * @param {*} req - Express request object.
 * @param {*} res - Express response object.
 * @param {*} next - next Express middleware function.
 * @param {*} enclosure
 */
function returnNewInvoice(req, res, next, enclosure) {
  // Create new invoice.
  btcpay.addInvoice(enclosure, function(err, invoice) {
    if (err) {
      err.status = 500;
      return next(err);
    }
    // Add to pending invoices
    invoice = new db.Invoice(invoice);
    invoice.save();
    sessionCtrl.addInvoice(req, invoice._id, req.params.enclosureID);
    // Return invoice info
    res.status(402).json(invoice);
  });
}


/* Add a podcast. */
router.post('/add', function(req, res, next) {
  if (req.isAuthenticated()) {
    if (req.body.btcPayServer == null) {
      const err = new Error('btcPayServer is required.');
      err.status = 400;
      return next(err);
    } else if (req.body.btcPayServer.storeId == null) {
      const err = new Error('btcPayServer.storeId is required.');
      err.status = 400;
      return next(err);
    }
    btcpay.pairClient(req.body.btcPayServer.url,
        req.body.btcPayServer.pairCode, function(err, merchantId, privateKey) {
          if (err) {
            return next(err);
          }
          const btcPayServerInfo = {
            serverUrl: req.body.btcPayServer.url,
            storeId: req.body.btcPayServer.storeId,
            merchantCode: merchantId,
            privateKey: privateKey,
          };
          db.addPodcast(req.body.feed, req.body.price, btcPayServerInfo,
              function(err, podcast) {
                if (err) {
                  return next(err);
                }
                res.json(podcast);
                req.user.owns.push(podcast._id);
                req.user.save();
                twitter.announcePodcast(podcast, function(err) {
                  if (err) {
                    console.log('Failed to announce podcast!');
                    console.log(err);
                  } else {
                    console.log('Successfully announced new podcast!');
                  }
                });
              });
        });
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

/* Subscribe to a podcast. */
router.post('/subscribe', function(req, res, next) {
  if (req.isAuthenticated()) {
    req.user.subscribe(req.body.podcast, function(err) {
      if (err) {
        return next(err);
      }
      res.send('OK');
    });
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

/* Unsubscribe to a podcast. */
router.post('/unsubscribe', function(req, res, next) {
  if (req.isAuthenticated()) {
    req.user.unsubscribe(req.body.podcast, function(err) {
      console.log('Callback');
      if (err) {
        return next(err);
      }
      res.send('OK');
    });
  } else {
    res.status(401);
    res.send('Access denied');
  }
});

module.exports = router;
