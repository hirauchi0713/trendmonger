const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'http://github-trends.ryotarai.info/rss/github_trends_all_daily.rss'

class GithubTrend extends TrendScraper {
  constructor(state, key) {
    console.log('GithubTrend.constructor:', state, key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
      console.log('github 1')
      const trends = []
      document.querySelectorAll('item title').forEach((d,idx)=>{
        console.log('github 2')
        trends.push({
          no: idx+1,
          word: d.textContent.replace(/ (.*)/, ''),
          by: '(Github)'
        })
      })
      console.log('github 3')
      return trends.slice(0, 5) // 上位5位
    }).catch(Trend.errorHandler)
  }

}

module.exports = GithubTrend
