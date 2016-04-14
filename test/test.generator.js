var assert = require("chai").assert;
var sinon = require("sinon");
var co = require("co");
var _hbs = require("../");

suite("generator helper", function() {
  test("Simple generator helper", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{gn 'foo'}}";
      var hbs = _hbs.create();
      hbs.registerGeneratorHelper("gn", function(name) {
        return function *(next) {
          job.call();

          yield next;

          return new hbs.SafeString( name );
        };
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job.called);
      assert.equal(res, "foo");

    }).then(done);
  });

  test("Multiple generator helper", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{gn 'foo'}}{{gn 'bar'}}";
      var hbs = _hbs.create();
      hbs.registerGeneratorHelper("gn", function(name) {
        return function *(next) {
          job.call();

          yield next;

          return new hbs.SafeString( name );
        };
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job.called);
      assert.equal(res, "foobar");
    }).then(done);
  });

  test("Register generator helper in object notation", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{foo 'foo'}}";
      var hbs = _hbs.create();
      hbs.registerGeneratorHelper({
        foo: function(name) {
          return function *(next) {
            job.call();

            yield next;

            return new hbs.SafeString( name );
          };
        }
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job.called);
      assert.equal(res, "foo");
    }).then(done);
  });

  test("Register multiple generator helpers in object notation", function (done) {
    this.timeout(1000);
    var job1 = sinon.spy();
    var job2 = sinon.spy();
    co(function*() {
      var template = "{{foo 'foo'}}{{bar 'bar'}}";
      var hbs = _hbs.create();
      hbs.registerGeneratorHelper({
        foo: function(name) {
          return function *(next) {
            job1.call();

            yield next;

            return new hbs.SafeString( name );
          };
        },
        bar: function(name) {
          return function *(next) {
            job2.call();

            yield next;

            return new hbs.SafeString( name );
          };
        }
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job1.called);
      assert(job2.called);
      assert.equal(res, "foobar");
    }).then(done);
  });


  test("Compatible with traditional registerHelper", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
        var template = "{{hfn 'foo'}}";
        var hbs = _hbs.create();
        hbs.registerGeneratorHelper("hfn", function(name) {
          job.call();
          return new hbs.SafeString( name );
        });

        var compiled = hbs.render(template);

        var res = yield *compiled(null);

        assert(job.called);
        assert.equal(res, "foo");
    }).then(done);
  });

  test("Mixing traditional helper and generatorHelper", function (done) {
    this.timeout(1000);
    var job1 = sinon.spy();
    var job2 = sinon.spy();
    co(function*() {
      var template = "{{foo 'foo'}}{{bar 'bar'}}";
      var hbs = _hbs.create();
      hbs.registerGeneratorHelper({
        foo: function(name) {
          job1.call();
          return new hbs.SafeString( name );
        },
        bar: function(name) {
          return function *(next) {
            job2.call();

            yield next;

            return new hbs.SafeString( name );
          };
        }
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job1.called);
      assert(job2.called);
      assert.equal(res, "foobar");
    }).then(done);
  });

  test("Registering generator helper in a partial", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{>pa}}{{gn 'bar'}}";
      var pa = "{{gn 'foo'}}";
      var hbs = _hbs.create();
      hbs.registerPartial("pa", pa);

      hbs.registerGeneratorHelper("gn", function(name) {
        return function *(next) {
          job.call();

          yield next;

          return new hbs.SafeString( name );
        };
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job.called);
      assert.equal(res, "foobar");
    }).then(done);
  });

  test("Registering generator helper in a compiled partial", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{>pa}}{{gn 'bar'}}";
      var pa = "{{gn 'foo'}}";
      var hbs = _hbs.create();
      hbs.registerPartial("pa", hbs.compile(pa));

      hbs.registerGeneratorHelper("gn", function(name) {
        return function *(next) {
          job.call();

          yield next;

          return new hbs.SafeString( name );
        };
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job.called);
      assert.equal(res, "foobar");
    }).then(done);
  });

  test("Registering generator helper in a block helper", function(done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{#block}}{{gn 'foo'}}{{/block}}";
      var hbs = _hbs.create();
      
      hbs.registerGeneratorHelper({
        gn: function(name) {
          return function *(next) {
            job.call();

            yield next;

            return new hbs.SafeString( name );
          };
        },
        block: function() {
          var args = [].slice.call(arguments);
          var options = args.pop();

          return options.fn(this);
        }
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job.called);
      assert.equal(res, "foo");
    }).then(done);
  });

  test("Registering generator helper in a block helper with conditional statement", function(done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{#block 'foo'}}{{gn 'foo'}}{{else}}{{gn 'bar'}}{{/block}}{{#block 'bar'}}{{gn 'foo'}}{{else}}{{gn 'bar'}}{{/block}}";
      var hbs = _hbs.create();

      hbs.registerGeneratorHelper({
        gn: function(name) {
          return function *(next) {
            job.call();

            yield next;

            return new hbs.SafeString( name );
          };
        },
        block: function() {
          var args = [].slice.call(arguments);
          var options = args.pop();
          var name = args.pop();

          if (name === "foo") {
            return options.fn(this);
          }
          else {
            return options.inverse(this);
          }
        }
      });

      var compiled = hbs.render(template);

      var res = yield *compiled(null);

      assert(job.called);
      assert.equal(res, "foobar");
    }).then(done);
  });

  test('Registering generator helper in a `each` helper', function(done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{#each array}}{{gn this}}{{/each}}";
      var hbs = _hbs.create();

      hbs.registerGeneratorHelper({
        gn: function (name) {
          return function *(next) {
            job.call();
            yield next;
            return new hbs.SafeString( name );
          };
        }
      });

      var compiled = hbs.render(template);
      var res = yield *compiled({array: ['foo', 'bar', 3]});

      assert(job.called);
      assert(res, 'foobar3');
    }).then(done);
  });

  test('Registering generator helper in a `with` helper', function(done) {
    this.timeout(1000);
    var job = sinon.spy();
    co(function*() {
      var template = "{{#with obj}}{{gn foo}}{{/with}}";
      var hbs = _hbs.create();

      hbs.registerGeneratorHelper({
        gn: function (name) {
          return function *(next) {
            job.call();
            yield next;
            return new hbs.SafeString( name );
          };
        }
      });

      var compiled = hbs.render(template);
      var res = yield *compiled({obj: {foo: 'bar'}});

      assert(job.called);
      assert(res, 'bar');
    }).then(done);
  });
});
