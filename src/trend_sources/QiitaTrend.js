const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://qiita.com/'
const logger = require('gorilog')('trend_sources/QiitaTrend')

class QiitaTrend extends TrendScraper {
  constructor(state, key) {
    logger.debug('constructor', key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    logger.debug('parsing...')
    const trends = await page.evaluate(() => {
      const trends = [];
      document.querySelectorAll('a.tr-Item_title').forEach((e,idx)=>{
        const url = 'https://qiita.com'+e.getAttribute('href')
        trends.push({
          rank: `${idx+1}位`,
          word: url,
          by: 'Qiita',
          url: url,
          type: 'intro'
        })
      })
      return trends
    }).catch(Trend.errorHandler)
    logger.debug('parsed', trends.length)
    logger.trace('trends', trends)
    return trends.slice(0, 20)
  }
}

module.exports = QiitaTrend
