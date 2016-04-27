/**
 * Extend Handlebars to support generator helper
 *
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var Wrapper = require("./wrapper");
var compose = require("./compose");
var handlebars = require("handlebars");
// the callee may have null as prototype
var has = Function.call.bind(Object.prototype.hasOwnProperty);

var T = "__GeneratorHelperTree__";

// export a new instance of Handgrip
module.exports = Handgrip();

/**
 * Augment Handlebars
 **/
function Handgrip() {
  // always create a new instance of Handlebars
  var hbs = handlebars.create();

  // create a new instance of Handgrip
  hbs.create = Handgrip;

  hbs.registerGeneratorHelper = registerGeneratorHelper;
  hbs.render = render;
  hbs.createRenderer = createRenderer;
  hbs.createFrame = handlebars.createFrame;

  // export a method to retrive the raw handlebars
  hbs.createHandlebars = handlebars.create();

  return hbs;
}

/**
 * Register generator helpers
 * does not support object input
 **/
function registerGeneratorHelper(fnName, fn) {
  var hbs = this;
  if (typeof fnName === "object") {
    Object.keys(fnName).forEach(function(n) {
      hbs.registerGeneratorHelper(n, fnName[n]);
    });

    return;
  }

  return hbs.registerHelper(fnName, function() {
    // avoid memory leak by cloning arguments
    var len = arguments.length;
    var args = Array(len);
    while (len-- > 0) args[len] = arguments[len];

    var options = args[args.length - 1];
    var root = options && options.data && options.data.root || this;

    // execute helper to examine
    // whether it is generatorHelper or not
    var tuple = fn.apply(this, args);

    // compatible with traditional `registerHelper` calls
    if (!isGeneratorFunction(tuple)) return tuple;

    // wrap generate function in a data structure
    tuple = Wrapper.wrap(tuple);

    if (T in root) {
      var head = root[T].head;
      head.children.push({gn: tuple, children: []});
    }

    var placeholder = Wrapper.toPlaceholder(tuple);

    return new hbs.SafeString(placeholder);
  });
}

/**
 * Compile method for page(root scope) rendering only
 * does not apply to rendering in generator helper
 * use traditional handlebars.compile/tpl() inside generator helpers
 **/
function render() {
  var compiled = this.compile.apply(this, arguments);
  return createRenderer(compiled);
}

/**
 * Adapt normal handlebars compiled template
 * by filling placeholder created by generatorHelper
 **/
function createRenderer(compiled) {
  return function*(context_) {
    // avoid memory leak by cloning arguments
    var len = arguments.length;
    var args = Array(len);
    while (len-- > 0) args[len] = arguments[len];

    var context = context_ || {};

    context[T] = {
      root: {
        children: []
      }
    };
    context[T].head = context[T].root;

    args[0] = context;

    var out = compiled.apply(null, args);

    var result = yield replace(context[T], out, context);

    context[T] = null;
    return result;
  };
}

/**
 * Replace generator helper placeholder with compiled content
 * requires valid context from its caller (hbs.render)
 **/
function *replace(fnTree, str, context) {
  // parse generator queue from leaft to right
  // this could mutate fnArr if new generator helpers are found
  var retObj = yield compose(fnTree, Wrapper.unwrap, context);

  // create an array of uuid from generator queue
  var gidRegExp = Wrapper.toRegExp(Object.keys(retObj));

  function strReplace(match, gid) {
    return retObj[gid];
  }

  // replace all generator helper placeholder
  var maxExecutionCount = 9999;
  do {
    str = str.replace(gidRegExp, strReplace);
  } while (gidRegExp.test(str) && maxExecutionCount-- > 0);

  return str;
}

/**
 * Check if function is generator function
 **/
function isGeneratorFunction(fn) {
  return fn && fn.constructor && fn.constructor.name === "GeneratorFunction";
}
