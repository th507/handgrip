var assert = require("chai").assert;
var sinon = require("sinon");
var co = require("co");
var _hbs = require("../");

suite("generator helper nesting", function() {
  test("generator helper nesting", function (done) {
    this.timeout(1000);
    var job = sinon.spy();
    var hbs = _hbs.create();
    
    var mockyB = "Inception";
    var mockyA = "Alice says hi ";

    var subtemplate = '{{request mockyB}}';
    var template = '1.{{request mockyA}}2.{{request mockyB}}';
    var data = { mockyB: mockyB, mockyA: mockyA };

    hbs.registerGeneratorHelper("request", function(name) {
      return function*(next) {
        job.call();
        var resA = yield Promise.resolve(name);

        var subres = "";

        // prevent infinite loop
        if (name === mockyA) {
          var xtra = hbs.compile(subtemplate);
          subres = xtra(this);
        }

        yield next;
        
        return resA + subres;
      };
    });

    var cache = hbs.render(template);

    co(function*(){
      var output = yield *cache(data);
      assert(job.called);
      assert.equal(output, "1.Alice says hi Inception2.Inception");
    }).then(done);
  });
});
