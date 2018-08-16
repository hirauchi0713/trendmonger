const pup = require('puppeteer')

module.exports = class Puppeteer {
  constructor(opt) {
    this.opt = opt
  }

  async get(url, func) {
    console.log('Puppeteer', 1, url)
    const browser = await pup.launch(this.opt).catch(err=>{
      console.log('puppeteer.lanch err', err)
      return null
    })
    if (! browser) { return null }

    console.log('Puppeteer', 2, url)
    const page = await browser.newPage().catch(err=>{
      console.log('browser.newPage error', err)
      return null
    })
    if (! page) { return null }

    console.log('Puppeteer', 3, url)
    const err = await page.goto(url).catch(err=>{
      console.log('page.goto error', err)
      return null
    })
    if (! err) { return null }

    console.log('Puppeteer', 4, url)
    const result = await func(page).catch(err=>{
      console.log('func error', err)
      return null
    })

    console.log('Puppeteer', 5, url)
    browser.close()

    console.log('Puppeteer', 'end', url)
    return result
  }
}
