const puppeteer = require('puppeteer')
const twitter = require('twitter');
const _ = require('underscore');

require('dotenv').config();

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

let twitterTrends = []
async function updateTwitterTrends() {
  const trendParams = {id: woeid_japan };
  const trends = await client.get('trends/place', trendParams).catch(err=>null)
  twitterTrends = trends[0].trends.map((d, index) => {
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

let googleTrends = []
async function updateGoogleTrends() {
  const browser = await puppeteer.launch(puppOpt).catch(errorHandler)
  if (! browser) return

  const page = await browser.newPage().catch(errorHandler)
  if (! page) { browser.close(); return }

  const err = await page.goto('https://trends.google.co.jp/trends/trendingsearches/daily?geo=JP').catch(errorHandler)
  if (! err) { browser.close(); return }

  googleTrends = await page.evaluate(() => {
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
  if (! googleTrends) {
    googleTrends = []
  }
  browser.close()
}

let amazonTrends = []
async function updateAmazonTrends() {
  const browser = await puppeteer.launch(puppOpt).catch(errorHandler)
  if (! browser) return

  const page = await browser.newPage().catch(errorHandler)
  if (! page) { browser.close(); return }

  const err = await page.goto('https://www.amazon.co.jp/trends/aps').catch(errorHandler)
  if (! err) { browser.close(); return }

  amazonTrends = await page.evaluate(() => {
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
  if (! amazonTrends) {
    amazonTrends = []
  }
  browser.close()
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
  const filtered_tweets = tweets.statuses.filter(t=>{
    return !retweeted.includes(t.id_str) && !t.user.name.match(/トレンド/)
  })
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

function getAllTrends() {
  return twitterTrends.concat(googleTrends).concat(amazonTrends)
}

let yokoku = []
const YOKOKU_SIZE = 5
function setYokoku(filteredTrends) {
  if (filteredTrends.length > YOKOKU_SIZE) {
    yokoku = _.shuffle(filteredTrends).slice(0, YOKOKU_SIZE);
    return;
  }

  console.log('### short yokoku ###')
  yokoku = filteredTrends;
  console.log('#1. before yokoku:', yokoku)
  searched = [];
  filteredTrends = getAllTrends().filter(t=>!yokoku.find(y=>y.word==t.word))
  console.log('#2. twitterTrends:', twitterTrends)
  console.log('#3. filteredTrends:', filteredTrends)
  yokoku = yokoku.concat(_.shuffle(filteredTrends).slice(0, YOKOKU_SIZE-yokoku.length));
  console.log('#4. after yokoku:', yokoku)
}

async function tweetYokoku() {
  const list = yokoku.map(y=>{
    return `・${y.word} ${y.no}位 ${y.by}`
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

  await updateGoogleTrends();
  console.log('updated googleTrends:', googleTrends.map(t=>t.word))

  await updateAmazonTrends();
  console.log('updated amazonTrends:', amazonTrends.map(t=>t.word))

  let allTrends = getAllTrends()

  let filteredTrends = allTrends.filter(t=>!searched.includes(t.word))
  if (filteredTrends.length == 0) {
    searched = [];
    filteredTrends = getAllTrends()
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


!(async() => {
  try {
    tick();
  } catch(e) {
    console.error(e)
  }
})()
