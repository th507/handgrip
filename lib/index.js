/**
 * Extend Handlebars to support generator helper
 *
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var Tuple = require("./tuple")
var List = require("./linked-list")
var compose = require("./compose")
var handlebars = require("handlebars")

var L = "__GeneratorHelperList__"

// export a new instance of Handgrip
module.exports = Handgrip()

/**
 * Augment Handlebars
 **/
function Handgrip() {
  // always create a new instance of Handlebars
  var hbs = handlebars.create()

  // export a method to retrive the raw handlebars
  hbs.createHandlebars = handlebars.create

  hbs.registerGeneratorHelper = registerGeneratorHelper
  hbs.render = render
  hbs.createRenderer = createRenderer

  // create a new instance of Handgrip
  hbs.create = Handgrip

  return hbs
}

/**
 * Register generator helpers
 * does not support object input
 **/
function registerGeneratorHelper(fnName, fn) {
  var hbs = this
  if (typeof fnName === "object") {
    Object.keys(fnName).forEach(function(n) {
      hbs.registerGeneratorHelper(n, fnName[n])
    })

    return
  }

  return hbs.registerHelper(fnName, function() {
    // avoid memory leak by cloning arguments
    var len = arguments.length
    var args = Array(len)
    while (len-- > 0) args[len] = arguments[len]

    // execute helper to examine
    // whether it is generatorHelper or not
    var gn = fn.apply(this, args)

    // compatible with traditional `registerHelper` calls
    if (!isGeneratorFunction(gn)) return gn

    // wrap generate function in a data structure
    var tuple = new Tuple(gn)

    var root = findRoot(args) || this
    // as long as `root[L]` is defined
    // it's an instance of List
    if (L in root) root[L].add(tuple)

    // place a text placeholder for further reference
    return tuple.toPlaceholder()
  })
}

function findRoot(args) {
  var options = args[args.length - 1]
  return options && options.data && options.data.root
}

/**
 * Compile method for page(root scope) rendering only
 * does not apply to rendering in generator helper
 * use traditional handlebars.compile/tpl() inside generator helpers
 **/
function render() {
  var compiled = this.compile.apply(this, arguments)
  return createRenderer(compiled)
}

/**
 * Adapt normal handlebars compiled template
 * by filling placeholder created by generatorHelper
 **/
function createRenderer(compiled) {
  return function*(context_) {
    // avoid memory leak by cloning arguments
    var len = arguments.length
    var args = Array(len)
    while (len-- > 0) args[len] = arguments[len]

    var context = context_ || {}

    context[L] = new List()

    args[0] = context

    var template = compiled.apply(null, args)

    var result = yield replace(context[L], template, context)

    context[L] = template = args = null
    return result
  }
}

/**
 * Replace generator helper placeholder with compiled content
 * requires valid context from its caller (hbs.render)
 **/
function *replace(fnList, template, context) {
  // parse generator queue from leaft to right
  // this could mutate fnArr if new generator helpers are found
  var result = yield compose(fnList, context)

  // create an array of uuid from generator queue
  var gidRegExp = toRegExp(Object.keys(result))

  function getPlaceholderContent(_, gid) {
    return result[gid]
  }

  // replace all generator helper placeholder
  // loop a few times to deal with nested generator helpers
  var maxExecutionCount = 9999
  do {
    template = template.replace(gidRegExp, getPlaceholderContent)
  } while (gidRegExp.test(template) && maxExecutionCount-- > 0)

  result = null
  return template
}

/**
 * Check if function is generator function
 **/
function isGeneratorFunction(fn) {
  return fn && fn.constructor && fn.constructor.name === "GeneratorFunction"
}

/**
 * Create placeholder for generator helper
 **/
function toPlaceholder(str) {
  return `<!--!gid!::${str}::!gid!-->`
}

/**
 * Create regular expressions to match
 * previously generated placeholders
 **/
function toRegExp(params) {
  if (Array.isArray(params)) {
    params = "(" + params.join("|") + ")"
  }
  return new RegExp(toPlaceholder(params), "g")
}
