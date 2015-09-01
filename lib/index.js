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

var Q = "__GeneratorHelperQueue__";

// export a new instance of Handgrip
module.exports = Handgrip();
// mock handlebars.create
module.exports.create = Handgrip;

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
        while (len--) args[len] = arguments[len];

        // execute helper to examine 
        // whether it is generatorHelper or not
        var tuple = fn.apply(this, args);

        // compatible with traditional `registerHelper` calls
        if (!isGeneratorFunction(tuple)) return tuple;

        // wrap generate function in a data structure
        tuple = Wrapper.wrap(tuple);

        if (Q in this) {
            // each order level has its own spliceOffset
            if (!has(this, "spliceOffset")) this.spliceOffset = 0;
            this[Q].splice(this[Q].index + this.spliceOffset, 0, tuple);
            this.spliceOffset++;
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
    // avoid memory leak by cloning arguments
    var len = arguments.length;
    var args = Array(len);
    while (len--) args[len] = arguments[len];

    var compiled = this.compile.apply(this, args);
    return createRenderer(compiled);
}

/**
 * Adapt normal handlebars compiled template
 * by filling placeholder created by generatorHelper
 **/
function createRenderer(compiled) {
    return function*(context) {
        // create a safe copy of the context
        // so that all each layer has its own generator helpers queue
        context = Object.create(context || null);

        context[Q] = context[Q] || [];
        // execution index;
        context[Q].index = context[Q].index || 0;

        var args = Array.prototype.slice.call(arguments);
        args[0] = context;

        var out = compiled.apply(null, args);

        return yield replace.call(context, context[Q], out);
    };
}

/**
 * Replace generator helper placeholder with compiled content
 * requires valid context from its caller (hbs.render)
 **/
function *replace(fnArr, str) {
    // parse generator queue from leaft to right
    // this could mutate fnArr if new generator helpers are found
    var ret = yield compose.call(this, fnArr, Wrapper.unwrap);

    var retObj = {};
    fnArr.forEach(function(item, i) {
        retObj[item.toString()] = ret[i];
    });

    // create an array of uuid from generator queue
    var gidRegExp = Wrapper.toRegExp( Object.keys(retObj) );

    function strReplace(match, gid) {
        return retObj[gid];
    }

    // replace all generator helper placeholder
    var maxExecutionCount = 9999;
    do {
        str = str.replace(gidRegExp, strReplace);
    } while (gidRegExp.test(str) && maxExecutionCount--);

    return str;
}

/**
 * Check if function is generator function
 **/
function isGeneratorFunction(fn) {
    return fn && fn.constructor && fn.constructor.name === "GeneratorFunction";
}
