
class Trend {
  static errorHandler(err) {
    console.log('err:', err)
    return null
  }

  constructor(state, key) {
    this.state = state
    this.key = key
  }

  getTrends() {
    return this.state[this.key]
  }

  setTrends(t) {
    this.state[this.key] = t == null ? [] : t
  }

  hasTrends() {
    return this.getTrends() != null && this.getTrends().length != 0
  }

  async update(opt) {
    console.log('trend 1')
    if (this.hasTrends()) { return }

    console.log('trend 2')
    this.setTrends(await this.updateMain())

    console.log('trend 3')
  }

  async updateMain() {
    throw new Error('not implemented')
  }

}

module.exports = Trend
