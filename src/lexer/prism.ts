// @ts-nocheck
import type { Grammar, GrammarRest, TokenStream } from "prismjs";

/**
 * Prism: Lightweight, robust, elegant syntax highlighting
 *
 * @license MIT <https://opensource.org/licenses/MIT>
 * @author Lea Verou <https://lea.verou.me>
 * @namespace
 * @public
 */

// Private helper vars
let uniqueId = 0;

// The grammar object for plaintext
const plainTextGrammar = {};

/**
 * A namespace for utility methods.
 *
 * All function in this namespace that are not explicitly marked as _public_ are for __internal use only__ and may
 * change or disappear at any time.
 *
 * @namespace
 * @memberof Prism
 */
export const util = {
  encode(tokens) {
    if (tokens instanceof Token) {
      return new Token(tokens.type, util.encode(tokens.content), tokens.alias);
    } else if (Array.isArray(tokens)) {
      return tokens.map(util.encode);
    } else {
      return tokens.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\u00a0/g, ' ');
    }
  },

  /**
   * Returns the name of the type of the given value.
   *
   * @param {any} o
   * @returns {string}
   * @example
   * type(null)      === 'Null'
   * type(undefined) === 'Undefined'
   * type(123)       === 'Number'
   * type('foo')     === 'String'
   * type(true)      === 'Boolean'
   * type([1, 2])    === 'Array'
   * type({})        === 'Object'
   * type(String)    === 'Function'
   * type(/abc+/)    === 'RegExp'
   */
  type(o) {
    return Object.prototype.toString.call(o).slice(8, -1);
  },

  /**
   * Returns a unique number for the given object. Later calls will still return the same number.
   *
   * @param {Object} obj
   * @returns {number}
   */
  objId(obj) {
    if (!obj['__id']) {
      Object.defineProperty(obj, '__id', { value: ++uniqueId });
    }
    return obj['__id'];
  },

  /**
   * Creates a deep clone of the given object.
   *
   * The main intended use of this function is to clone language definitions.
   *
   * @param {T} o
   * @param {Record<number, any>} [visited]
   * @returns {T}
   * @template T
   */
  clone(o, visited?) {
    visited = visited || {};

    var clone; var id;
    switch (util.type(o)) {
      case 'Object':
        id = util.objId(o);
        if (visited[id]) {
          return visited[id];
        }
        clone = /** @type {Record<string, any>} */ ({});
        visited[id] = clone;

        for (var key in o) {
          if (o.hasOwnProperty(key)) {
            clone[key] = util.clone(o[key], visited);
          }
        }

        return /** @type {any} */ (clone);

      case 'Array':
        id = util.objId(o);
        if (visited[id]) {
          return visited[id];
        }
        clone = [];
        visited[id] = clone;

        (/** @type {Array} */(/** @type {any} */(o))).forEach(function (v, i) {
          clone[i] = util.clone(v, visited);
        });

        return /** @type {any} */ (clone);

      default:
        return o;
    }
  },
};

/**
 * This namespace contains all currently loaded languages and the some helper functions to create and modify languages.
 *
 * @namespace
 * @memberof Prism
 * @public
 */
export const languages: Record<string, GrammarRest> = {
  /**
   * The grammar for plain, unformatted text.
   */
  plain: plainTextGrammar,
  plaintext: plainTextGrammar,
  text: plainTextGrammar,
  txt: plainTextGrammar,
};

/**
 * This is the heart of Prism, and the most low-level function you can use. It accepts a string of text as input
 * and the language definitions to use, and returns an array with the tokenized code.
 *
 * When the language definition includes nested tokens, the function is called recursively on each of these tokens.
 *
 * This method could be useful in other contexts as well, as a very crude parser.
 *
 * @param {string} text A string with the code to be highlighted.
 * @param {Grammar} grammar An object containing the tokens to use.
 *
 * Usually a language definition like `Prism.languages.markup`.
 * @returns {TokenStream} An array of strings and tokens, a token stream.
 * @memberof Prism
 * @public
 * @example
 * let code = `var foo = 0;`;
 * let tokens = Prism.tokenize(code, Prism.languages.javascript);
 * tokens.forEach(token => {
 *     if (token instanceof Prism.Token && token.type === 'number') {
 *         console.log(`Found numeric literal: ${token.content}`);
 *     }
 * });
 */
export function tokenize(text: string, grammar: Grammar): TokenStream {
  var rest = grammar.rest;
  if (rest) {
    for (var token in rest) {
      grammar[token] = rest[token];
    }

    delete grammar.rest;
  }

  var tokenList = new LinkedList();
  addAfter(tokenList, tokenList.head, text);

  matchGrammar(text, tokenList, grammar, tokenList.head, 0);

  return toArray(tokenList);
}

// Typescript note:
// The following can be used to import the Token type in JSDoc:
//
//   @typedef {InstanceType<import("./prism-core")["Token"]>} Token

