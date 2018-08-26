const twitter = require('twitter');
const Trend = require('./Trend')
const logger = require('gorilog')('trend_sources/TwitterTrend')

// https://lab.syncer.jp/Tool/WOEID-Lookup/
const woeid_japan = '23424856';

class TwitterTrend extends Trend {
  constructor(state, key, client) {
    super(state, key)
    this.client = client
  }

  async updateMain() {
    const trendParams = {id: woeid_japan };

    logger.debug('getting...')
    const trends = await this.client.get('trends/place', trendParams).catch(Trend.errorHandler)
    if (! trends) {
      logger.debug('no trends')
      return []
    }
    logger.debug('got trends', trends.length)
    return trends[0].trends.map((d, index) => {
      return {
        no: index+1,
        word: d.name,
        by: 'Twitter'
      }
    })
  }

}

module.exports = TwitterTrend
