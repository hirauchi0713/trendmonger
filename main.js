var twitter = require('twitter');
require('dotenv').config()

function randomGet(array) {
  return array[Math.floor(Math.random() * array.length)];
}

var client = new twitter({
  consumer_key:        process.env.TW_CONSUMER_KEY,
  consumer_secret:     process.env.TW_CUNSUMER_SECRET,
  access_token_key:    process.env.TW_TOKEN_KEY,
  access_token_secret: process.env.TW_TOKEN_SECRET,
});

// https://lab.syncer.jp/Tool/WOEID-Lookup/
const woeid_japan = '23424856';
var params = {id: woeid_japan };

function trendMonger() {
  client.get('trends/place', params, (error, trends, response) => {
    if (error) {
      return;
    }
    const trend_names = trends[0].trends.map(d=>d.name)
    console.log(JSON.stringify(trend_names, null, '  '));

    client.get('search/tweets',
      {
        q: randomGet(trend_names),
        lang: 'ja',
        locale: 'ja',
        result_type: 'popular',
        count: 10
      },
      (error, tweets, response) => {
        if (error || !tweets) {
          return;
        }
        console.log(JSON.stringify(tweets, null, '  '));
        const tweet = randomGet(tweets.statuses)
        console.log(JSON.stringify(tweet, null, '  '));
        if (!tweet) {
          return;
        }
        client.post('statuses/retweet/'+tweet.id_str, {id: tweet.id_str}, (error, tw, response) => {
          if (error) {
            console.log(JSON.stringify(error, null, '  '));
            return;
          }
          console.log(JSON.stringify(tw, null, '  '));
        });
      }
    );

  });
  setTimeout(trendMonger, 1000*60)
}

trendMonger();
