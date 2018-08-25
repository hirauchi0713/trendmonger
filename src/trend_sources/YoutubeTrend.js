const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://www.youtube.com/feed/trending'

class YoutubeTrend extends TrendScraper {
  constructor(state, key) {
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
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
      return trends.slice(0, 20)
    }).catch(Trend.errorHandler)
  }
}

module.exports = YoutubeTrend
