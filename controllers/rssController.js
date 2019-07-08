const RSS = require('rss');
const db = require('./database');

module.exports.generateFeed = function(podcast, user, callback) {
  const feed = new RSS({
    title: podcast.title,
    description: podcast.description,
    generator: 'lncast.com',
    feed_url: 'https://lncast.com/rss/' + podcast._id + '?user=' + user._id,
    site_url: 'https://lncast.com/#!/podcast/' + podcast._id,
    image_url: podcast.image.url,
    copyright: podcast.copyright,
    language: podcast.language,
    categories: podcast.categories,
    pubDate: podcast.pubDate,
    ttl: 0,
  });
  // Build episodes (RSS items) based on whether or not user has purchased.
  Promise.all(podcast.episodes.map(function(episodeId) {
    return new Promise(function(resolve, reject) {
      db.Episode.findById(episodeId).populate('enclosure')
          .exec(function(err, episode) {
            if (err) {
              reject(err);
            } else {
              user.checkIfPurchased(episode._id, function(err, hasPurchased) {
                if (err) {
                  reject(err);
                } else {
                  resolve({
                    title: episode.title,
                    // eslint-disable-next-line max-len
                    description: hasPurchased ? episode.description: generateDescription(podcast, episode, user),
                    url: 'https://lncast.com/#!/podcast/' + podcast._id + '/' + episode._id,
                    guid: episode.guid,
                    categories: episode.categories,
                    date: episode.date,
                    enclosure: hasPurchased ? episode.enclosure : null,
                  });
                }
              });
            }
          });
    });
  })).then(function(items) {
    // Add items to feed
    items.forEach(function(item) {
      feed.item(item);
    });
    callback(null, feed.xml());
  }).catch(function(err) {
    callback(err);
  });
};
