const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://qiita.com/'

class QiitaTrend extends TrendScraper {
  constructor(state, key) {
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
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
      return trends.slice(0, 20)
    }).catch(Trend.errorHandler)
  }
}

module.exports = QiitaTrend
