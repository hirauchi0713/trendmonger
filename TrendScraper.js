const puppeteer = require('puppeteer')
const puppOpt = { }
if (process.env.PUPP_EXECUTABLE_PATH) {
  puppOpt.executablePath = process.env.PUPP_EXECUTABLE_PATH
}

const Trend = require('./Trend')

class TrendScraper extends Trend {
  constructor(state, key, url) {
    super(state, key)
    this.url = url
  }

  async update() {
    console.log('TrendScraper 1')
    if (this.hasTrends()) { return }

    const browser = await puppeteer.launch(puppOpt).catch(err=>{
      console.log('puppeteer lanch err', err)
      return null
    })

    console.log('TrendScraper 2')
    //const page = await browser.newPage().catch(Trend.errorHandler)
    const page = await browser.newPage().catch(err=>{
      console.log('browser.newPage error', err)
      return null
    })
    if (! page) { return }

    console.log('TrendScraper 3')
    const err = await page.goto(this.url).catch(Trend.errorHandler)
    //const err = await page.goto(this.url).catch(err=>null)
    if (! err) { return }

    console.log('TrendScraper 4')
    const trends = await page.evaluate(this.updateMain).catch(Trend.errorHandler)

    console.log('TrendScraper 5')
    this.setTrends(trends)

    console.log('TrendScraper 6')
    page.close()

    console.log('TrendScraper 7')
    browser.close()

    console.log('TrendScraper end')
  }

}

module.exports = TrendScraper
