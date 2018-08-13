const puppeteer = require('puppeteer')
const twitter = require('twitter');
const _ = require('underscore');
const Store = require('./Store')

require('dotenv').config();

const TwitterTrend = require('./TwitterTrend.js')


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

const twitterTrends = new TwitterTrend(state.data, 'twitterTrends', client)


async function updateTwitterTrends() {
  await twitterTrends.update()
}

function errorHandler(err) {
  console.log('err:', err)
  return null
}

const GoogleTrend = require('./GoogleTrend.js')
const googleTrends = new GoogleTrend(state, 'googleTrends')
async function updateGoogleTrends() {
  await googleTrends.update()
}

const BuhitterTrend = require('./BuhitterTrend.js')
const buhitterTrends = new BuhitterTrend(state, 'buhitterTrends')
async function updateBuhitterTrends() {
  await buhitterTrends.update()
}

async function updateGithubTrends() {
  const browser = await puppeteer.launch(puppOpt).catch(errorHandler)
  if (! browser) return

  const page = await browser.newPage().catch(errorHandler)
  if (! page) { browser.close(); return }

  const err = await page.goto('http://github-trends.ryotarai.info/rss/github_trends_all_daily.rss').catch(errorHandler)
  if (! err) { browser.close(); return }

  state.data.githubTrends = await page.evaluate(() => {
    let trends = [];
    document.querySelectorAll('item title').forEach((d,idx)=>{
      trends.push({
        no: idx+1,
        word: d.textContent.replace(/ (.*)/, ''),
        by: '(Github)'
      })
    })
    return trends.slice(0, 5) // 上位5位
  }).catch(errorHandler)

  if (! state.data.githubTrends) {
    state.data.githubTrends = []
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
    count: 100
  }
  console.log('search: start search/tweets')
  const tweets = await client.get('search/tweets', searchParams).catch(err=>null)
  console.log('search: end search/tweets')
  if (!tweets) {
    return null;
  }
  //console.log('tweets(before filter)', tweets.statuses.map(d=>{return {id_str: d.id_str, text: d.text, sname: d.user.screen_name, name: d.user.name, verified: d.user.verified}}))
  function counter(str,seq) {
      return str.split(seq).length - 1;
  }
  function filter(name, cond) {
    return function(t) {
      if (cond(t)) {
        console.log(`FILTERED[${name}]:`, t)
        return true
      } else {
        return false
      }
    }
  }
  const filters = [
    filter('すでにリツイートしてるなら弾く',                 t=>t.retweeted),
    filter('不適切かもしれないのは弾く',                     t=>t.possibly_sensitive),
    filter('トレンド系は弾く',                               t=>t.text.match(/トレンド/)),
    filter('フォロー勧誘系は弾く',                           t=>t.text.match(/フォロー/)),
    filter('フォロー勧誘系は弾く',                           t=>t.text.match(/フォロ爆/)),
    filter('トレンド系は弾く',                               t=>t.text.match(/HOTワード/i)),
    filter('amazonアフィリエイト系は弾く',                   t=>t.text.match(/amzn\.to/)),
    filter('トレンド系は弾く',                               t=>t.user.screen_name.match(/trend/i)),
    filter('トレンド系は弾く',                               t=>t.user.name.match(/トレンド/)),
    filter('公式アカウントは弾く',                           t=>t.user.verified),
    filter('公式アカウントは弾く',                           t=>t.user.name.match(/公式/)),
    filter('フォロー勧誘系は弾く',                           t=>t.user.name.match(/フォロー/)),
    filter('フォロー勧誘系は弾く',                           t=>t.user.name.match(/フォロ爆/)),
    filter('bot系は弾く',                                    t=>t.user.name.match(/bot/i)),
    filter('ハッシュが２個以上あるならスパムっぽいので弾く', t=>counter(t.text, '#')>=2),
    filter('メンションは弾く',                               t=>counter(t.text, '@')>=1),
  ]
  const filtered_tweets = tweets.statuses.filter(t=>{
    return !filters.some(f=>f(t))
  })
  //console.log('tweets(after filter)', filtered_tweets.map(d=>{return {id_str: d.id_str, text: d.text, sname: d.user.screen_name, name: d.user.name, verified: d.user.verified}}))
  //console.log('tweets(after filter) count', filtered_tweets.length)
  if (filtered_tweets.length == 0) {
    return null;
  }
  return _.shuffle(filtered_tweets)[0]
}

async function retweet(tweet) {
  if (! tweet) {
    return null
  }
  const res = await client.post('statuses/retweet/'+tweet.id_str, {id: tweet.id_str})
    .catch(e => {
      console.log(JSON.stringify(e, null, '  '));
      return null;
    })
  return res;
}

async function raw_retweet(id_str) {
  const res = await client.post('statuses/retweet/'+id_str, {id: id_str})
    .catch(e => {
      console.log(JSON.stringify(e, null, '  '));
      return null;
    })
  return res;
}

function getAllTrends() {
  return state.data.twitterTrends
    .concat(state.data.googleTrends)
    .concat(state.data.amazonTrends)
    .concat(state.data.buhitterTrends)
    .concat(state.data.githubTrends)
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
  state.data.searched.push(trend.word)
  console.log('target trend:', trend);

  if (trend.by === '(Buhitter)') {
    const res = await raw_retweet(trend.id_str);
    console.log('result:', res != null ? 'ok' : 'ng');
  } else {
    const tweet = await search(trend);
    if (tweet) {
      console.log('tweet:', {id_str: tweet.id_str, text: tweet.text, verified: tweet.user.verified });

      const res = await retweet(tweet);
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

  await updateTwitterTrends();
  console.log('updated twitterTrends:', state.data.twitterTrends.map(t=>t.word))

  await updateGithubTrends();
  //console.log('updated githubTrends:', state.data.githubTrends.map(t=>t.word))
  console.log('updated githubTrends:', state.data.githubTrends)

  await updateBuhitterTrends();
  //console.log('updated buhitterTrends:', state.data.buhitterTrends.map(t=>t.word))
  console.log('updated buhitterTrends:', state.data.buhitterTrends)

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
