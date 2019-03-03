const process = require('process');
const Twitter = require('twitter');

const client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

module.exports.announcePodcast = function(podcast, callback) {
  const tweet = {
    status: podcast.title + ' is now available on LNCast! Welcome to the lightning network!\n' + 'https://lncast.com/#!/podcast/' + podcast._id,
  };
  client.post('statuses/update', tweet, callback);
};

module.exports.announceEpisode = function(podcast, episode, callback) {
  const tweet = {
    status: 'New episode of ' + podcast.title + ' added: ' + episode.title + '\nhttps://lncast.com/#!/podcast/' + podcast._id + '/' + episode._id,
  };
  client.post('statuses/update', tweet, callback);
};
