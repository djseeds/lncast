const FeedParser = require('feedparser');
const request = require('request');
const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const twitter = require('../controllers/twitter');

const Schema = mongoose.Schema;

const mongoDB = 'mongodb://127.0.0.1/lncast';
mongoose.connect(mongoDB, {useNewUrlParser: true});
mongoose.set('useCreateIndex', true);

mongoose.Promise = global.Promise;

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const EpisodeSchema = new Schema({
  title: {type: String, required: true},
  description: {type: String},
  summary: {type: String},
  date: {type: Date},
  pubdate: {type: Date},
  author: {type: String},
  guid: {type: String, required: true, unique: true},
  comments: {type: String},
  image: {url: {type: String}, title: {type: String}},
  categories: [{type: String}],
  enclosure: {type: Schema.ObjectId, ref: 'Enclosure'},
  earned: {type: Number, default: 0},
  listens: {type: Number, default: 0},
},
{
  toJSON: {virtuals: true},
  toObject: {virtuals: true},
});

EpisodeSchema.methods.toJSON = function() {
  const obj = this.toObject({getters: true});

  // Remove fields that could leak info
  delete obj.guid;

  return obj;
};

EpisodeSchema.methods.getPrice = function(callback) {
  Podcast.findOne({'episodes': this._id}, function(err, podcast) {
    if (err) {
      console.log(err);
      callback(err, null);
      return;
    }
    callback(null, podcast.price);
  });
};

EpisodeSchema.methods.getPodcast = function(callback) {
  Podcast.findOne({'episodes': this._id}, function(err, podcast) {
    if (err) {
      callback(err, null);
      return;
    }
    callback(null, podcast);
  });
};

EpisodeSchema.methods.credit = function(value) {
  this.earned += value;
  this.save();
  Podcast.findOne({'episodes': this._id}, function(err, podcast) {
    if (err) {
      console.log(err);
      return;
    }
    podcast.credit(value);
  });
};

EpisodeSchema.methods.listen = function() {
  this.listens++;
  this.save();
  Podcast.findOne({'episodes': this._id}, function(err, podcast) {
    if (err) {
      console.log(err);
      return;
    }
    podcast.listen();
  });
};

EpisodeSchema.pre('remove', function(next) {
  Enclosure.findById(this.enclosure, function(err, enclosure) {
    if (err) {
      callback(err);
      return;
    }
    if (enclosure) {
      enclosure.remove();
    }
    next();
  });
});

const Episode = mongoose.model('Episode', EpisodeSchema, 'Episode');

// Schema for enclosure (attached media)
const EnclosureSchema = new Schema({
  filesize: {type: Number},
  type: {type: String},
  url: {type: String},
},
{
  toJSON: {virtuals: true},
  toObject: {virtuals: true},
});

EnclosureSchema.methods.getPrice = function(callback) {
  Episode.findOne({'enclosure': this._id}, function(err, episode) {
    if (err) {
      console.log(err);
      callback(err, null);
    }
    episode.getPrice(callback);
  });
};

EnclosureSchema.methods.getEpisode = function(callback) {
  Episode.findOne({'enclosure': this._id}, function(err, episode) {
    if (err) {
      console.log(err);
      callback(err, null);
    }
    callback(null, episode);
  });
};

EnclosureSchema.methods.getPodcast = function(callback) {
  Episode.findOne({'enclosure': this._id}, function(err, episode) {
    if (err) {
      console.log(err);
      callback(err, null);
    }
    episode.getPodcast(callback);
  });
};

EnclosureSchema.methods.credit = function(value) {
  Episode.findOne({'enclosure': this._id}, function(err, episode) {
    if (err) {
      console.log(err);
      return;
    }
    episode.credit(value);
  });
};

EnclosureSchema.methods.buy = function() {
  const self = this;
  this.getPrice( function(err, price) {
    if (price) {
      self.credit(price);
    }
  });
};

EnclosureSchema.methods.listen = function() {
  Episode.findOne({'enclosure': this._id}, function(err, episode) {
    if (err) {
      console.log(err);
      return;
    }
    episode.listen();
  });
};

const Enclosure = mongoose.model('Enclosure', EnclosureSchema, 'Enclosure');

// Schema for BTCPayServer invoices.
const InvoiceSchema = new Schema({
  id: {type: String, required: true, unique: true},
  price: {type: Number, required: true},
  currency: {type: String, required: true},
  url: {type: String},
  invoiceTime: {type: Number},
  expirationTime: {type: Number},
  addresses: {
    BTC_LightningLike: {type: String, required: true},
  },
  complete: {type: Boolean, default: false},
});

const Invoice = mongoose.model('Invoice', InvoiceSchema, 'Invoice');

