/**
 * Wrap generator function in a new data structure
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var uuidgen = require("./uuid")

module.exports = Tuple

/**
 * Wrap generator helper function in a data structure
 **/
function Tuple(fn) {
  if (fn instanceof Tuple) return fn

  if (typeof fn !== "function") {
    throw "Cannot wrap non-function"
  }

  this.gid = uuidgen()
  this.value = fn
}

Tuple.prototype.toString = function() {
  return this.gid
}

/**
 * Unwrap composed execution output
 **/
Tuple.prototype.unwrap = function() {
  return this.value
}
