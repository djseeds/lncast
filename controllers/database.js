var parsePodcast = require('node-podcast-parser');
var FeedParser = require('feedparser');
var request = require('request');
var mongoose = require('mongoose');
var passportLocalMongoose = require('passport-local-mongoose');
var Schema = mongoose.Schema;

var mongoDB = 'mongodb://127.0.0.1/my_database';
mongoose.connect(mongoDB, {
    useMongoClient: true
});

mongoose.Promise = global.Promise;

var db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));


var EpisodeSchema = new Schema({
    title: {type: String, required: true},
    description: {type: String},
    summary: {type: String},
    link: {type: String},
    origlink: {type: String},
    permalink: {type: String},
    date: {type: Date},
    pubdate: {type: Date},
    author: {type: String},
    guid: {type: String, required: true, unique: true},
    comments: {type: String},
    image: {url: {type: String}, title: {type: String}},
    categories: [{type: String}],
    source: {url: {type: String}, title: {type: String}},
    enclosure: {type: Schema.ObjectId, ref: 'Enclosure'},
},
{
    toJSON: {virtuals: true},
});

var Episode = mongoose.model('Episode', EpisodeSchema, 'Episode');

// Schema for enclosure (attached media)
var EnclosureSchema = new Schema({
    filesize: {type: Number},
    type: {type: String},
    url: {type: String},
});

var Enclosure = mongoose.model('Enclosure', EnclosureSchema, 'Enclosure');

// Schema for enclosure (attached media)
var InvoiceSchema = new Schema({
    r_hash: Buffer,
    payment_request: String,
});

var Invoice = mongoose.model('Invoice', InvoiceSchema, 'Invoice');

var PodcastSchema = new Schema ({
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
},
{
toJSON : { virtuals: true },
});

PodcastSchema.virtual('url').get(function(){
    return '/podcast/' + this._id;
});

var Podcast = mongoose.model('Podcast', PodcastSchema, 'Podcast');

var UserSchema = new Schema ({
    username: {type: String, required: true, unique: true},
    password: String,
    pending: [{
        invoice: {type: Schema.ObjectId, ref: 'Invoice'},
        enclosure: {type:  Schema.ObjectId, ref: 'Enclosure'}
    }],
    paid: [{type: Schema.ObjectId, ref: 'Invoice'}],
    purchased: [{type: Schema.ObjectId, ref: 'Enclosure'}],
    owns: [{type: Schema.ObjectId, ref: 'Podcast'}],
    pubkey: String,
    address: String,
    balance: {type: Number, default: 0},
});

UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model('User', UserSchema, 'User');

module.exports = {
    Enclosure: Enclosure,
    Episode: Episode,
    Invoice: Invoice,
    Podcast: Podcast,
    User: User,
}

var refreshEpisode = function(episodeGUID){
    Episode.findOne({"guid": episodeGUID}, function(err, episode){
        if(err){
            console.log(err);
            return;
        }
    });

}

var updateEpisode = function(data){
    Episode.findOne({'guid': data.guid})
        .populate('enclosure')
        .exec(function(episode){
        if(!episode){
            // Add a new episode
            Podcast.findOne({'xmlurl': data.meta.xmlurl}, function(podcast){
                if(podcast){
                    episode = new Episode(data);
                    if(data.enclosures){
                        var enclosure = data.enclosures[0];
                        episode.enclosure = new Enclosure(enclosure);
                        episode.enclosure.save();
                    }
                    episode.save();
                    podcast.episodes.push(episode);
                    podcast.save();
                }
            });
        }
        else if(data.date > episode.date){
            if(data.enclosures){
                var enclosure = data.enclosures[0];
                if(episode.enclosure.url != enclosure.url){
                    episode.enclosure = new Enclosure(enclosure);
                    episode.enclosure.save();
                }
            }
            Object.assign(episode, data);
            episode.save();
        }
    })

}

var updatePodcast = function(data){
    Podcast.findOne({'xmlurl': data.xmlurl}, function(podcast){
        if(!podcast){
            return;
        }
        if(data.date > podcast.date){
            Object.assign(podcast, data);
            podcast.save();
        }
    });
}

var refreshFeed = function(feed){
    var feedparser = new FeedParser();

    feedparser.on('error', function(err){
        this.destroy(err);
    });

    feedparser.on('meta', function(meta) {
        updatePodcast(meta);
    });

    feedparser.on('readable', function() {
        var stream = this;
        while (item = stream.read()) {
            updateEpisode(item);
        }
    });

    feedparser.on('close', function(err){
        if(err){
            console.log(err);
            return;
        }
        return;
    });

    feedparser.on('end', function(err){
        this.destroy();
    });

    request
        .get(feed)
        .on('error', function(err){
            console.log(err);
            return;
        })
    .pipe(feedparser);
}

