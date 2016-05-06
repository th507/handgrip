var assert = require("chai").assert
var sinon = require("sinon")
var co = require("co")
var _hbs = require("../")
var handlebars = require("handlebars")

suite("Handgrip function exports", function() {
  test("Handgrip#* exists", function() {
    var hbs = _hbs.create()
    assert(typeof hbs.createHandlebars === "function")
    assert(typeof hbs.registerGeneratorHelper === "function")
    assert(typeof hbs.create === "function")
    assert(typeof hbs.createRenderer === "function")
    assert(typeof hbs.render === "function")
  })

  test("Handgrip#create & Handgrip#createHandlebars", function() {
    var hbs = _hbs.create()
    assert(hbs.createHandlebars === handlebars.create)
    assert(hbs.create().create === hbs.create)

    var _handlebars = hbs.createHandlebars()
    var _original = handlebars.create()

    assert(_handlebars.constructor === _original.constructor)
    assert(_hbs.constructor === _original.constructor)
    assert(hbs.constructor === _original.constructor)
  })
})
