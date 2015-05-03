Handgrip: Enable generator helpers for Handlebars
=======

Handgrip is a simple wrapper the enables the use of generator  inside normal [Handelbars][handlebars] helper.

In addition to supporting generator functions, Handgrip keeps the order of executing generator helpers as you write them on template.

[![Build Status][travis-badge]][travis-url]
[![NPM version][npm-badge]][npm-package]
[![License][license-badge]][license]


Best suited/tested with [Koa][koa] or [co][co].

## Install
```javascript
$ npm install handgrip
```

## Generator Helpers
This is an example of basic usage of generator helper.
Return a generator function with `next` as the single argument, just like [Koa’s middleware][middleware.gif]. 
`yield next` tells Handgrip to continue parsing the rest of the template.

```javascript
var hbs = require("handgrip");
var request = require("co-request");

hbs.registerGeneratorHelper("ip", function() {
	return function *(next) {
		var ip = yield request("http://canihazip/s");

		yield next;

		return new hbs.SafeString(ip);
	};
});
```



Another interesting example of generator helper is to create composable component with Handgrip/Handlebars helpers.
Here, a CSS declaration helper will keep tracks of all component CSS on this page.

```html
<!doctype html>
<html>
<head>
{{css "bootstrap"}}
</head>

<body>
<nav>...</nav>
{{component "list"}}
{{component "carousel"}}
</body>
</html>
```

```javascript
var hbs = require("handgrip");

hbs.registerGeneratorHelper({
	// gathering all component CSS and write it in <head>
	css: function(name) {
		this._CSS = name.split(",");

		return function*(next) {
			yield next;

			var css = this._CSS.reduce(function(a, b) {
				return a + '<link href="' + b + '" rel="stylesheet" />';
			}, "");

			return new hbs.SafeString( css );
		};
	},
	// run component logic and 
	// report its CSS
	component: function(name) {
		return function *(next) {
			this._CSS = this._CSS || [];
			if (name) this._CSS.push(name);

			// insert your magic here
			...
			yield next;

			return new hbs.SafeString( ... );
		}
	}
});
```

Nested generator helper is also supported. Checkout `test/` folder to see more example on that.

## Normal Helpers
`registerGeneratorHelper` does support normal Handlebars helper as well, just like using the plain Handlebars. Here is an example of registered multiple helper

```javascript
var hbs = require("handgrip");
var request = require("co-request");

hbs.registerGeneratorHelper({
	hello: function(name) {
		var out = '<b>' + name + '</b> says hello.';
		
		return new hbs.SafeString(out);
	},
	ip: function() {
		return function *(next) {
			var ip = yield request("http://canihazip/s");
	
			yield next;
	
			return new hbs.SafeString(ip);
		}
	}
});
```

## Compiling
#### Compile template string

```javascript
var handgrip = require("handgrip");

var tpl = handgrip.render(template, options);
var body = yield tpl(data);
```

`Handgrip.render` accepts the same parameters and `Handlebars.compile` and returns a generator function.

#### Convert Handblebars compiled `templateFn` to a Handgrip-compatible one

```javascript
var handlebars = require("handlebars");
var handgrip = require("handgrip");

// create a compile templateFn
// You could use handgrip.compile(...) as well
var tpl = handlebars.compile(template);

// convert to to Handgrip-compatible
var renderer = Handgrip.createRenderer(tpl);
var body = yield renderer(data);
```

`Handgrip.compile` is the same as `Handlebars.compile`.

## Implementaion and caveats (Must-see for layout users)
Handgrip keeps an array of generator functions for each `render` job.

When Handlebars finishes parsing the template, it replaces those generator helper with placeholder of UUIDs. Then Handgrip begins parsing the generator array and mutate the array as new generator helpers are found, finally Handgrip fills the results back to their corresponding places.

The common way of implementing layout (as found in [express-hbs][express-hbs] and [koa-hbs][koa-hbs]) is to render the template as string, then create another separate rendering process for layout. Unfornately, this trivial approach is not feasbile with the implementation of Handgrip, since splitting the rendering process means losing track of generator helpers in main template.

However, there is also an easy way of implementing layout with Handgrip.

Layout template:
```html
<!doctype html>
<html>
<head>
{{css}}
{{js}}
...
</head>
<body>
{{__body__}}
</body>
</html>
```

Main template:
```html
{{registerCSS "foo"}}
{{registerJS "bar"}}
{{pageTitle}}

{{#layout "layoutName"}}
	<!-- your content goes here -->
	...
{{/layout}}

```

Layout helper (JS):
```javascript
var hbs = require("handgrip");
hbs.registerHelper("layout", layout);

function layout(layoutName, options) {
	this.__body__ = options.fn.bind(null, this);

	// read layout file into template string
	var layoutTpl = findByName(layoutName);
	// this is the same as handlebars.compile(...)
	return hbs.compile(layoutTpl, this);
}
```

## Build
This is normally used on the server side, so there is no minified version (yet).

## Tests
Tested on

- Handlebars: 2.0.2, 3.0.3
- co: 3.0+, 4.0+
- Node: 0.11.14 or higher
- iojs: 1.0.2 or higher


Run the test

```bash
$ npm install
$ npm test
```

## License
Copyright (c) 2015 Jingwei "John" Liu

Licensed under the MIT license.

[koa]: https://github.com/koajs/koa/
[middleware.gif]: https://raw.githubusercontent.com/koajs/koa/master/docs/middleware.gif
[handlebars]: http://handlebarsjs.com
[co]: https://github.com/tj/co
[koa-hbs]: https://github.com/jwilm/koa-hbs
[express-hbs]: https://github.com/barc/express-hbs
[travis-badge]: https://img.shields.io/travis/th507/handgrip.svg?style=flat-square
[npm-badge]: https://img.shields.io/npm/v/handgrip.svg?style=flat-square
[license-badge]: http://img.shields.io/npm/l/handgrip.svg?style=flat-square
[travis-url]: https://travis-ci.org/th507/handgrip
[npm-package]: https://www.npmjs.com/package/handgrip
[license]: LICENSE
