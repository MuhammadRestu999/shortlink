function makeId(length = 8) {
  let result = "";
  let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let lower = "abcdefghijklmnopqrstuvwxyz";
  let number = "0123456789";
  let all = upper + lower + number;

  while(result.length != length) result += all[Math.floor(Math.random() * all.length)];
  return result;
}

module.exports = {
  makeId
}
