const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'http://b.hatena.ne.jp/hotentry/all'
const logger = require('gorilog')('trend_sources/HatebuTrend')

class HatebuTrend extends TrendScraper {
  constructor(state, key) {
    logger.debug('constructor', key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    logger.debug('parsing...')
    const trends = await page.evaluate(() => {
      const trends = [];
      document.querySelectorAll('.entrylist-contents').forEach(e=>{
        const users = e.querySelector('a.js-keyboard-entry-page-openable').textContent
        const url = e.querySelector('a.js-keyboard-openable').getAttribute('href')
        trends.push({
          rank: users,
          word: url,
          by: 'はてなブックマーク',
          url: url,
          type: 'intro'
        })
      })
      return trends
    }).catch(Trend.errorHandler)
    logger.debug('parsed', trends.length)
    logger.trace('trends', trends)
    function to_i(n) { return parseInt(n.rank.split(' ')[0]) }
    return trends.sort((x,y)=>to_i(y) - to_i(x)).slice(0, 20)
  }
}

module.exports = HatebuTrend