/**
 * Creates a new token.
 *
 * @param {string} type See {@link Token#type type}
 * @param {string | TokenStream} content See {@link Token#content content}
 * @param {string|string[]} [alias] The alias(es) of the token.
 * @param {string} [matchedStr=""] A copy of the full string this token was created from.
 * @class
 * @global
 * @public
 */
export function Token(type: string, content: string | TokenStream, alias: string | string[], matchedStr: string) {
  /**
   * The type of the token.
   *
   * This is usually the key of a pattern in a {@link Grammar}.
   *
   * @type {string}
   * @see GrammarToken
   * @public
   */
  this.type = type;
  /**
   * The strings or tokens contained by this token.
   *
   * This will be a token stream if the pattern matched also defined an `inside` grammar.
   *
   * @type {string | TokenStream}
   * @public
   */
  this.content = content;
  /**
   * The alias(es) of the token.
   *
   * @type {string|string[]}
   * @see GrammarToken
   * @public
   */
  this.alias = alias;
  // Copy of the full string this token was created from
  this.length = (matchedStr || '').length | 0;
}

/**
 * A token stream is an array of strings and {@link Token Token} objects.
 *
 * Token streams have to fulfill a few properties that are assumed by most functions (mostly internal ones) that process
 * them.
 *
 * 1. No adjacent strings.
 * 2. No empty strings.
 *
 *    The only exception here is the token stream that only contains the empty string and nothing else.
 *
 * @typedef {Array<string | Token>} TokenStream
 * @global
 * @public
 */

/**
 * @param {RegExp} pattern
 * @param {number} pos
 * @param {string} text
 * @param {boolean} lookbehind
 * @returns {RegExpExecArray | null}
 */
function matchPattern(pattern, pos, text, lookbehind) {
  pattern.lastIndex = pos;
  var match = pattern.exec(text);
  if (match && lookbehind && match[1]) {
    // change the match to remove the text matched by the Prism lookbehind group
    var lookbehindLength = match[1].length;
    match.index += lookbehindLength;
    match[0] = match[0].slice(lookbehindLength);
  }
  return match;
}

/**
 * @param {string} text
 * @param {LinkedList<string | Token>} tokenList
 * @param {any} grammar
 * @param {LinkedListNode<string | Token>} startNode
 * @param {number} startPos
 * @param {RematchOptions} [rematch]
 * @returns {void}
 * @private
 *
 * @typedef RematchOptions
 * @property {string} cause
 * @property {number} reach
 */
function matchGrammar(text, tokenList, grammar, startNode, startPos, rematch) {
  for (var token in grammar) {
    if (!grammar.hasOwnProperty(token) || !grammar[token]) {
      continue;
    }

    var patterns = grammar[token];
    patterns = Array.isArray(patterns) ? patterns : [patterns];

    for (var j = 0; j < patterns.length; ++j) {
      if (rematch && rematch.cause == token + ',' + j) {
        return;
      }

      var patternObj = patterns[j];
      var inside = patternObj.inside;
      var lookbehind = !!patternObj.lookbehind;
      var greedy = !!patternObj.greedy;
      var alias = patternObj.alias;

      if (greedy && !patternObj.pattern.global) {
        // Without the global flag, lastIndex won't work
        var flags = patternObj.pattern.toString().match(/[imsuy]*$/)[0];
        patternObj.pattern = RegExp(patternObj.pattern.source, flags + 'g');
      }

      /** @type {RegExp} */
      var pattern = patternObj.pattern || patternObj;

      for ( // iterate the token list and keep track of the current token/string position
        var currentNode = startNode.next, pos = startPos;
        currentNode !== tokenList.tail;
        pos += currentNode.value.length, currentNode = currentNode.next
      ) {

        if (rematch && pos >= rematch.reach) {
          break;
        }

        var str = currentNode.value;

        if (tokenList.length > text.length) {
          // Something went terribly wrong, ABORT, ABORT!
          return;
        }

        if (str instanceof Token) {
          continue;
        }

        var removeCount = 1; // this is the to parameter of removeBetween
        var match;

        if (greedy) {
          match = matchPattern(pattern, pos, text, lookbehind);
          if (!match || match.index >= text.length) {
            break;
          }

          var from = match.index;
          var to = match.index + match[0].length;
          var p = pos;

          // find the node that contains the match
          p += currentNode.value.length;
          while (from >= p) {
            currentNode = currentNode.next;
            p += currentNode.value.length;
          }
          // adjust pos (and p)
          p -= currentNode.value.length;
          pos = p;

          // the current node is a Token, then the match starts inside another Token, which is invalid
          if (currentNode.value instanceof Token) {
            continue;
          }

          // find the last node which is affected by this match
          for (
            var k = currentNode;
            k !== tokenList.tail && (p < to || typeof k.value === 'string');
            k = k.next
          ) {
            removeCount++;
            p += k.value.length;
          }
          removeCount--;

          // replace with the new match
          str = text.slice(pos, p);
          match.index -= pos;
        } else {
          match = matchPattern(pattern, 0, str, lookbehind);
          if (!match) {
            continue;
          }
        }

        // eslint-disable-next-line no-redeclare
        var from = match.index;
        var matchStr = match[0];
        var before = str.slice(0, from);
        var after = str.slice(from + matchStr.length);

        var reach = pos + str.length;
        if (rematch && reach > rematch.reach) {
          rematch.reach = reach;
        }

        var removeFrom = currentNode.prev;

        if (before) {
          removeFrom = addAfter(tokenList, removeFrom, before);
          pos += before.length;
        }

        removeRange(tokenList, removeFrom, removeCount);

        var wrapped = new Token(token, inside ? tokenize(matchStr, inside) : matchStr, alias, matchStr);
        currentNode = addAfter(tokenList, removeFrom, wrapped);

        if (after) {
          addAfter(tokenList, currentNode, after);
        }

        if (removeCount > 1) {
          // at least one Token object was removed, so we have to do some rematching
          // this can only happen if the current pattern is greedy

          /** @type {RematchOptions} */
          var nestedRematch = {
            cause: token + ',' + j,
            reach: reach
          };
          matchGrammar(text, tokenList, grammar, currentNode.prev, pos, nestedRematch);

          // the reach might have been extended because of the rematching
          if (rematch && nestedRematch.reach > rematch.reach) {
            rematch.reach = nestedRematch.reach;
          }
        }
      }
    }
  }
}

