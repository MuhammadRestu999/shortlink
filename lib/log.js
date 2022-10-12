let { color } = require("./color");


module.exports.LOG = function(txt) {
  console.log(color("[ LOG ] ", "cyan") + (txt || "Example"))
}

module.exports.INFO = function(txt) {
  console.log(color("[ INFO ] ", "cyan") + (txt || "Example"))
}

module.exports.SUCC = function(txt) {
  console.log(color("[ SUCCESS ] ", "lime") + (txt || "Example"))
}

module.exports.WARN = function(txt) {
  console.log(color("[ WARNING ] ", "yellow") + (txt || "Example"))
}

module.exports.ERR = function(txt) {
  console.log(color("[ ERROR ] ", "red") + (txt || "Example"))
}
