const puppeteer = require('puppeteer')
const twitter = require('twitter');
const _ = require('underscore');
const Store = require('./Store')

require('dotenv').config();

// Hatena
// http://d.hatena.ne.jp/keyword/

module.exports = Store
const puppOpt = { }

if (process.env.PUPP_EXECUTABLE_PATH) {
  puppOpt.executablePath = process.env.PUPP_EXECUTABLE_PATH
}

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

const state = new Store(__dirname + '/.state.js')
state.load({
  twitterTrends: [],
  amazonTrends : [],
  googleTrends : [],
  retweeted    : [],
  searched     : [],
  yokoku       : [],
})

async function updateTwitterTrends() {
  const trendParams = {id: woeid_japan };
  const trends = await client.get('trends/place', trendParams).catch(err=>null)
  if (! trends) {
    return []
  }
  state.data.twitterTrends = trends[0].trends.map((d, index) => {
    return {
      no: index+1,
      word: d.name,
      by: ''
    }
  })
}

function errorHandler(err) {
  console.log('err:', err)
  return null
}

async function updateGoogleTrends() {
  const browser = await puppeteer.launch(puppOpt).catch(errorHandler)
  if (! browser) return

  const page = await browser.newPage().catch(errorHandler)
  if (! page) { browser.close(); return }

  const err = await page.goto('https://trends.google.co.jp/trends/trendingsearches/daily?geo=JP').catch(errorHandler)
  if (! err) { browser.close(); return }

  state.data.googleTrends = await page.evaluate(() => {
    let trends = [];
    document
      .querySelector('.feed-list-wrapper')
      .querySelectorAll('.details-top a').forEach(d=>{
        trends.push(d.textContent.trim())
      })
    return trends
      .map((d, index)=>{
        return {
          no: index+1,
          word: d,
          by: '(Google)'
        }
      });
  }).catch(errorHandler)
  if (! state.data.googleTrends) {
    state.data.googleTrends = []
  }
  browser.close()
}

async function updateAmazonTrends() {
  const browser = await puppeteer.launch(puppOpt).catch(errorHandler)
  if (! browser) return

  const page = await browser.newPage().catch(errorHandler)
  if (! page) { browser.close(); return }

  const err = await page.goto('https://www.amazon.co.jp/trends/aps').catch(errorHandler)
  if (! err) { browser.close(); return }

  state.data.amazonTrends = await page.evaluate(() => {
    let trends = [];
    document.querySelectorAll('.trending-keyword').forEach(d=>{
      trends.push(d.textContent.trim())
    })
    return trends
      .map((d, index)=>{
        return {
          no: index+1,
          word: d,
          by: '(Amazon)'
        }
      });
  }).catch(errorHandler)
  if (! state.data.amazonTrends) {
    state.data.amazonTrends = []
  }
  browser.close()
}

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
  //console.log('tweets(before filter)', tweets.statuses.map(d=>{return {id_str: d.id_str, text: d.text, sname: d.user.screen_name, name: d.user.name, verified: d.user.verified}}))
  const filtered_tweets = tweets.statuses.filter(t=>{
    if (state.data.retweeted.includes(t.id_str))   { return false } // すでにリツイートしてるなら弾く
    if (t.text.match(/トレンド/))             { return false } // トレンド系は弾く
    if (t.text.match(/フォロー/))             { return false } // フォロー勧誘系は弾く
    if (t.user.screen_name.match(/trend/i))   { return false } // トレンド系は弾く
    if (t.user.name.match(/トレンド/))        { return false } // トレンド系は弾く
    if (t.user.verified)                      { return false } // 公式アカウントは弾く
    if (t.user.name.match(/公式/))            { return false } // 公式アカウントは弾く
    if (t.user.name.match(/フォロー/))        { return false } // フォロー勧誘系は弾く
    if (t.user.name.match(/bot/i))            { return false } // bot系は弾く
    return true
  })
  //console.log('tweets(after filter)', filtered_tweets.map(d=>{return {id_str: d.id_str, text: d.text, sname: d.user.screen_name, name: d.user.name, verified: d.user.verified}}))
  //console.log('tweets(after filter) count', filtered_tweets.length)
  if (filtered_tweets.length == 0) {
    return null;
  }
  state.data.searched.push(trend.word)
  return _.shuffle(filtered_tweets)[0]
}

async function retweet(tweet) {
  const res = await client.post('statuses/retweet/'+tweet.id_str, {id: tweet.id_str})
    .catch(e => {
      console.log(JSON.stringify(e, null, '  '));
      return null;
    })
  if (res) {
    state.data.retweeted.push(tweet.id_str)
  }
  return res;
}

function getAllTrends() {
  return state.data.twitterTrends.concat(state.data.googleTrends).concat(state.data.amazonTrends)
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
  const tweetParams = {
    status: text
  }
  const tweets = await client.post('statuses/update', tweetParams).catch(err=>{
    console.log('yokoku error:', err)
  })
}

async function main() {
  console.log('---------start main---------')

  if (state.data.yokoku.length == 0) {
    await genYokoku();
  }

  const trend = state.data.yokoku.shift();
  console.log('target trend:', trend);

  const tweet = await search(trend);
  console.log('tweet:', {id_str: tweet.id_str, text: tweet.text, verified: tweet.user.verified });

  const res = await retweet(tweet);
  console.log('result:', res != null ? 'ok' : 'ng');

  state.save()
}

async function genYokoku() {
  console.log('genYokoku')

  await updateTwitterTrends();
  console.log('updated twitterTrends:', state.data.twitterTrends.map(t=>t.word))

  await updateGoogleTrends().catch(e=>console.log(e));
  console.log('updated googleTrends:', state.data.googleTrends.map(t=>t.word))

  await updateAmazonTrends().catch(e=>console.log(e));
  console.log('updated amazonTrends:', state.data.amazonTrends.map(t=>t.word))

  let allTrends = getAllTrends()

  let filteredTrends = allTrends.filter(t=>!state.data.searched.includes(t.word))
  if (filteredTrends.length == 0) {
    state.data.searched = [];
    filteredTrends = getAllTrends()
  }
  console.log('filteredTrends:', filteredTrends.map(t=>t.word))

  setYokoku(filteredTrends);
  console.log('yokoku:', state.data.yokoku)

  tweetYokoku();
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
