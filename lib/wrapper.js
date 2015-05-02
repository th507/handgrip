/**
 * Wrap generator function in a new data structure
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var uuidgen = require("./uuid");

module.exports.wrap = wrap;
module.exports.unwrap = unwrap;

module.exports.toPlaceholder = toPlaceholder;
module.exports.toRegExp = toRegExp;

/**
 * Unwrap composed execution output
 **/
function unwrap(o) {
  return o && o.value;
}

/**
 * Wrap generator helper function in a data structure
 **/
function wrap(fn) {
    if (typeof fn === "function") {
        return {
            gid: uuidgen(),
            value: fn,
            toString: function() {
                return this.gid;
            }
        };
    }

    // if the argument given already has an gid
    if (fn.gid) {
        fn.gid = uuidgen();

        return fn;
    }
}

/**
 * Create placeholder for generator helper
 **/ 
function toPlaceholder(str) {
    return "<!--!gid!::" + ( str.gid || str || "" ) + "::!gid!-->";
}

/**
 * Create regular expressions to match
 * previously generated placeholders
 **/
function toRegExp(params) {
    if (Array.isArray(params)) {
        params = "(" + params.join("|") + ")";
    }
    return new RegExp(toPlaceholder(params), "g");
}
