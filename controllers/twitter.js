const process = require('process');
const Twitter = require('twitter');

const client = new Twitter({
  consumer_key: process.env.LNCAST_TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.LNCAST_TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.LNCAST_TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: process.env.LNCAST_TWITTER_ACCESS_TOKEN_SECRET,
});

module.exports.announcePodcast = function(podcast, callback) {
  const tweet = {
    status: podcast.title + ' is now available on LNCast!\nYou can now support ' + podcast.title + ' using the lightning network!\n' + 'https://' + process.env.LNCAST_DOMAIN_NAME + '/#!/podcast/' + podcast._id,
  };
  client.post('statuses/update', tweet, callback);
};

module.exports.announceEpisode = function(podcast, episode, callback) {
  const tweet = {
    status: 'New episode of ' + podcast.title
    +' now available on the lightning network!\n'
    + episode.title + '\n'
    + process.env.LNCAST_DOMAIN_NAME
    + '/#!/podcast/' + podcast._id + '/' + episode._id,
  };
  client.post('statuses/update', tweet, callback);
};
