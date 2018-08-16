const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'http://b.hatena.ne.jp/hotentry/all'

class HatebuTrend extends TrendScraper {
  constructor(state, key) {
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
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
  }
}

module.exports = HatebuTrend
