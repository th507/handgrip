var assert = require("chai").assert;
var sinon = require("sinon");
var co = require("co");
var _hbs = require("../");

suite("generator helper nesting", function() {
    test("evaluation order of nested helpers", function (done) {
        this.timeout(1000);
        var job = sinon.spy();
        var hbs = _hbs.create();

        var mockyB = "B";
        var mockyA = "A";

        var subtemplate = '{{gn mockyB order=1.1}}';
        var template = '1.{{gn mockyA order=1.0}}2.{{gn mockyB order=2.0}}';
        var data = { mockyB: mockyB, mockyA: mockyA };

        var evalOrder = [];

        hbs.registerGeneratorHelper("gn", function(name, options) {
            return function*(next) {
                job.call();
                var resA = yield Promise.resolve(name);

                evalOrder.push("pre-" + options.hash.order);

                var subres = "";

                // prevent infinite loop
                if (name === mockyA) {
                    var xtra = hbs.compile(subtemplate);
                    subres = xtra(Object.create(this));
                }

                yield next;

                evalOrder.push("post-" + options.hash.order);
                
                return resA + subres;
            };
        });

        var cache = hbs.render(template);

        co(function*(){
            var output = yield *cache(data);
            assert(job.called);
            assert.equal(output.toString(), "1.AB2.B");
            assert.equal(evalOrder.toString(), "pre-1,pre-1.1,pre-2,post-2,post-1.1,post-1");
            done();
        });
    });

    test("evaluation order of nested helpers with partial", function (done) {
        this.timeout(1000);
        var job = sinon.spy();
        var hbs = _hbs.create();

        var mockyB = "B";
        var mockyA = "A";

        var subtemplate = '{{>pa}}';
        var pa = "{{gn mockyB order=1.1}}";
        var template = '1.{{gn mockyA order=1.0}}2.{{gn mockyB order=2.0}}';
        var data = { mockyB: mockyB, mockyA: mockyA };

        var evalOrder = [];

        var p = hbs.compile(pa);
        hbs.registerPartial("pa", p);

        hbs.registerGeneratorHelper("gn", function(name, options) {
            return function*(next) {
                job.call();
                var resA = yield Promise.resolve(name);

                evalOrder.push("pre-" + options.hash.order);

                var subres = "";

                // prevent infinite loop
                if (name === mockyA) {
                    var xtra = hbs.compile(subtemplate);
                    subres = xtra(Object.create(this));
                }

                yield next;

                evalOrder.push("post-" + options.hash.order);
                
                return resA + subres;
            };
        });

        var cache = hbs.render(template);

        co(function*(){
            var output = yield *cache(data);
            assert(job.called);
            assert.equal(output.toString(), "1.AB2.B");
            assert.equal(evalOrder.toString(), "pre-1,pre-1.1,pre-2,post-2,post-1.1,post-1");
            done();
        });
    });

    test('evaluation order of nested generator helpers', function (done) {
        this.timeout(2000);
        var job = sinon.spy();
        var hbs = _hbs.create();

        var mockyB = "B";
        var mockyA = "A";

        var template = '1.{{#gn mockyA order=1.0}}{{gn mockyB order=1.1}}{{/gn}}2.{{gn mockyB order=2.0}}';
        var data = { mockyB: mockyB, mockyA: mockyA };

        var evalOrder = [];

        hbs.registerGeneratorHelper("gn", function(name, options) {
            return function*(next) {
                job.call();
                var resA = yield Promise.resolve(name);

                evalOrder.push("pre-" + options.hash.order);

                var subres = "";

                // prevent infinite loop
                if (options.fn) {
                    subres = options.fn(this);
                }

                yield next;

                evalOrder.push("post-" + options.hash.order);

                return resA + subres;
            };
        });

        var cache = hbs.render(template);

        co(function*(){
            var output = yield *cache(data);
            assert(job.called);
            assert.equal(output.toString(), "1.AB2.B");
            assert.equal(evalOrder.toString(), "pre-1,pre-2,pre-1.1,post-1.1,post-2,post-1");
            done();
        });
    });
});

