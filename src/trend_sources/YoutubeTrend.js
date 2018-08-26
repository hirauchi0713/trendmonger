const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://www.youtube.com/feed/trending'
const logger = require('gorilog')('trend_sources/YoutubeTrend')

class YoutubeTrend extends TrendScraper {
  constructor(state, key) {
    logger.debug('constructor', key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    logger.debug('parsing...')
    const trends = await page.evaluate(() => {
      const trends = [];
      document.querySelectorAll('a.yt-simple-endpoint.style-scope.ytd-video-renderer').forEach((e,idx)=>{
        const url = 'https://www.youtube.com'+e.getAttribute('href')
        trends.push({
          rank: `${idx+1}位`,
          word: url,
          by: 'Youtube急上昇',
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

module.exports = YoutubeTrend
