[![build status][travis-image]][travis-url]
[![test coverage][coveralls-image]][coveralls-url]
[![npm][npm-image]][npm-url]

# eslint-plugin-prefer-object-spread

ESLint rule for suggesting that [object spread properties](https://github.com/sebmarkbage/ecmascript-rest-spread) be used instead of `Object.assign()`.

## Installation

Install [ESLint](http://eslint.org) and `eslint-plugin-prefer-object-spread`:

```
$ npm install --save-dev eslint eslint-plugin-prefer-object-spread
```

## Usage

Add `prefer-object-spread` to the plugins section of your `.eslintrc` configuration file, and configure the rule under the rules section.

```json
{
  "plugins": [
    "prefer-object-spread"
  ],
  "rules": {
    "prefer-object-spread/prefer-object-spread": 2
  }
}
```

This rule suggests that [object spread properties](https://github.com/sebmarkbage/ecmascript-rest-spread) be used instead of `Object.assign()`. The rule is only applied when Object.assign() is used for cloning; not when it is used to extend an existing object. i.e., it applies when the first argument to `Object.assign()` is an object literal. This is because spread properties only iterate over own properties.

When using this rule the following patterns are considered problems:

```js
var a = Object.assign({}, foo); // error Use a spread property instead of Object.assign().

var b = Object.assign({ c: 1 }, bar); // error Use a spread property instead of Object.assign().
```

The following patterns are considered okay:
```js
var a = { ...foo };

var b = { c: 1, ...bar };

Object.assign(b, { d: 2 });
```

[travis-image]: https://img.shields.io/travis/bryanrsmith/eslint-plugin-prefer-object-spread/master.svg?style=flat-square
[travis-url]: https://travis-ci.org/bryanrsmith/eslint-plugin-prefer-object-spread
[coveralls-image]: https://img.shields.io/coveralls/bryanrsmith/eslint-plugin-prefer-object-spread/master.svg?style=flat-square
[coveralls-url]: https://coveralls.io/github/bryanrsmith/eslint-plugin-prefer-object-spread?branch=master
[npm-image]: https://img.shields.io/npm/v/eslint-plugin-prefer-object-spread.svg?style=flat-square
[npm-url]: https://www.npmjs.com/package/eslint-plugin-prefer-object-spread

