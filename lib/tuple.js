/**
 * Wrap generator function in a new data structure
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var uuidgen = require("./uuid")

var hbs = require('handlebars')

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

/**
 * Create placeholder for generator helper
 **/
Tuple.prototype.toPlaceholder = function () {
  return new hbs.SafeString(toPlaceholder(this.gid))
}

/**
 * Create placeholder for generator helper
 **/
function toPlaceholder(str) {
  return `<!--!gid!::${str}::!gid!-->`
}
