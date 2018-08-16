const twitter = require('twitter');
const _ = require('underscore');
const Store = require('./Store')


require('dotenv').config();

process.on('unhandledRejection', console.dir);

function randomGet(array) {
  return array[Math.floor(Math.random() * array.length)];
}

const twopt = {
  consumer_key:        process.env.TW_CONSUMER_KEY,
  consumer_secret:     process.env.TW_CUNSUMER_SECRET,
  access_token_key:    process.env.TW_TOKEN_KEY,
  access_token_secret: process.env.TW_TOKEN_SECRET,
}

const client = new twitter(twopt);

const Twitter = require('./src/Twitter.js')
const tw2 = new Twitter(twopt)

const state = new Store(__dirname + '/.state.js')
state.load({
  twitterTrends : [],
  buhitterTrends: [],
  amazonTrends  : [],
  googleTrends  : [],
  retweeted     : [],
  searched      : [],
  yokoku        : [],
})


const trends = [
  new (require('./QiitaTrend.js')   )(state.data, 'qiitaTrends'),
  new (require('./BlogmuraTrend.js'))(state.data, 'blogmuraTrends'),
  new (require('./YoutubeTrend.js') )(state.data, 'youtubeTrends'),
  new (require('./HatebuTrend.js')  )(state.data, 'hatebuTrends'),
  new (require('./TwitterTrend.js') )(state.data, 'twitterTrends', client),
  new (require('./HatenaTrend.js')  )(state.data, 'hatenaTrends'),
  new (require('./GoogleTrend.js')  )(state.data, 'googleTrends'),
  new (require('./BuhitterTrend.js'))(state.data, 'buhitterTrends'),
  new (require('./GithubTrend.js')  )(state.data, 'githubTrends'),
  new (require('./AmazonTrend.js')  )(state.data, 'amazonTrends'),
]

async function search(trend) {
  console.log('search: start search/tweets')
  const filtered_tweets = await tw2.keywordSearch(trend.word)
  console.log('search: end search/tweets')
  return _.shuffle(filtered_tweets)[0]
}

async function retweet(tweet, trend) {
  if (! tweet) {
    return null
  }
  //const res = await client.post('statuses/retweet/'+tweet.id_str, {id: tweet.id_str})
  const res = await tw2.tweetKeywordSearch({
      keyword: trend.word,
      source: trend.by,
      rank: `${trend.no}位`,
      user_name: tweet.user.screen_name,
      id_str: tweet.id_str
    })
    .catch(e => {
      console.log(JSON.stringify(e, null, '  '));
      return null;
    })
  return res;
}

async function raw_retweet(tweet, trend) {
  // const res = await client.post('statuses/retweet/'+id_str, {id: id_str})
  const res = await tw2.tweetIntroduction({
      source: trend.by,
      rank: trend.rank ? trend.rank : `${trend.no}位`,
      url: trend.url
    })
    .catch(e => {
      console.log(JSON.stringify(e, null, '  '));
      return null;
    })
  return res;
}

function getAllTrends() {
  return _.flatten(trends.map(t=>t.getTrends()))
}

const YOKOKU_SIZE = 5
function setYokoku(filteredTrends) {
  if (filteredTrends.length > YOKOKU_SIZE) {
    state.data.yokoku = _.shuffle(filteredTrends).slice(0, YOKOKU_SIZE);
    return;
  }

  console.log('### short yokoku ###')
  state.data.yokoku = filteredTrends;
  console.log('#1. before yokoku:', state.data.yokoku)
  state.data.searched = [];
  filteredTrends = getAllTrends().filter(t=>!state.data.yokoku.find(y=>y.word==t.word))
  console.log('#2. twitterTrends:', state.data.twitterTrends)
  console.log('#3. filteredTrends:', filteredTrends)
  state.data.yokoku = state.data.yokoku.concat(_.shuffle(filteredTrends).slice(0, YOKOKU_SIZE-state.data.yokoku.length));
  console.log('#4. after yokoku:', state.data.yokoku)
}

async function tweetYokoku() {
  const list = state.data.yokoku.map(y=>{
    return `・ ${y.word} ${y.no}位 ${y.by}`
  }).join("\n")

  const text = `【次${YOKOKU_SIZE}回予告】\n${list}`.substr(0, 140)
  console.log('text:', text)
  await tw2.tweet(text)
}

async function main() {
  console.log('---------start main---------')

  if (state.data.yokoku.length == 0) {
    await genYokoku();
  }

  const trend = state.data.yokoku.shift();
  state.data.searched.push(trend.word)
  console.log('target trend:', trend);

  if (trend.type === 'intro') {
    const res = await raw_retweet(trend.id_str, trend);
    console.log('result:', res != null ? 'ok' : 'ng');
  } else {
    const tweet = await search(trend);
    if (tweet) {
      console.log('tweet:', {id_str: tweet.id_str, text: tweet.text, verified: tweet.user.verified });

      const res = await retweet(tweet, trend);
      console.log('result:', res != null ? 'ok' : 'ng');
    } else {
      console.log('no tweet');
    }
  }
  state.save()
  console.log('---------end main---------')
}

async function genYokoku() {
  console.log('genYokoku')

  for(let i = 0; i < trends.length; i++) {
    const t = trends[i]
    await t.update()
    console.log(`updated ${t.key}:`, t.getTrends().map(t=>t.word))
  }

  let allTrends = getAllTrends()

  let filteredTrends = allTrends.filter(t=>!state.data.searched.includes(t.word))
  if (filteredTrends.length == 0) {
    state.data.searched = [];
    filteredTrends = getAllTrends()
  }
  console.log('filteredTrends:', filteredTrends.map(t=>t.word))

  setYokoku(filteredTrends);
  console.log('yokoku:', state.data.yokoku)

  // tweetYokoku();
}

process.on('tick', main);

function tick() {
  process.emit('tick');
  setTimeout(tick, 1000*60*5)
}


!(async() => {
  try {
    tick();
  } catch(e) {
    console.error(e)
  }
})()
