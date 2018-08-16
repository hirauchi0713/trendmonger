const puppOpt = { }
if (process.env.PUPP_EXECUTABLE_PATH) {
  puppOpt.executablePath = process.env.PUPP_EXECUTABLE_PATH
}
const Puppeteer = require('./src/Puppeteer.js')
const puppeteer = new Puppeteer(puppOpt)

const Trend = require('./Trend')

class TrendScraper extends Trend {
  constructor(state, key, url) {
    super(state, key)
    this.url = url
    console.log('TrendScraper key, url:', this.key, this.url)
  }

  async update() {
    const trends = await puppeteer.get(this.url, this.updateMain)
    this.setTrends(trends)
  }

}

module.exports = TrendScraper
