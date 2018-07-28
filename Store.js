const fs = require('fs')

class Store {
  constructor(filePath) {
    this.filePath = filePath
  }

  load(initData) {
    let json = null
    try {
      json = fs.readFileSync(this.filePath)
    } catch(e) {
      this.data = initData
      return
    }
    this.data = JSON.parse(json)
  }

  save() {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
  }

}

module.exports = Store
