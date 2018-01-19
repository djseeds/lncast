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
    earned: {type: Number, default: 0},
    listens: {type: Number, default: 0},
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
});

EpisodeSchema.methods.getPrice = function(callback){
    Podcast.findOne({"episodes": this._id}, function(err, podcast){
        if(err){
            console.log(err);
            callback(err,null);
        }
        callback(null, podcast.price);
    });
}

EpisodeSchema.methods.credit = function(value){
    this.earned += parseInt(value, 10);
    this.save();
    Podcast.findOne({"episodes": this._id}, function(err, podcast){
        if(err){
            console.log(err);
            return;
        }
        podcast.credit(value);
    })
}

EpisodeSchema.methods.listen = function(){
    this.listens++;
    this.save();
    Podcast.findOne({"episodes": this._id}, function(err, podcast){
        if(err){
            console.log(err);
            return;
        }
        podcast.listen();
    })
}

EpisodeSchema.pre('remove', function(next){
    Enclosure.findById(this.enclosure, function(err, enclosure){
        if(err){
            callback(err);
            return;
        }
        if(enclosure){
            enclosure.remove();
        }
        next();
    });
});

var Episode = mongoose.model('Episode', EpisodeSchema, 'Episode');

// Schema for enclosure (attached media)
var EnclosureSchema = new Schema({
    filesize: {type: Number},
    type: {type: String},
    url: {type: String},
},
{
    toJSON: {virtuals: true},
    toObject: {virtuals: true},
});

EnclosureSchema.methods.getPrice = function(callback){
    Episode.findOne({"enclosure": this._id}, function(err, episode){
        if(err){
            console.log(err);
            callback(err,null);
        }
        episode.getPrice(callback);
    });
}

EnclosureSchema.methods.credit = function(value){
    Episode.findOne({"enclosure": this._id}, function(err, episode){
        if(err){
            console.log(err);
            return;
        }
        episode.credit(value);
    })
}

EnclosureSchema.methods.listen = function(){
    Episode.findOne({"enclosure": this._id}, function(err, episode){
        if(err){
            console.log(err);
            return;
        }
        episode.listen();
    })
}

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
    earned: {type: Number, default: 0},
    listens: {type: Number, default: 0},
},
{
toJSON : { virtuals: true },
});

PodcastSchema.virtual('url').get(function(){
    return '/podcast/' + this._id;
});

PodcastSchema.methods.credit = function(value){
    this.earned += parseInt(value, 10);
    this.save();
    User.findOne({"owns": this._id}, function(err, owner){
        if(err){
            console.log(err);
            return;
        }
        owner.balance += parseInt(value, 10);
        owner.save();
    })
}

PodcastSchema.methods.listen = function(){
    this.listens++;
    this.save();
}

PodcastSchema.statics.removeById = function(podcastID, callback){
    Podcast.findById(podcastID, function(err, podcast){
        if(err){
            callback(err);
            return;
        }
        podcast.remove();
    });
}

PodcastSchema.pre('remove', function(next){
    Episode.find({_id: {$in: this.episodes}}, function(err, episodes){
        if(err){
            next(err);
            return;
        }
        episodes.forEach(function(episode){
            episode.remove();
        });
        next();
    });
})

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

UserSchema.methods.withdraw = function(value, callback){
    this.balance -= parseInt(value, 10);
    this.save(function(err){
        if(err){
            callback(err,null);
        }
        callback(null, user.balance);
    });
}

UserSchema.pre('remove', function(next){
    // Remove user's podcasts before removing user account.
    Podcast.find({_id: {$in: this.owns}}, function(err, podcasts){
        if(err){
            next(err);
            return;
        }
        podcasts.forEach(function(podcast){
            podcast.remove();
        });
        next();
    });
})

UserSchema.plugin(passportLocalMongoose);

var User = mongoose.model('User', UserSchema, 'User');

module.exports = {
    Enclosure: Enclosure,
    Episode: Episode,
    Invoice: Invoice,
    Podcast: Podcast,
    User: User,
}

var updateEpisode = function(data){
    Episode.findOne({'guid': data.guid})
        .populate('enclosure')
        .exec(function(err, episode){
        if(!episode){
            console.log(data);
            // Add a new episode
            Podcast.findOne({'xmlurl': data.meta.xmlurl}, function(err, podcast){
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
    console.log("Refreshing all feeds");
    Podcast.find({}, function(err, podcasts){
        if(err){
            console.log(err);
            return;
        }
        podcasts.forEach(function(podcast){
            refreshFeed(podcast.xmlurl);
        });
        console.log("Done refreshing feeds");
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
