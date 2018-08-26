const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://www.amazon.co.jp/trends/aps'
const logger = require('gorilog')('trend_sources/AmazonTrend')

class AmazonTrend extends TrendScraper {
  constructor(state, key) {
    logger.debug('constructor', key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    logger.debug('parsing...')
    const trends = await page.evaluate(() => {
      const trends = [];
      document.querySelectorAll('.trending-keyword').forEach(d=>{
        trends.push(d.textContent.trim())
      })
      return trends
    }).catch(Trend.errorHandler)
    logger.debug('parsed', trends.length)
    logger.trace('trends', trends)
    return trends
      .map((d, index)=>{
        return {
          no: index+1,
          word: d,
          by: 'Amazon'
        }
      })
  }
}

module.exports = AmazonTrend
