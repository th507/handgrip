/**
 * Compose an array of generator functions
 * and returns an array of execution output.
 *
 * Unlike simpler koa-compose,
 * it supports mutable array,
 * you could add additional tasks after current task.
 * 
 * In our case, we could parse the template,
 * pushing generator helpers into the array.
 * While parsing the array, additional generator helpers, when found,
 * are pushed into the array right after current generator helper.
 * In the end, we could preserve the same exection order as 
 * the generator hepers appear in the template.
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

function passthrough(o) { return o;}

function* head(next) { return yield *next;}
function* halt() {} //jshint ignore:line

module.exports = function(arr, unwrap) {
    var context = this;
    // arr execution output
    var out = [];
    // indicating which of those have been executed
    arr.index = arr.index || 0;

    // if unwrap function are found specified, return itself
    unwrap = unwrap || passthrough;

    // item wrapping is supported but not needed at the moment


    function* advance() {
        // trip over the edge in order to
        // check for new items that have been pushed into the array
        var next = (arr.index === arr.length) ? halt : advance;
        var res = yield *(unwrap(arr[arr.index++]) || head).call(context, next());

        out.push(res);
    }

    return function* () {
        yield * head( advance() );

        // minus one
        // since we trip over the arr bound by one
        out.shift();
        out = out.reverse();

        return out;
    };
};
