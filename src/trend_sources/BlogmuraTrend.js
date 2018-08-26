const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://www.blogmura.com/ranking_entry.html'
const logger = require('gorilog')('trend_sources/BlogmuraTrend')

class BlogmuraTrend extends TrendScraper {
  constructor(state, key) {
    logger.debug('constructor', key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    logger.debug('parsing...')
    const trends = await page.evaluate(() => {
      const trends = [];
      document.querySelectorAll('li.entry-rankingtitle > a:nth-child(2)').forEach((e,idx)=>{
        const url = e.getAttribute('href').replace(/^.*url=/, '').replace(/%3A/g, ':').replace(/%2F/g, '/')
        trends.push({
          rank: `${idx+1}位`,
          word: url,
          by: 'にほんブログ村注目記事',
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

module.exports = BlogmuraTrend
