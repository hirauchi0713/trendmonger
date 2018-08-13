const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://trends.google.co.jp/trends/trendingsearches/daily?geo=JP'

class GoogleTrend extends TrendScraper {
  constructor(state, key) {
    console.log('GoogleTrend.constructor:', state, key, TargetURL)
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
      const trends = [];
      document
        .querySelector('.feed-list-wrapper')
        .querySelectorAll('.details-top a').forEach(d=>{
          trends.push(d.textContent.trim())
        })
      return trends
        .map((d, index)=>{
          return {
            no: index+1,
            word: d,
            by: '(Google)'
          }
        });
    }).catch(Trend.errorHandler)
  }
}

module.exports = GoogleTrend
