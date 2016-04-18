/**
 * Compose an array of generator functions
 * and returns an array of execution output.
 *
 * Unlike simpler koa-compose,
 * it supports mutable array, which means
 * you could add additional tasks after current task.
 * 
 * In our case, we compile the template,
 * then push generator helpers into the array.
 * While parsing the array, additional generator helpers, when found,
 * are spliced into the array right after current generator helper.
 * Ultimately, we could preserve the exection order as 
 * the generator hepers appear in the template.
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

function passthrough(o) { return o;}

function* head(next) { return yield *next;}
function* halt() {} //jshint ignore:line

function* advance(arr, unwrap, context, result) {
  result = result || [];

  // trip over the edge in order to
  // check for new items that have been pushed into the array
  var next = (arr.index === arr.length) ? halt : advance;
  var out = yield *(unwrap(arr[arr.index++]) || head).call(context, next(arr, unwrap, context, result));

  result.push(out);

  return result;
}

module.exports = function(arr, unwrap) {
  var context = this;

  // indicating which of those have been executed
  arr.index = arr.index || 0;

  unwrap = unwrap || passthrough;
  // item wrapping (eg. Promisify)
  // is supported but not needed at the moment

  return function* () {
    var result = yield advance(arr, unwrap, context);

    // minus one
    // since we trip over the arr bound by one
    result.shift();
    result = result.reverse();

    return result;
  };
};
