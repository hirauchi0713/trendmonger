const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'http://github-trends.ryotarai.info/rss/github_trends_all_daily.rss'
const logger = require('gorilog')('trend_sources/GithubTrend')

class GithubTrend extends TrendScraper {
  constructor(state, key) {
    logger.debug('constructor', key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    logger.debug('parsing...')
    const trends = await page.evaluate(() => {
      const trends = []
      document.querySelectorAll('item title').forEach((d,idx)=>{
        trends.push({
          no: idx+1,
          word: d.textContent.replace(/ (.*)/, ''),
          by: 'Github'
        })
      })
      return trends
    }).catch(Trend.errorHandler)
    logger.debug('parsed', trends.length)
    logger.trace('trends', trends)
    return trends.slice(0, 20) // 上位20位
  }

}

module.exports = GithubTrend
