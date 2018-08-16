const twitter = require('twitter');

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
  filter('RTなら弾く',                                     t=>t.retweeted_status),
  filter('すでにリツイートしてるなら弾く',                 t=>t.retweeted),
  filter('最後が…で切れてるのは判定できないので弾く',     t=>t.text.match(/…$/)),
  filter('長すぎるのは切れてるかもしれないので弾く',       t=>t.text.length>=138),
  filter('ハッシュが２個以上あるならスパムっぽいので弾く', t=>t.counter(t.text, /[#＃]/) >= 2),
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
  filter('メンションは弾く',                               t=>counter(t.text, /^@/)>=1),
  filter('メンションは弾く',                               t=>counter(t.text, /^.@/)>=1),
  filter('メンションは弾く',                               t=>counter(t.text, /^..@/)>=1),
  filter('メンションは弾く',                               t=>counter(t.text, /[^R][^T][^ ]@/)>=1), // 公式RTはOK
  filter('RT欲しがりは弾く',                               t=>counter(t.text, /RT/)>=2),
  filter('RT欲しがりは弾く',                               t=>counter(t.text, /ＲＴ/)>=2),
  filter('いいね欲しがりは弾く',                           t=>t.text.match(/いいね/)),
]

module.exports = class Twitter {
  constructor(opt) {
    this.opt = opt
    this.client = new twitter(opt)
  }

  async keywordSearch(word) {
    const opt = {
      q: word,
      lang: 'ja',
      locale: 'ja',
      result_type: 'recent',
      count: 100
    }
    const tweets = await this.client.get('search/tweets', opt).catch(err=>{
      console.log('Twitter keywordSearch Error: client.get(search/tweets)', opt, err)
      return null
    })
    if (! tweets) { return [] }

    return tweets.statuses.filter(t=>{
      return !filters.some(f=>!!f(t))
    })
  }

  async tweet(text) {
    const tweet = await this.client.post('statuses/update', { status: text }).catch(err=>{
      console.log('tweet error:', err)
    })
    if (! tweet) {
      return false
    }
    console.log('tweet ok:', tweet)
    return true
  }

  async tweetKeywordSearch(opt) {
    const url = `https://twitter.com/${opt.user_name}/status/${opt.id_str}`
    const text = `${opt.source} ${opt.rank} 『${opt.keyword}』 ${url}`
    return await this.tweet(text)
  }

  async tweetIntroduction(opt) {
    const text = `${opt.source} ${opt.rank} ${opt.url}`
    return await this.tweet(text)
  }

}
