var twitter = require('twitter');
require('dotenv').config

var client = new twitter({
  consumer_key:        process.env.TW_CONSUMER_KEY,
  consumer_secret:     process.env.TW_CUNSUMER_SECRET,
  access_token_key:    process.env.TW_TOKEN_KEY,
  access_token_secret: process.env.TW_TOKEN_SECRET,
});

console.log(client)
console.log(process.env.TW_TOKEN_SECRET)

var params = {screen_name: 'nodejs'};

client.get('statuses/user_timeline', params, function(error, tweets, response){
  if (!error) {
      console.log(tweets);
  }
});
