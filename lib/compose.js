/**
 * Traverse a tree of generator functions by depth first order
 * and returns an array of execution output.
 *
 * Unlike simpler koa-compose,
 * it supports mutable tree, which means
 * you could add additional tasks after current task.
 *
 * In our case, we compile the template,
 * then insert a root node into the tree.
 * While traversing the tree, additional generator helpers, when found,
 * are pushed into the array under the node of current generator helper.
 * Ultimately, we could preserve the execution order as
 * the generator helpers appear in the template.
 *
 * @author: Jingwei "John" Liu <liujingwei@gmail.com>
 **/

function passthrough(o) { return o;}

function* head(next) { return yield next;}

function* next(tree, unwrap, context, result, children) {
  for (var i = 0, l = children.length; i < l; i++) {
    // this is why `tree` must be accessible during traversing
    // assign `tree.head` here so that `root[T].head` is correct in ./index.js
    tree.head = children[i];
    yield traverse(tree, unwrap, context, result);
  }
}

function* traverse(tree, unwrap, context, result) {
  var cur = tree.head;
  var gn = unwrap(cur.gn) || head;
  var children = cur.children;

  var out = yield * gn.call(context, next(tree, unwrap, context, result, children));
  if (cur.gn) {
    result[cur.gn.toString()] = out;
  }
}

module.exports = function* (tree, unwrap, context) {
  // indicating which of those have been executed
  unwrap = unwrap || passthrough;

  var result = {};
  yield *traverse(tree, unwrap, context, result);

  return result;
};
