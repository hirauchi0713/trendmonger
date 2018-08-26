const pup = require('puppeteer')
const logger = require('gorilog')('Puppeteer')

module.exports = class Puppeteer {
  constructor(opt) {
    this.opt = opt
  }

  async get(url, func) {
    logger.debug('Puppeteer', 1, url)
    const browser = await pup.launch(this.opt).catch(err=>{
      logger.error('puppeteer.lanch err', err)
      return null
    })
    if (! browser) { return null }

    logger.debug('Puppeteer', 2, url)
    const page = await browser.newPage().catch(err=>{
      logger.error('browser.newPage error', err)
      return null
    })
    if (! page) { return null }

    logger.debug('Puppeteer', 3, url)
    const myua = 'トレンドbot@trendmonger1'
    logger.trace('myua:', myua)
    await page.setUserAgent(myua)
    logger.trace('UA:', await page.evaluate('navigator.userAgent'))
    const err = await page.goto(url).catch(err=>{
      logger.error('page.goto error', err)
      return null
    })
    if (! err) { return null }

    logger.debug('Puppeteer', 4, url)
    const result = await func(page).catch(err=>{
      logger.error('func error', err)
      return null
    })

    logger.debug('Puppeteer', 5, url)
    browser.close()

    logger.debug('Puppeteer', 'end', url)
    return result
  }
}