const PodcastSchema = new Schema({
  title: {type: String, required: true},
  description: {type: String},
  link: {type: String},
  xmlurl: {type: String, required: true, unique: true},
  date: {type: Date},
  pubdate: {type: Date},
  author: {type: String},
  language: {type: String},
  image: {url: {type: String}, title: {type: String}},
  favicon: {type: String},
  copyright: {type: String},
  generator: {type: String},
  categories: [{type: String}],
  episodes: [{type: Schema.ObjectId, ref: 'Episode'}],
  price: {type: Number},
  earned: {type: Number, default: 0},
  listens: {type: Number, default: 0},
  subscribed: {type: Boolean, default: false},
  btcPayServer: {
    type: {
      serverUrl: {type: String, required: true},
      storeId: {type: String, required: true},
      merchantCode: {type: String, required: true},
      privateKey: {type: String, required: true},
    },
    required: true,
  },
},
{
  toJSON: {virtuals: true},
});

PodcastSchema.methods.toJSON = function() {
  const obj = this.toObject({getters: true});

  // Remove fields that could leak info
  delete obj.link;
  delete obj.xmlurl;
  delete obj.btcPayServer.privateKey;
  delete obj.btcPayServer.merchantCode;

  return obj;
};

PodcastSchema.virtual('url').get(function() {
  return '/podcast/' + this._id;
});

PodcastSchema.virtual('btcPayServer.nodeInfoUrl').get(function() {
  return this.btcPayServer.serverUrl
  + '/embed/' + this.btcPayServer.storeId + '/BTC/ln';
});

PodcastSchema.methods.credit = function(value) {
  this.earned += value;
  this.save();
  User.findOne({'owns': this._id}, function(err, owner) {
    if (err) {
      console.log(err);
      return;
    }
    owner.balance += parseInt(value, 10);
    owner.save();
  });
};

PodcastSchema.methods.listen = function() {
  this.listens++;
  this.save();
};

PodcastSchema.statics.removeById = function(podcastID, callback) {
  Podcast.findById(podcastID, function(err, podcast) {
    if (err) {
      callback(err);
      return;
    } else if (!podcast) {
      callback();
    } else {
      podcast.remove(callback);
    }
  });
};

PodcastSchema.pre('remove', function(next) {
  Episode.find({_id: {$in: this.episodes}}, function(err, episodes) {
    if (err) {
      next(err);
      return;
    }
    episodes.forEach(function(episode) {
      episode.remove();
    });
    next();
  });
});

const Podcast = mongoose.model('Podcast', PodcastSchema, 'Podcast');

const UserSchema = new Schema({
  username: {type: String, required: true, unique: true},
  password: String,
  invoices: [{
    invoice: {type: Schema.ObjectId, ref: 'Invoice'},
    enclosure: {type: Schema.ObjectId, ref: 'Enclosure'},
  }],
  owns: [{type: Schema.ObjectId, ref: 'Podcast'}],
  subscriptions: [{type: Schema.ObjectId, ref: 'Podcast'}],
});

UserSchema.methods.withdraw = function(value, callback) {
  this.balance -= parseInt(value, 10);
  this.save(function(err) {
    if (err) {
      callback(err, null);
    }
    callback(null, user.balance);
  });
};

// Returns true if user is subscribed to given podcast.
UserSchema.methods.isSubscribed = function(podcastID) {
  let found = false;
  this.subscriptions.forEach(function(id) {
    if (String(id) == String(podcastID)) {
      found = true;
    }
  });
  return found;
};

// Subscribe to a podcast by ID, if not alread subscribed. If the podcast is not
// found, an error will be passed to callback.
UserSchema.methods.subscribe = function(podcastID, callback) {
  const self = this;
  Podcast.findById(podcastID, function(err, podcast) {
    if (err) {
      callback(err);
    } else if (podcast) {
      if (self.isSubscribed(podcast._id)) {
        // Already subscribed
        callback(null);
      } else {
        self.subscriptions.push(podcast._id);
        self.save(callback);
      }
    } else {
      err = new Error('Podcast not found');
      callback(err);
    }
  });
};

// Unsubscribe to a podcast by ID, if already subscribed. If the podcast is not
// found, an error will be passed to callback.
UserSchema.methods.unsubscribe = function(podcastID, callback) {
  self = this;
  Podcast.findById(podcastID, function(err, podcast) {
    if (err) {
      callback(err);
      return;
    } else if (podcast) {
      if (!self.isSubscribed(podcast._id)) {
        // Not subscribed
        callback(null);
        return;
      }
      const i = self.subscriptions.findIndex(function(id) {
        return String(id) == String(podcast._id);
      });
      if (i > -1) {
        self.subscriptions.splice(i, 1);
        self.save(callback);
      } else {
        callback(null);
        return;
      }
    } else {
      err = new Error('Podcast not found');
      callback(err);
    }
  });
};

UserSchema.pre('remove', function(next) {
  // Remove user's podcasts before removing user account.
  Podcast.find({_id: {$in: this.owns}}, function(err, podcasts) {
    if (err) {
      next(err);
      return;
    }
    podcasts.forEach(function(podcast) {
      podcast.remove();
    });
    next();
  });
});

