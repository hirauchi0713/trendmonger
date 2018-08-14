
class Trend {
  static errorHandler(err) {
    console.log('err:', err)
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
