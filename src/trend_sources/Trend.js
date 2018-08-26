const logger = require('gorilog')('trend_source/Trend')

class Trend {
  static errorHandler(err) {
    logger.error('err:', err)
    return null
  }

  constructor(data, key) {
    this.data = data
    this.key = key
  }

  getTrends() {
    return this.data[this.key]
  }

  setTrends(t) {
    this.data[this.key] = t == null ? [] : t
  }

  hasTrends() {
    //return this.getTrends() != null && this.getTrends().length != 0
    return false // for #18: とりいそぎキーワードは毎回updateすることにする
  }

  async update() {
    logger.debug('update start')
    if (this.hasTrends()) { logger.debug('skip update'); return }

    logger.debug('updating...')
    this.setTrends(await this.updateMain())

    logger.debug('update finished')
  }

  async updateMain() {
    throw new Error('not implemented')
  }

}

module.exports = Trend
