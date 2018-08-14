const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'http://d.hatena.ne.jp/hotkeyword'

class HatenaTrend extends TrendScraper {
  constructor(state, key) {
    console.log('HatenaTrend.constructor:', state, key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
      const trends = [];
      document.querySelectorAll('.hot-title').forEach(d=>{
        trends.push(d.textContent.trim())
      })
      return trends
        .map((d, index)=>{
          return {
            no: index+1,
            word: d,
            by: '(Hatena)'
          }
        })
    }).catch(Trend.errorHandler)
  }
}

module.exports = HatenaTrend