/**
 * @typedef LinkedListNode
 * @property {T} value
 * @property {LinkedListNode<T> | null} prev The previous node.
 * @property {LinkedListNode<T> | null} next The next node.
 * @template T
 * @private
 */

/**
 * @template T
 * @private
 */
function LinkedList() {
  /** @type {LinkedListNode<T>} */
  var head = { value: null, prev: null, next: null };
  /** @type {LinkedListNode<T>} */
  var tail = { value: null, prev: head, next: null };
  head.next = tail;

  /** @type {LinkedListNode<T>} */
  this.head = head;
  /** @type {LinkedListNode<T>} */
  this.tail = tail;
  this.length = 0;
}

/**
 * Adds a new node with the given value to the list.
 *
 * @param {LinkedList<T>} list
 * @param {LinkedListNode<T>} node
 * @param {T} value
 * @returns {LinkedListNode<T>} The added node.
 * @template T
 */
function addAfter(list, node, value) {
  // assumes that node != list.tail && values.length >= 0
  var next = node.next;

  var newNode = { value: value, prev: node, next: next };
  node.next = newNode;
  next.prev = newNode;
  list.length++;

  return newNode;
}
/**
 * Removes `count` nodes after the given node. The given node will not be removed.
 *
 * @param {LinkedList<T>} list
 * @param {LinkedListNode<T>} node
 * @param {number} count
 * @template T
 */
function removeRange(list, node, count) {
  var next = node.next;
  for (var i = 0; i < count && next !== list.tail; i++) {
    next = next.next;
  }
  node.next = next;
  next.prev = node;
  list.length -= i;
}
/**
 * @param {LinkedList<T>} list
 * @returns {T[]}
 * @template T
 */
function toArray(list) {
  var array = [];
  var node = list.head.next;
  while (node !== list.tail) {
    array.push(node.value);
    node = node.next;
  }
  return array;
}

// some additional documentation/types

/**
 * The expansion of a simple `RegExp` literal to support additional properties.
 *
 * @typedef GrammarToken
 * @property {RegExp} pattern The regular expression of the token.
 * @property {boolean} [lookbehind=false] If `true`, then the first capturing group of `pattern` will (effectively)
 * behave as a lookbehind group meaning that the captured text will not be part of the matched text of the new token.
 * @property {boolean} [greedy=false] Whether the token is greedy.
 * @property {string|string[]} [alias] An optional alias or list of aliases.
 * @property {Grammar} [inside] The nested grammar of this token.
 *
 * The `inside` grammar will be used to tokenize the text value of each token of this kind.
 *
 * This can be used to make nested and even recursive language definitions.
 *
 * Note: This can cause infinite recursion. Be careful when you embed different languages or even the same language into
 * each another.
 * @global
 * @public
 */

/**
 * @typedef Grammar
 * @type {Object<string, RegExp | GrammarToken | Array<RegExp | GrammarToken>>}
 * @property {Grammar} [rest] An optional grammar object that will be appended to this grammar.
 * @global
 * @public
 */

/**
 * A function which will invoked after an element was successfully highlighted.
 *
 * @callback HighlightCallback
 * @param {Element} element The element successfully highlighted.
 * @returns {void}
 * @global
 * @public
 */

/**
 * @callback HookCallback
 * @param {Object<string, any>} env The environment variables of the hook.
 * @returns {void}
 * @global
 * @public
 */
