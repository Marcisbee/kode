import type { GrammarRest } from 'prismjs';

import { util } from '../prism';

import { javascript } from './javascript';

const source = util.clone(javascript);

export const typescript: GrammarRest = {
  'decorator': {
    pattern: /@[$\w\xA0-\uFFFF]+/,
    inside: {
      'at': {
        pattern: /^@/,
        alias: 'operator'
      },
      'function': /^[\s\S]+/
    }
  },
  'generic-function': {
    // e.g. foo<T extends "bar" | "baz">( ...
    pattern: /#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>(?=\s*\()/,
    greedy: true,
    inside: {
      'function': /^#?(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*/,
      'generic': {
        pattern: /<[\s\S]+/, // everything after the first <
        alias: 'class-name',
        // inside: typeInside
      }
    }
  },
  ...source,
  keyword: [
    ...source.keyword,
    /\b(?:abstract|declare|is|keyof|readonly|require)\b/,
    // keywords that have to be followed by an identifier
    /\b(?:asserts|infer|interface|module|namespace|type)\b(?=\s*(?:[{_$a-zA-Z\xA0-\uFFFF]|$))/,
    // This is for `import type *, {}`
    /\btype\b(?=\s*(?:[\{*]|$))/
  ],
  'class-name': {
    pattern: /(\b(?:class|extends|implements|instanceof|interface|new|type)\s+)(?!keyof\b)(?!\s)[_$a-zA-Z\xA0-\uFFFF](?:(?!\s)[$\w\xA0-\uFFFF])*(?:\s*<(?:[^<>]|<(?:[^<>]|<[^<>]*>)*>)*>)?/,
    lookbehind: true,
    greedy: true,
    inside: null // see below
  },
  'builtin': /\b(?:Array|Function|Promise|any|boolean|console|never|number|string|symbol|unknown)\b/,
};

// doesn't work with TS because TS is too complex
delete (typescript as any)['parameter'];
delete (typescript as any)['literal-property'];
