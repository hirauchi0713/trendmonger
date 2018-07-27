const fs = require('fs')

function Store(filePath) {
  this.filePath = filePath
}

Store.prototype.load = function(initData) {
  let json = null
  try {
    json = fs.readFileSync(this.filePath)
  } catch(e) {
    this.data = initData
    return
  }
  this.data = JSON.parse(json)
}

Store.prototype.save = function() {
  fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2));
}

module.exports = Store
