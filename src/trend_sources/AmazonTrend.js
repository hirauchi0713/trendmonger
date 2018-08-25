const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://www.amazon.co.jp/trends/aps'

class AmazonTrend extends TrendScraper {
  constructor(state, key) {
    console.log('AmazonTrend.constructor:', state, key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
      const trends = [];
      document.querySelectorAll('.trending-keyword').forEach(d=>{
        trends.push(d.textContent.trim())
      })
      return trends
        .map((d, index)=>{
          return {
            no: index+1,
            word: d,
            by: 'Amazon'
          }
        })
    }).catch(Trend.errorHandler)
  }
}

module.exports = AmazonTrend
