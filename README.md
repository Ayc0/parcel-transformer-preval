# parcel-transformer-preval

Pre-evaluate code at build-time

## The problem

You need to do some dynamic stuff, but don’t want to do it at runtime. Or maybe you want to do stuff like read the file system to get a list of files and you can’t do that in the browser.

## Table of Contents

- [parcel-transformer-preval](#parcel-transformer-preval)
  - [The problem](#the-problem)
  - [Table of Contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Important notes:](#important-notes)
    - [Parcel config](#parcel-config)
    - [Simple example](#simple-example)
    - [Serialization](#serialization)
  - [How is this different from `babel-plugin-preval`?](#how-is-this-different-from-babel-plugin-preval)

## Installation

As this package will be used during the build process with [Parcel](https://parceljs.org/), it needs to live in your `devDependencies`:

```bash
npm install --save-dev parcel-transformer-preval
# or
yarn add -D parcel-transformer-preval
```

## Usage

### Important notes:

1. This is a [Parcel](https://parceljs.org/) plugin.
2. All code run by `preval` is _not_ run in a sandboxed environment.
3. All code _must_ run synchronously.
4. Code that is run by preval is not transpiled so it must run natively in the version of node you’re running. (cannot use ES Modules).
5. All exported values need to be serializable as JSON for better interop between node environment and the runtime.

### Parcel config

In your `.parcelrc` file, you need enable the preval transformer on `*.preval.js` files (it needs to be the 1st one in the list):

```json
{
  "extends": "@parcel/config-default",
  "transformers": {
    "*.preval.js": ["parcel-transformer-preval", "..."]
  }
}
```

And now, you’re ready to use it.

### Simple example

Every file imported that ends in `.preval.js` will be evaluated by `Parcel` at build time:

```js
// file.preval.js
module.exports = 1 + 3;
// other-file.js
import result from "./file.preval.js";

//      ↓ ↓ ↓ ↓ ↓ ↓

// other-file.js
const result = 4;
```

### Serialization

As mentioned in the [important notes](#important-notes), `preval` uses JSON serialization. So it can only handle:

- numbers
- strings
- arrays
- simple objects

But not:

- sets
- maps
- functions
- classes
- in general complex “objects”

```js
// Not supported
module.exports = new Set();
module.exports = new Map();
module.exports = new Date();
module.exports = class A {};
module.exports = () => {};
module.exports = function () {};
```

## How is this different from `babel-plugin-preval`?

This plugin is heavily inspired by [`babel-plugin-preval`](https://github.com/kentcdodds/babel-plugin-preval). We could even say that this plugin is a port of the babel plugin for Parcel with a few differences:

This plugin doesn’t support:

- template tags: `` preval`module.exports = …`; ``
- import comments: `import x from /* preval */ './something'`
- `preval.require`s: `preval.require('./something')`
- preval file comments: `// @preval`
- exporting a function.

The reason behind the 4 first differences is because when using it in bigger projects, we realized that being able to easily understand in which environment the code will run.

So instead of having to tell mention from another file that the file we’re importing needs to be prevaled (the import comments and `preval.require`), we found that the file name was a better indicator to reviewers.
As the transformer is now only based on the file name, there is no need for `@preval` comments.

Only using the file name allows you to be able to easily configure:

- ESLint
- TypeScript
- Parcel
- and others
