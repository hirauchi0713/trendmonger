const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://buhitter.com/trend'
const logger = require('gorilog')('trend_sources/BuhitterTrend')

class BuhitterTrend extends TrendScraper {
  constructor(state, key) {
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    logger.debug('parsing...')
    const trends =  await page.evaluate(() => {
      const trends = [];
      for(let i = 0; i < 20; i++) {
        const no = i+1
        const el = document.getElementById(`no${no}`)
        const words = []
        el.querySelectorAll('.account-link').forEach(e=>words.push(e.textContent.replace(/[ \n]*/, '')))
        const url = el.querySelector('.text-right a').getAttribute('href')
        trends.push({
          no: no,
          word: url,
          by: 'Buhitter',
          url: url,
          type: 'intro'
        })
      }
      return trends
    }).catch(Trend.errorHandler)
    logger.debug('parsed', trends.length)
    logger.trace('trends', trends)
    return trends
  }
}

module.exports = BuhitterTrend
