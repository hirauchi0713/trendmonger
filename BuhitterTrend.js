const Trend = require('./Trend')
const TrendScraper = require('./TrendScraper')
const TargetURL = 'https://buhitter.com/trend'

class BuhitterTrend extends TrendScraper {
  constructor(state, key) {
    super(state, key, TargetURL)
  }

  async updateMain(page) {
    return await page.evaluate(() => {
      const trends = [];
      for(let i = 0; i < 20; i++) {
        const no = i+1
        const el = document.getElementById(`no${no}`)
        const words = []
        el.querySelectorAll('.account-link').forEach(e=>words.push(e.textContent.replace(/[ \n]*/, '')))
        trends.push({
          no: no,
          word: words[2],
          by: 'Buhitter',
          url: el.querySelector('.text-right a').getAttribute('href')
        })
      }
      return trends
    }).catch(Trend.errorHandler)
  }
}

module.exports = BuhitterTrend