UserSchema.plugin(passportLocalMongoose);

const User = mongoose.model('User', UserSchema, 'User');

module.exports = {
  Enclosure: Enclosure,
  Episode: Episode,
  Invoice: Invoice,
  Podcast: Podcast,
  User: User,
};

const updateEpisode = function(data, callback) {
  Episode.findOne({'guid': data.guid})
      .populate('enclosure')
      .exec(function(err, episode) {
        let isNew = false;
        if (err) {
          callback(err);
          return;
        }
        if (!episode) {
          isNew = true;
          episode = data;
          episode.save();
          episode.enclosure.save();
        } else if (data.date > episode.date) {
          // Don't create a new enclosure
          if (episode.enclosure.url == data.enclosure.url) {
            updateObject(episode, data, ['enclosure', 'earned', 'listens']);
            episode.enclosure.save();
          } else {
            updateObject(episode, data, ['earned', 'listens']);
          }
          episode.save();
        }
        callback(null, episode, isNew);
      });
};

module.exports.refreshAll = function() {
  console.log('Refreshing all feeds');
  Podcast.find({}, function(err, podcasts) {
    if (err) {
      console.log(err);
      return;
    }
    const promises = podcasts.map(refreshPodcast);
    Promise.all(promises).then(function(podcasts) {
      console.log('Done refreshing feeds');
    }).catch(function(err) {
      console.log('Failed to refresh feeds.');
      console.error(err);
    });
  });
};

const refreshPodcast = function(podcast) {
  return new Promise(function(resolve, reject) {
    parseFeed(podcast.xmlurl).then(function(updatedPodcast) {
      const promises = updatedPodcast.episodes.map(function(episode) {
        return new Promise(function(resolve, reject) {
          updateEpisode(episode, function(err, updatedEpisode, isNew) {
            if (err) {
              reject(err);
            }
            if (isNew) {
            // Push to Podcast episodes.
              podcast.episodes.push(updatedEpisode);
              // Announce episode.
              twitter.announceEpisode(podcast, episode,
                  function(err) {
                    if (err) {
                      console.log('Failed to announce episode!');
                      console.log(err);
                    }
                  });
            }
            resolve(episode);
          });
        });
      });
      Promise.all(promises).then(function(episodes) {
      // Don't overwrite xml URL, episodes or default fields.
        updateObject(podcast, updatedPodcast,
            [
              'episodes',
              'xmlurl',
              'earned',
              'btcPayServer',
              'listens',
              'price',
            ]);
        podcast.save();
        resolve(podcast);
      });
    }).catch(function(err) {
      reject(err);
    });
  });
};

const updateObject = function(object, update, excludeFields=[]) {
  const updateObject = update.toObject();
  // Never overwrite object ID.
  delete updateObject._id;
  excludeFields.forEach(function(field) {
    delete updateObject[field];
  });
  Object.assign(object, updateObject);
};

const parseFeed = function(feed) {
  return new Promise(function(resolve, reject) {
    let podcast;
    const feedparser = new FeedParser();

    feedparser.on('error', function(err) {
      this.destroy(err);
      reject(err);
    });

    feedparser.on('meta', function(meta) {
      podcast = new Podcast(this.meta);
    });

    feedparser.on('readable', function() {
      const stream = this;
      while (item = stream.read()) {
        const episode = new Episode(item);
        if (item.enclosures) {
          const enclosure = item.enclosures[0];
          episode.enclosure = new Enclosure(enclosure);
        }
        podcast.episodes.push(episode);
      }
    });

    feedparser.on('close', function(err) {
      if (err) {
        reject(err);
        return;
      } else if (podcast) {
        resolve(podcast);
      } else {
        reject(new Error('Failed to parse podcast.'));
      }
    });
    feedparser.on('end', function(err) {
      this.destroy();
    });

    request
        .get(feed,
            {
              headers: {
                'User-Agent': 'request',
              },
            }
        )
        .on('error', function(err) {
          reject(err);
          return;
        }).pipe(feedparser);
  });
};

module.exports.addPodcast = function(feed, price, btcPayServerInfo, callback) {
  parseFeed(feed).then(function(podcast) {
    if (podcast == null) {
      callback(new Error('Unable to add podcast.'));
      return;
    }
    podcast.xmlurl = feed;
    podcast.price = price;
    podcast.btcPayServer = btcPayServerInfo;
    podcast.episodes.forEach(function(episode) {
      if (episode.enclosure) {
        episode.enclosure.save(function(err) {
          if (err) console.log(err);
        });
      }
      episode.save(function(err) {
        if (err) console.log(err);
      });
    });
    podcast.save(function(err) {
      if (err) {
        console.log(err);
        callback(err, null);
        return;
      }
      callback(null, podcast);
    });
  }).catch(function(err) {
    console.log(err);
    callback(err, null);
    return;
  });
};
