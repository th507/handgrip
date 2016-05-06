module.exports = List

/**
 * Class List create a linked list from Node
 * @constructor
 **/
function List() {
  // create an empty node
  var node = new Node_()

  // `this.head`: first node of the list
  this.head = node

  // `this.current`: current visiting node
  this.current = node
}

/**
 * Add item to the list
 * @param value
 **/
List.prototype.add = function(value) {
  var current = this.current
  var tail = current.tail
  var node = new Node_(value, tail.next)
  current.tail = tail.next = node
}

/**
 * Class Node to make up a linked list
 * @param value
 * @param next
 * @constructor
 **/
function Node_(value, next) {
  this.value = value
  this.next = next
  this.tail = this
}
