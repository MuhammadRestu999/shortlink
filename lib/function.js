const crypto = require("crypto");


function makeId(length = 8) {
  return crypto.randomBytes(length).toString("hex").substr(0, length)
}

module.exports = {
  makeId
}
