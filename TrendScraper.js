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
    console.log('TrendScraper key, url:', this.key, this.url)
  }

  async update() {
    console.log('TrendScraper 1', this.key)
    if (this.hasTrends()) { return }

    console.log('TrendScraper 1-2')
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

    console.log('TrendScraper 4', this.updateMain)
    //const trends = await page.evaluate(this.updateMain).catch(Trend.errorHandler)
    const trends = await this.updateMain(page).catch(Trend.errorHandler)

    console.log('TrendScraper 5', trends)
    this.setTrends(trends)

    console.log('TrendScraper 7')
    browser.close()

    console.log('TrendScraper end')
  }

}

module.exports = TrendScraper
