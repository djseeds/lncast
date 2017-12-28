var podcatcher = require('podcatcher');
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
    },
    {
        toJSON: {virtuals: true},
    }
);

AuthorSchema.virtual('url').get(function(){
    return '/author/' + this._id;
});

Author = mongoose.model('Author', AuthorSchema, 'Author');

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

Category = mongoose.model('Category', CategorySchema, 'Category');

var EpisodeSchema = new Schema(
    {
        title: {type: String, required: true},
        summary: {type: String},
        releaseDateTime: {type: Date},
        link: {type: String, required: true},
    },
    {
        toJSON: {virtuals: true},
    }

);

Episode = mongoose.model('Episode', EpisodeSchema, 'Episode');

var PodcastSchema = new Schema ({
        title: {type: String, required: true, unique: true},
        description: {type: String},
        author: {type: Schema.ObjectId, ref: 'Author', required: true},
        episodes: [{type: Schema.ObjectId, ref: 'Episode'}],
        categories: [{type: Schema.ObjectId, ref: 'Category'}],
        price: {type: Number},
    },
    {
        toJSON : { virtuals: true },
    }
);

PodcastSchema.virtual('url').get(function(){
    return '/podcast/' + this._id;
});

Podcast = mongoose.model('Podcast', PodcastSchema, 'Podcast');


var UserSchema = new Schema ({
    username: {type: String, required: true, unique: true},
    password: String,
    purchased: [{type: Schema.ObjectId, ref: 'Episode'}],
    owns: [{type: Schema.ObjectId, ref: 'Podcast'}],
    pubkey: String,
    address: String,
});

UserSchema.plugin(passportLocalMongoose);



User = mongoose.model('User', UserSchema, 'User');

module.exports = {
    Episode: Episode,
    Podcast: Podcast,
    Category: Category,
    Author: Author,
    User: User,
}

module.exports.addPodcast = function(title, feed){
    podcatcher.getAll(feed, function(err, meta, articles){
        if (err) {
            console.log(err);
            return;
        }
        var podcast = new Podcast( {
            title: meta.title,
            description: meta.description,
            author: new Author({
                name: meta["itunes:author"]["#"],
            }),
        })
        articles.forEach( function(article){
            episode = new Episode({
                title: article.title,
                summary: article.summary,
                link: article.link,
            });
            episode.save(function (err) {
                if(err) {
                    console.log(err);
                }
            })
            podcast.episodes.push(episode._id);
        });
        meta.categories.forEach( function(category){
            podcast.categories.push(new Category({
                name: category
            }));
        });
        podcast.save(function (err) {
            if(err) {
                console.log(err);
                return err;
            }
        });
    })
}
