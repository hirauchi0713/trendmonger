const logger = require('gorilog')('trend_sources/TrendScraper')

const puppOpt = { }
if (process.env.PUPP_EXECUTABLE_PATH) {
  puppOpt.executablePath = process.env.PUPP_EXECUTABLE_PATH
}
const Puppeteer = require('../Puppeteer.js')
const puppeteer = new Puppeteer(puppOpt)

const Trend = require('./Trend')

class TrendScraper extends Trend {
  constructor(state, key, url) {
    super(state, key)
    this.url = url
    logger.info('key and url:', this.key, this.url)
  }

  async update() {
    logger.debug('update start. updating...')
    const trends = await puppeteer.get(this.url, this.updateMain)

    this.setTrends(trends)
    logger.debug('update finished')
  }

}

module.exports = TrendScraper
