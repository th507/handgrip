/**
 * Compose a linked list of generator functions
 * and returns an object of execution output.
 *
 * Unlike simpler koa-compose,
 * the list is mutable, which means
 * additional tasks could be inserted after current task.
 *
 * In our case, we compile the template,
 * then push generator helpers into the list.
 * While parsing the list, additional generator helpers, when found,
 * are inserted right after current generator helper.
 * Ultimately, we could preserve the execution order as
 * the generator helpers appear in the template.
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

var unwrap = require("./wrapper").unwrap;

function* head(next) { return yield *next;}

function* next(list, context, result) {
  list.current = list.current.next;
  if (list.current) {
    yield advance(list, context, result);
  }  // else do nothing at the end of `list`
}

function* advance(list, context, result) {
  result = result || {};

  var cur = list.current;
  var gn = unwrap(cur.gn) || head;
  var out = yield * gn.call(context, next(list, context, result));

  if (cur.gn) {
    result[cur.gn.toString()] = out;
  }
  return result;
}

module.exports = advance;
