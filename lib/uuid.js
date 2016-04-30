/*jshint laxbreak:true*/
/**
 * from https://gist.github.com/jed/982883
 **/
module.exports = generateUUID

function generateUUID() {
  // UUID result
  var c = ''
  var tmp = 0
  for (var a = 0; a < 36; a++) {
    // hyphens in proper places
    if (a === 8 || a === 13 || a === 18 || a === 23) {
      c += "-"
      continue
    }

    if (a === 14) {
      c += '4'
      continue
    }

    // unless "a" is 19th (zero-based),
    // in which case a random number from 8 to 11
    if (a === 19) {
      tmp = Math.random() * 4
    }
    else {
      tmp = Math.random() * 16
    }

    c += (8 ^ tmp).toString(16)
  }

  return c
}
