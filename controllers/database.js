var parsePodcast = require('node-podcast-parser');
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

var AuthorSchema = new Schema(
    {
        name: {type: String, required: true, unique: true},
        email: {type: String},
    },
    {
        toJSON: {virtuals: true},
    }
);

AuthorSchema.virtual('url').get(function(){
    return '/author/' + this._id;
});

var Author = mongoose.model('Author', AuthorSchema, 'Author');

var CategorySchema = new Schema(
    {
        name: {type: String, required: true, unique: true},
    },
    {
        toJSON: {virtuals: true},
    }

);

CategorySchema.virtual('url').get(function(){
    return '/api/category/' + this._id;
});

var Category = mongoose.model('Category', CategorySchema, 'Category');

var EpisodeSchema = new Schema(
    {
        guid: {type: String, required: true, unique: true},
        title: {type: String, required: true},
        description: {type: String},
        image: {type: String},
        published: {type: Date},
        duration: {type: Number},
        enclosure: {type: Schema.ObjectId, ref: 'Enclosure'},
    },
    {
        toJSON: {virtuals: true},
    }

);

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
        feed: {type: String, required: true, unique: true},
        title: {type: String, required: true},
        description: {short: {type: String}, long: {type: String}},
        link: {type: String},
        image: {type: String},
        updated: {type: Date},
        categories: [{type: Schema.ObjectId, ref: 'Category'}],
        owner: {type: Schema.ObjectId, ref: 'Author'},
        episodes: [{type: Schema.ObjectId, ref: 'Episode'}],
        price: {type: Number},
    },
    {
        toJSON : { virtuals: true },
    }
);

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
    Author: Author,
    Category: Category,
    Enclosure: Enclosure,
    Episode: Episode,
    Invoice: Invoice,
    Podcast: Podcast,
    User: User,
}

module.exports.addPodcast = function(feed, price, callback){
    request(feed, function(err, res, data) {
        if (err) {
            console.log(err);
            callback(err, null);
        }
        parsePodcast(data, function(err, data) {
            if(err) {
                console.log(err);
                callback(err, null);
                return;
            }
            var podcast = new Podcast( {
                feed: feed,
                title: data.title,
                description: data.description,
                link: data.link,
                image: data.image,
                updated: data.updated,
            });
            data.episodes.forEach( function(article){
                if(!article.enclosure){
                    // No audio content
                    return;
                }
                article.enclosure = new Enclosure(article.enclosure);
                article.enclosure.save();
                episode = new Episode(article);
                episode.save(function (err) {
                    if(err) {
                        console.log(err);
                    }
                })
                podcast.episodes.push(episode);
            });
            podcast.save(function (err) {
                if(err) {
                    console.log(err);
                    callback(err, null);
                    return;
                }
                callback(null, podcast);
            });
        })
    })
}
