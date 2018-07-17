const twitter = require('twitter');
const _ = require('underscore');

require('dotenv').config();

function randomGet(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const client = new twitter({
  consumer_key:        process.env.TW_CONSUMER_KEY,
  consumer_secret:     process.env.TW_CUNSUMER_SECRET,
  access_token_key:    process.env.TW_TOKEN_KEY,
  access_token_secret: process.env.TW_TOKEN_SECRET,
});

// https://lab.syncer.jp/Tool/WOEID-Lookup/
const woeid_japan = '23424856';

let twitterTrends = []
async function updateTwitterTrends() {
  const trendParams = {id: woeid_japan };
  const trends = await client.get('trends/place', trendParams).catch(err=>null)
  twitterTrends = trends[0].trends.map((d, index) => {
    return {
      no: index+1,
      word: d.name,
      by: 'Twitter(JP)'
    }
  })
}

const retweeted = []
let searched = []
async function search(trend) {
  const searchParams = {
    q: trend.word,
    lang: 'ja',
    locale: 'ja',
    //result_type: 'popular',
    //result_type: 'mixed',
    result_type: 'recent',
    count: 10
  }
  const tweets = await client.get('search/tweets', searchParams).catch(err=>null)
  if (!tweets) {
    return null;
  }
  const filtered_tweets = tweets.statuses.filter(t=>!retweeted.includes(t.id_str))
  if (filtered_tweets.length == 0) {
    return null;
  }
  searched.push(trend.word)
  return _.shuffle(filtered_tweets)[0]
}

async function retweet(tweet) {
  const res = await client.post('statuses/retweet/'+tweet.id_str, {id: tweet.id_str})
    .catch(e => {
      console.log(JSON.stringify(e, null, '  '));
      return null;
    })
  if (res) {
    retweeted.push(tweet.id_str)
  }
  return res;
}

let yokoku = []
function setYokoku(filteredTrends) {
  if (filteredTrends.length > 10) {
    yokoku = _.shuffle(filteredTrends).slice(0, 10);
    return;
  }

  console.log('### short yokoku ###')
  yokoku = filteredTrends;
  console.log('#1. before yokoku:', yokoku)
  searched = [];
  filteredTrends = twitterTrends.filter(t=>!yokoku.find(y=>y.word==t.word))
  console.log('#2. twitterTrends:', twitterTrends)
  console.log('#3. filteredTrends:', filteredTrends)
  yokoku = yokoku.concat(_.shuffle(filteredTrends).slice(0, 10-yokoku.length));
  console.log('#4. after yokoku:', yokoku)
}

async function tweetYokoku() {
  const list = yokoku.map(y=>`・${y.word}`).join("\n")
  const text = `【次10回予告】\n${list}`.substr(0, 140)
  console.log('text:', text)
  const tweetParams = {
    status: text
  }
  const tweets = await client.post('statuses/update', tweetParams).catch(err=>{
    console.log('yokoku error:', err)
  })
}

async function main() {
  console.log('---------start main---------')

  if (yokoku.length == 0) {
    await genYokoku();
  }

  const trend = yokoku.shift();
  console.log('target trend:', trend);

  const tweet = await search(trend);
  console.log('tweet:', {id_str: tweet.id_str, text: tweet.text });

  const res = await retweet(tweet);
  console.log('result:', res != null ? 'ok' : 'ng');
}

async function genYokoku() {
  await updateTwitterTrends();
  console.log('updated twitterTrends:', twitterTrends.map(t=>t.word))

  let filteredTrends = twitterTrends.filter(t=>!searched.includes(t.word))
  if (filteredTrends.length == 0) {
    searched = [];
    filteredTrends = twitterTrends;
  }
  console.log('filteredTrends:', filteredTrends.map(t=>t.word))

  setYokoku(filteredTrends);
  console.log('yokoku:', yokoku)

  tweetYokoku();
}

process.on('tick', main);

function tick() {
  process.emit('tick');
  setTimeout(tick, 1000*60*5)
}

tick();