module.exports.refreshAll = function(){
    Podcast.find({}, function(err, podcasts){
        if(err){
            console.log(err);
            return;
        }
        podcasts.forEach(function(podcast){
            refreshFeed(podcast.xmlurl);
        });
    });
}


var parseFeed = function(feed, callback){
    var podcast;
    var feedparser = new FeedParser();

    feedparser.on('error', function(err){
        this.destroy(err);
    });

    feedparser.on('meta', function(meta) {
        podcast = new Podcast(this.meta);
    });

    feedparser.on('readable', function() {
        var stream = this;
        while (item = stream.read()) {
            var episode = new Episode(item);
            if(item.enclosures){
                var enclosure = item.enclosures[0];
                episode.enclosure = new Enclosure(enclosure);
            }
            podcast.episodes.push(episode);
        }
    });

    feedparser.on('close', function(err){
        if(err){
            console.log(err);
            callback(err, null);
            return;
        }
        callback(null, podcast);
        return;
    });
    feedparser.on('end', function(err){
        this.destroy();
    });

    request
        .get(feed)
        .on('error', function(err){
            console.log(err);
            callback(err, null);
            return;
        })
    .pipe(feedparser);
}

removeEpisode = function(episodeID){
    Episode.findById(episodeID, function(error, episode){
        if(episode){
            Enclosure.remove({"_id": episode.enclosure}, function(err){
                if(err){
                    console.log("Error removing enclosure");
                }
            });
            Episode.remove({"_id": episode._id}, function(err){
                if(err){
                    console.log("Error removing episode");
                }
            });
            return;
        }
    });
}

module.exports.removePodcast = function(podcastID){
    Podcast.findById(podcastID, function(error, podcast){
        if(podcast){
            podcast.episodes.forEach(function(episode){
                removeEpisode(episode);
            })
            Podcast.remove({"_id": podcast._id}, function(err){
                if(err){
                    console.log("Error removing podcast");
                }
            });
            return;
        }
    });
}

module.exports.addPodcast = function(feed, price, callback){
    parseFeed(feed, function(err, podcast) {
        if(err) {
            console.log(err);
            callback(err, null);
            return;
        }
        podcast.price = price;
        podcast.episodes.forEach( function(episode){
            if(episode.enclosure){
                episode.enclosure.save(function(err){
                    if(err) console.log(err);
                });
            }
            episode.save(function (err) {
                if(err) console.log(err);
            });
        });
        podcast.save(function (err) {
            if(err) {
                console.log(err);
                    callback(err, null);
                return;
            }
            callback(null, podcast);
        });
    });
}

var payOwnerOfPodcast = function(podcastID, value){
    User.findOne({"owns":podcastID}, function(err, user){
        if(err){
            console.log(err);
            return;
        }
        user.balance += parseInt(value, 10);
        user.save();
    })
}

var payOwnerOfEpisode = function(episodeID, value){
    Podcast.findOne({"episodes":episodeID}, function(err, podcast){
        if(err){
            console.log(err);
            return;
        }
        payOwnerOfPodcast(podcast._id, value);
    })
}

module.exports.payOwnerOfEnclosure = function(enclosureID, value){
    Episode.findOne({"enclosure":enclosureID}, function(err, episode){
        if(err){
            console.log(err);
            return;
        }
        payOwnerOfEpisode(episode._id, value);
    })
}

var getEpisodePrice = function(episodeID, callback){
    Podcast.findOne({"episodes":episodeID}, function(err, podcast){
        if(err){
            console.log(err);
            callback(err, null)
        }
        callback(null, podcast.price);
    });
}

module.exports.getEnclosurePrice = function(enclosureID, callback){
    Episode.findOne({"enclosure":enclosureID}, function(err, episode){
        if(err){
            console.log(err);
            callback(err, null)
        }
        getEpisodePrice(episode._id, callback);
    })

}

module.exports.withdraw = function(userID, value, callback){
    User.findById(userID, function(err, user){
        if(err){
            console.log("Error!")
                console.log(err);
            callback(err, null);
            return;
        }
        user.balance -= parseInt(value, 10);
        user.save();
        callback(null, user.balance);
    })
}
