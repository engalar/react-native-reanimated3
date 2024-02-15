"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// lib/types.js
var require_types = __commonJS({
  "lib/types.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isWorkletizableFunctionType = exports2.WorkletizableFunction = void 0;
    exports2.WorkletizableFunction = "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ObjectMethod";
    function isWorkletizableFunctionType(path) {
      return path.isFunctionDeclaration() || path.isFunctionExpression() || path.isArrowFunctionExpression() || path.isObjectMethod();
    }
    exports2.isWorkletizableFunctionType = isWorkletizableFunctionType;
  }
});

// lib/utils.js
var require_utils = __commonJS({
  "lib/utils.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isRelease = void 0;
    function isRelease() {
      var _a, _b;
      const pattern = /(prod|release|stag[ei])/i;
      return !!(((_a = process.env.BABEL_ENV) === null || _a === void 0 ? void 0 : _a.match(pattern)) || ((_b = process.env.NODE_ENV) === null || _b === void 0 ? void 0 : _b.match(pattern)));
    }
    exports2.isRelease = isRelease;
  }
});

// lib/buildWorkletString.js
var require_buildWorkletString = __commonJS({
  "lib/buildWorkletString.js"(exports2) {
    "use strict";
    var __createBinding = exports2 && exports2.__createBinding || (Object.create ? function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      var desc = Object.getOwnPropertyDescriptor(m, k);
      if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function() {
          return m[k];
        } };
      }
      Object.defineProperty(o, k2, desc);
    } : function(o, m, k, k2) {
      if (k2 === void 0)
        k2 = k;
      o[k2] = m[k];
    });
    var __setModuleDefault = exports2 && exports2.__setModuleDefault || (Object.create ? function(o, v) {
      Object.defineProperty(o, "default", { enumerable: true, value: v });
    } : function(o, v) {
      o["default"] = v;
    });
    var __importStar = exports2 && exports2.__importStar || function(mod) {
      if (mod && mod.__esModule)
        return mod;
      var result = {};
      if (mod != null) {
        for (var k in mod)
          if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k))
            __createBinding(result, mod, k);
      }
      __setModuleDefault(result, mod);
      return result;
    };
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.buildWorkletString = void 0;
    var core_1 = require("@babel/core");
    var generator_1 = __importDefault(require("@babel/generator"));
    var types_12 = require("@babel/types");
    var assert_1 = require("assert");
    var convertSourceMap = __importStar(require("convert-source-map"));
    var fs = __importStar(require("fs"));
    var utils_1 = require_utils();
    var MOCK_SOURCE_MAP = "mock source map";
    function buildWorkletString(fun, closureVariables, name, inputMap) {
      const draftExpression = fun.program.body.find((obj) => (0, types_12.isFunctionDeclaration)(obj)) || fun.program.body.find((obj) => (0, types_12.isExpressionStatement)(obj)) || void 0;
      (0, assert_1.strict)(draftExpression, "[Reanimated] `draftExpression` is undefined.");
      const expression = (0, types_12.isFunctionDeclaration)(draftExpression) ? draftExpression : draftExpression.expression;
      (0, assert_1.strict)("params" in expression, "'params' property is undefined in 'expression'");
      (0, assert_1.strict)((0, types_12.isBlockStatement)(expression.body), "[Reanimated] `expression.body` is not a `BlockStatement`");
      const workletFunction = (0, types_12.functionExpression)((0, types_12.identifier)(name), expression.params, expression.body, expression.generator, expression.async);
      const code = (0, generator_1.default)(workletFunction).code;
      (0, assert_1.strict)(inputMap, "[Reanimated] `inputMap` is undefined.");
      const includeSourceMap = !(0, utils_1.isRelease)();
      if (includeSourceMap) {
        inputMap.sourcesContent = [];
        for (const sourceFile of inputMap.sources) {
          inputMap.sourcesContent.push(fs.readFileSync(sourceFile).toString("utf-8"));
        }
      }
      const transformed = (0, core_1.transformSync)(code, {
        plugins: [prependClosureVariablesIfNecessary(closureVariables)],
        compact: true,
        sourceMaps: includeSourceMap,
        inputSourceMap: inputMap,
        ast: false,
        babelrc: false,
        configFile: false,
        comments: false
      });
      (0, assert_1.strict)(transformed, "[Reanimated] `transformed` is null.");
      let sourceMap;
      if (includeSourceMap) {
        if (shouldMockSourceMap()) {
          sourceMap = MOCK_SOURCE_MAP;
        } else {
          sourceMap = convertSourceMap.fromObject(transformed.map).toObject();
          delete sourceMap.sourcesContent;
        }
      }
      return [transformed.code, JSON.stringify(sourceMap)];
    }
    exports2.buildWorkletString = buildWorkletString;
    function shouldMockSourceMap() {
      return process.env.REANIMATED_JEST_SHOULD_MOCK_SOURCE_MAP === "1";
    }
    function prependClosure(path, closureVariables, closureDeclaration) {
      if (closureVariables.length === 0 || !(0, types_12.isProgram)(path.parent)) {
        return;
      }
      if (!(0, types_12.isExpression)(path.node.body)) {
        path.node.body.body.unshift(closureDeclaration);
      }
    }
    function prependRecursiveDeclaration(path) {
      var _a;
      if ((0, types_12.isProgram)(path.parent) && !(0, types_12.isArrowFunctionExpression)(path.node) && !(0, types_12.isObjectMethod)(path.node) && path.node.id && path.scope.parent) {
        const hasRecursiveCalls = ((_a = path.scope.parent.bindings[path.node.id.name]) === null || _a === void 0 ? void 0 : _a.references) > 0;
        if (hasRecursiveCalls) {
          path.node.body.body.unshift((0, types_12.variableDeclaration)("const", [
            (0, types_12.variableDeclarator)((0, types_12.identifier)(path.node.id.name), (0, types_12.memberExpression)((0, types_12.thisExpression)(), (0, types_12.identifier)("_recur")))
          ]));
        }
      }
    }
    function prependClosureVariablesIfNecessary(closureVariables) {
      const closureDeclaration = (0, types_12.variableDeclaration)("const", [
        (0, types_12.variableDeclarator)((0, types_12.objectPattern)(closureVariables.map((variable) => (0, types_12.objectProperty)((0, types_12.identifier)(variable.name), (0, types_12.identifier)(variable.name), false, true))), (0, types_12.memberExpression)((0, types_12.thisExpression)(), (0, types_12.identifier)("__closure")))
      ]);
      return {
        visitor: {
          "FunctionDeclaration|FunctionExpression|ArrowFunctionExpression|ObjectMethod": (path) => {
            prependClosure(path, closureVariables, closureDeclaration);
            prependRecursiveDeclaration(path);
          }
        }
      };
    }
  }
});

// lib/globals.js
var require_globals = __commonJS({
  "lib/globals.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.initializeGlobals = exports2.globals = exports2.defaultGlobals = void 0;
    exports2.defaultGlobals = /* @__PURE__ */ new Set([
      "globalThis",
      "Infinity",
      "NaN",
      "undefined",
      "eval",
      "isFinite",
      "isNaN",
      "parseFloat",
      "parseInt",
      "decodeURI",
      "decodeURIComponent",
      "encodeURI",
      "encodeURIComponent",
      "escape",
      "unescape",
      "Object",
      "Function",
      "Boolean",
      "Symbol",
      "Error",
      "AggregateError",
      "EvalError",
      "RangeError",
      "ReferenceError",
      "SyntaxError",
      "TypeError",
      "URIError",
      "InternalError",
      "Number",
      "BigInt",
      "Math",
      "Date",
      "String",
      "RegExp",
      "Array",
      "Int8Array",
      "Uint8Array",
      "Uint8ClampedArray",
      "Int16Array",
      "Uint16Array",
      "Int32Array",
      "Uint32Array",
      "BigInt64Array",
      "BigUint64Array",
      "Float32Array",
      "Float64Array",
      "Map",
      "Set",
      "WeakMap",
      "WeakSet",
      "ArrayBuffer",
      "SharedArrayBuffer",
      "DataView",
      "Atomics",
      "JSON",
      "WeakRef",
      "FinalizationRegistry",
      "Iterator",
      "AsyncIterator",
      "Promise",
      "GeneratorFunction",
      "AsyncGeneratorFunction",
      "Generator",
      "AsyncGenerator",
      "AsyncFunction",
      "Reflect",
      "Proxy",
      "Intl",
      "null",
      "this",
      "global",
      "console",
      "performance",
      "queueMicrotask",
      "requestAnimationFrame",
      "setImmediate",
      "arguments",
      "HermesInternal",
      "_WORKLET",
      "_IS_FABRIC",
      "_log",
      "_toString",
      "_scheduleOnJS",
      "_scheduleOnRuntime",
      "_makeShareableClone",
      "_updatePropsPaper",
      "_updatePropsFabric",
      "_removeFromPropsRegistry",
      "_measurePaper",
      "_measureFabric",
      "_scrollToPaper",
      "_dispatchCommandPaper",
      "_dispatchCommandFabric",
      "_setGestureState",
      "_notifyAboutProgress",
      "_notifyAboutEnd",
      "_runOnUIQueue",
      "_getAnimationTimestamp"
    ]);
    function initializeGlobals() {
      exports2.globals = new Set(exports2.defaultGlobals);
    }
    exports2.initializeGlobals = initializeGlobals;
  }
});

// ../package.json
var require_package = __commonJS({
  "../package.json"(exports2, module2) {
    module2.exports = {
      name: "react-native-reanimated3",
      version: "3.7.0",
      description: "More powerful alternative to Animated library for React Native.",
      scripts: {
        test: "yarn run format:js && yarn run lint:js && yarn run test:unit",
        "test:unit": "jest",
        "test:update-snapshot": "jest --updateSnapshot",
        lint: "yarn lint:js && yarn lint:plugin && yarn lint:cpp && yarn lint:java && yarn lint:ios",
        "lint:js": "eslint --ext '.js,.ts,.tsx' src __tests__ __typetests__ && yarn prettier --check src __tests__ __typetests__",
        "lint:plugin": "cd plugin && yarn lint && cd ..",
        "lint:docs": "cd docs && yarn lint && cd ..",
        "lint:java": "./android/gradlew -p android spotlessCheck -q",
        "lint:cpp": "./scripts/cpplint.sh",
        "lint:ios": "./scripts/validate-ios.sh && yarn format:ios --dry-run",
        format: "yarn format:js && yarn format:plugin && yarn format:java && yarn format:ios && yarn format:android && yarn format:common",
        "format:js": "prettier --write --list-different src __tests__ __typetests__",
        "format:plugin": "cd plugin && yarn format && cd ..",
        "format:java": "node ./scripts/format-java.js",
        "format:ios": "find apple/ -iname *.h -o -iname *.m -o -iname *.mm -o -iname *.cpp | xargs clang-format -i --Werror",
        "format:android": "find android/src/ -iname *.h -o -iname *.cpp | xargs clang-format -i",
        "format:common": "find Common/ -iname *.h -o -iname *.cpp | xargs clang-format -i",
        "format:docs": "cd docs && yarn format && cd ..",
        "find-unused-code:js": 'yarn ts-prune --ignore "index|.web." --error  ',
        "type:check:src": "yarn tsc --noEmit",
        "type:check:plugin": "cd plugin && yarn type:check:src && cd ..",
        "type:check:app": "./scripts/test-ts.sh app/src/App.tsx",
        "type:check:tests:common": "./scripts/test-ts.sh __typetests__/common",
        "type:check:tests:0.72+": "./scripts/test-ts.sh __typetests__/0.72+",
        "type:check:tests:legacy": "./scripts/test-ts.sh __typetests__/legacy",
        "type:check:all": "yarn type:check:src && yarn type:check:plugin && ./scripts/test-ts.sh app/src/App.tsx __typetests__/common __typetests__/0.72+ __typetests__/legacy",
        prepare: "yarn plugin && bob build && husky install && yarn app",
        circular_dependency_check: "yarn madge --extensions js,ts,tsx --circular src lib",
        use_strict_check: "node ./scripts/validate-use-strict.js",
        setup: "yarn && cd Example && yarn && cd ios && pod install --verbose && cd ../..",
        clean: "rm -rf node_modules && cd Example && rm -rf node_modules && cd ios && pod deintegrate && cd ../..",
        reset: "yarn clean && yarn setup",
        "clean:deep": "cd android && rm -rf .cxx .gradle build && cd ../Example/android && rm -rf .gradle build app/build && cd ../.. && yarn clean",
        "reset:deep": "yarn clean:deep && yarn setup",
        plugin: "cd plugin && yarn && cd ..",
        app: "cd app && yarn && cd ..",
        "run-example:ios": "cd Example && yarn && cd ios && pod install && open ReanimatedExample.xcworkspace && cd .. && yarn start --reset-cache",
        "run-example:ios:cold-start": "cd Example && yarn && cd ios && git clean -xdf && pod install && open ReanimatedExample.xcworkspace && cd .. && yarn start --reset-cache",
        "run-fabric-example:ios": "cd FabricExample && yarn && cd ios && pod install && open FabricExample.xcworkspace && cd .. && yarn start --reset-cache",
        "run-fabric-example:ios:cold-start": "cd FabricExample && yarn && cd ios && git clean -xdf && pod install && open FabricExample.xcworkspace && cd .. && yarn start --reset-cache"
      },
      main: "lib/module/index",
      module: "lib/module/index",
      "react-native": "src/index",
      source: "src/index",
      types: "lib/typescript/index",
      files: [
        "Common/",
        "src/",
        "lib/",
        "android/src/main/AndroidManifest.xml",
        "android/src/main/java/",
        "android/build.gradle",
        "android/",
        "apple/",
        "RNReanimated.podspec",
        "scripts/reanimated_utils.rb",
        "mock.js",
        "plugin/index.js",
        "plugin/build/plugin.js",
        "!**/__tests__",
        "!**/__fixtures__",
        "!**/__mocks__",
        "!apple/build/",
        "!android/build/",
        "!android/.cxx/",
        "!android/.gradle/",
        "!__snapshots__",
        "!*.test.js",
        "!*.test.js.map",
        "!**/node_modules"
      ],
      repository: {
        type: "git",
        url: "git+https://github.com/software-mansion/react-native-reanimated.git"
      },
      author: {
        email: "krzys.magiera@gmail.com",
        name: "Krzysztof Magiera"
      },
      license: "MIT",
      readmeFilename: "README.md",
      bugs: {
        url: "https://github.com/software-mansion/react-native-reanimated/issues"
      },
      homepage: "https://github.com/software-mansion/react-native-reanimated#readme",
      dependencies: {
        "@babel/plugin-transform-object-assign": "^7.16.7",
        "@babel/preset-typescript": "^7.16.7",
        "convert-source-map": "^2.0.0",
        invariant: "^2.2.4"
      },
      peerDependencies: {
        "@babel/core": "^7.0.0-0",
        "@babel/plugin-proposal-nullish-coalescing-operator": "^7.0.0-0",
        "@babel/plugin-proposal-optional-chaining": "^7.0.0-0",
        "@babel/plugin-transform-arrow-functions": "^7.0.0-0",
        "@babel/plugin-transform-shorthand-properties": "^7.0.0-0",
        "@babel/plugin-transform-template-literals": "^7.0.0-0",
        react: "*",
        "react-native": "*"
      },
      devDependencies: {
        "@babel/cli": "^7.20.0",
        "@babel/core": "^7.20.0",
        "@babel/plugin-proposal-class-properties": "^7.16.7",
        "@babel/plugin-proposal-nullish-coalescing-operator": "^7.0.0",
        "@babel/plugin-proposal-optional-chaining": "^7.0.0",
        "@babel/plugin-proposal-private-methods": "^7.18.6",
        "@babel/plugin-transform-arrow-functions": "^7.0.0",
        "@babel/plugin-transform-shorthand-properties": "^7.0.0",
        "@babel/plugin-transform-template-literals": "^7.0.0",
        "@babel/preset-env": "^7.20.0",
        "@babel/types": "^7.20.0",
        "@react-native/eslint-config": "^0.72.2",
        "@testing-library/jest-native": "^4.0.4",
        "@testing-library/react-hooks": "^8.0.0",
        "@testing-library/react-native": "^7.1.0",
        "@types/babel__core": "^7.20.0",
        "@types/babel__generator": "^7.6.4",
        "@types/babel__traverse": "^7.14.2",
        "@types/convert-source-map": "^2.0.0",
        "@types/invariant": "^2.2.35",
        "@types/jest": "^29.0.0",
        "@types/node": "^18.0.0",
        "@types/react": "^18.0.26",
        "@types/react-test-renderer": "17.0.2",
        "@typescript-eslint/eslint-plugin": "^6.19.0",
        "@typescript-eslint/parser": "^6.19.0",
        axios: "^1.4.0",
        "babel-eslint": "^10.1.0",
        "babel-jest": "^27.5.1",
        "babel-plugin-module-resolver": "^5.0.0",
        "clang-format": "^1.6.0",
        "code-tag": "^1.1.0",
        eslint: "^8.56.0",
        "eslint-config-prettier": "^8.3.0",
        "eslint-config-standard": "^17.1.0",
        "eslint-import-resolver-babel-module": "^5.3.1",
        "eslint-plugin-import": "^2.25.4",
        "eslint-plugin-jest": "^27.2.1",
        "eslint-plugin-n": "^16.4.0",
        "eslint-plugin-no-inline-styles": "^1.0.5",
        "eslint-plugin-promise": "^6.0.0",
        "eslint-plugin-react-hooks": "^4.6.0",
        "eslint-plugin-standard": "^5.0.0",
        "eslint-plugin-tsdoc": "^0.2.17",
        husky: "^7.0.4",
        jest: "^29.0.0",
        "lint-staged": "^11.2.0",
        madge: "^5.0.1",
        prettier: "^2.5.1",
        react: "17.0.2",
        "react-native": "0.72.6",
        "react-native-builder-bob": "^0.18.3",
        "react-native-gesture-handler": "^2.13.2",
        "react-native-web": "~0.18.12",
        "react-test-renderer": "17.0.2",
        shelljs: "^0.8.5",
        "ts-prune": "^0.10.3",
        typescript: "^4.1.3"
      },
      "lint-staged": {
        "*.(js|ts|tsx)": [
          "eslint",
          "eslint --quiet --ext '.js,.ts,.tsx' src/",
          "prettier --write"
        ],
        "plugin/**/*.ts": "yarn lint:plugin",
        "**/*.{h,cpp}": "yarn lint:cpp",
        "android/src/**/*.java": "yarn format:java",
        "android/src/**/*.{h,cpp}": "yarn format:android",
        "apple/**/*.{h,m,mm,cpp}": "yarn format:ios",
        "Common/**/*.{h,cpp}": "yarn format:common"
      },
      "react-native-builder-bob": {
        source: "src",
        output: "lib",
        targets: [
          "module",
          "typescript"
        ]
      },
      sideEffects: [
        "./lib/reanimated2/core",
        "./lib/index"
      ]
    };
  }
});

// lib/makeWorklet.js
var require_makeWorklet = __commonJS({
  "lib/makeWorklet.js"(exports2) {
    "use strict";
    var __importDefault = exports2 && exports2.__importDefault || function(mod) {
      return mod && mod.__esModule ? mod : { "default": mod };
    };
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.makeWorkletFactory = void 0;
    var core_1 = require("@babel/core");
    var generator_1 = __importDefault(require("@babel/generator"));
    var types_12 = require("@babel/types");
    var assert_1 = require("assert");
    var path_1 = require("path");
    var buildWorkletString_1 = require_buildWorkletString();
    var globals_12 = require_globals();
    var utils_1 = require_utils();
    var REAL_VERSION = require_package().version;
    var MOCK_VERSION = "x.y.z";
    function makeWorkletFactory(fun, state) {
      removeWorkletDirective(fun);
      (0, assert_1.strict)(state.file.opts.filename, "[Reanimated] `state.file.opts.filename` is undefined.");
      const codeObject = (0, generator_1.default)(fun.node, {
        sourceMaps: true,
        sourceFileName: state.file.opts.filename
      });
      codeObject.code = "(" + ((0, types_12.isObjectMethod)(fun) ? "function " : "") + codeObject.code + "\n)";
      const transformed = (0, core_1.transformSync)(codeObject.code, {
        filename: state.file.opts.filename,
        presets: [require.resolve("@babel/preset-typescript")],
        plugins: [
          require.resolve("@babel/plugin-transform-shorthand-properties"),
          require.resolve("@babel/plugin-transform-arrow-functions"),
          require.resolve("@babel/plugin-proposal-optional-chaining"),
          require.resolve("@babel/plugin-proposal-nullish-coalescing-operator"),
          [
            require.resolve("@babel/plugin-transform-template-literals"),
            { loose: true }
          ]
        ],
        ast: true,
        babelrc: false,
        configFile: false,
        inputSourceMap: codeObject.map
      });
      (0, assert_1.strict)(transformed, "[Reanimated] `transformed` is undefined.");
      (0, assert_1.strict)(transformed.ast, "[Reanimated] `transformed.ast` is undefined.");
      const variables = makeArrayFromCapturedBindings(transformed.ast, fun);
      const functionName = makeWorkletName(fun);
      const functionIdentifier = (0, types_12.identifier)(functionName);
      const clone = (0, types_12.cloneNode)(fun.node);
      const funExpression = (0, types_12.isBlockStatement)(clone.body) ? (0, types_12.functionExpression)(null, clone.params, clone.body, clone.generator, clone.async) : clone;
      let [funString, sourceMapString] = (0, buildWorkletString_1.buildWorkletString)(transformed.ast, variables, functionName, transformed.map);
      (0, assert_1.strict)(funString, "[Reanimated] `funString` is undefined.");
      const workletHash = hash(funString);
      let lineOffset = 1;
      if (variables.length > 0) {
        lineOffset -= variables.length + 2;
      }
      const pathForStringDefinitions = fun.parentPath.isProgram() ? fun : fun.findParent((path) => (0, types_12.isProgram)(path.parentPath));
      (0, assert_1.strict)(pathForStringDefinitions, "[Reanimated] `pathForStringDefinitions` is null.");
      (0, assert_1.strict)(pathForStringDefinitions.parentPath, "[Reanimated] `pathForStringDefinitions.parentPath` is null.");
      const initDataId = pathForStringDefinitions.parentPath.scope.generateUidIdentifier(`worklet_${workletHash}_init_data`);
      const initDataObjectExpression = (0, types_12.objectExpression)([
        (0, types_12.objectProperty)((0, types_12.identifier)("code"), (0, types_12.stringLiteral)(funString))
      ]);
      const shouldInjectLocation = !(0, utils_1.isRelease)();
      if (shouldInjectLocation) {
        let location = state.file.opts.filename;
        if (state.opts.relativeSourceLocation) {
          location = (0, path_1.relative)(state.cwd, location);
          sourceMapString = sourceMapString === null || sourceMapString === void 0 ? void 0 : sourceMapString.replace(state.file.opts.filename, location);
        }
        initDataObjectExpression.properties.push((0, types_12.objectProperty)((0, types_12.identifier)("location"), (0, types_12.stringLiteral)(location)));
      }
      if (sourceMapString) {
        initDataObjectExpression.properties.push((0, types_12.objectProperty)((0, types_12.identifier)("sourceMap"), (0, types_12.stringLiteral)(sourceMapString)));
      }
      const shouldInjectVersion = !(0, utils_1.isRelease)();
      if (shouldInjectVersion) {
        initDataObjectExpression.properties.push((0, types_12.objectProperty)((0, types_12.identifier)("version"), (0, types_12.stringLiteral)(shouldMockVersion() ? MOCK_VERSION : REAL_VERSION)));
      }
      const shouldIncludeInitData = !state.opts.omitNativeOnlyData;
      if (shouldIncludeInitData) {
        pathForStringDefinitions.insertBefore((0, types_12.variableDeclaration)("const", [
          (0, types_12.variableDeclarator)(initDataId, initDataObjectExpression)
        ]));
      }
      (0, assert_1.strict)(!(0, types_12.isFunctionDeclaration)(funExpression), "[Reanimated] `funExpression` is a `FunctionDeclaration`.");
      (0, assert_1.strict)(!(0, types_12.isObjectMethod)(funExpression), "[Reanimated] `funExpression` is an `ObjectMethod`.");
      const statements = [
        (0, types_12.variableDeclaration)("const", [
          (0, types_12.variableDeclarator)(functionIdentifier, funExpression)
        ]),
        (0, types_12.expressionStatement)((0, types_12.assignmentExpression)("=", (0, types_12.memberExpression)(functionIdentifier, (0, types_12.identifier)("__closure"), false), (0, types_12.objectExpression)(variables.map((variable) => (0, types_12.objectProperty)((0, types_12.identifier)(variable.name), variable, false, true))))),
        (0, types_12.expressionStatement)((0, types_12.assignmentExpression)("=", (0, types_12.memberExpression)(functionIdentifier, (0, types_12.identifier)("__workletHash"), false), (0, types_12.numericLiteral)(workletHash)))
      ];
      if (shouldIncludeInitData) {
        statements.push((0, types_12.expressionStatement)((0, types_12.assignmentExpression)("=", (0, types_12.memberExpression)(functionIdentifier, (0, types_12.identifier)("__initData"), false), initDataId)));
      }
      if (!(0, utils_1.isRelease)()) {
        statements.unshift((0, types_12.variableDeclaration)("const", [
          (0, types_12.variableDeclarator)((0, types_12.identifier)("_e"), (0, types_12.arrayExpression)([
            (0, types_12.newExpression)((0, types_12.memberExpression)((0, types_12.identifier)("global"), (0, types_12.identifier)("Error")), []),
            (0, types_12.numericLiteral)(lineOffset),
            (0, types_12.numericLiteral)(-27)
          ]))
        ]));
        statements.push((0, types_12.expressionStatement)((0, types_12.assignmentExpression)("=", (0, types_12.memberExpression)(functionIdentifier, (0, types_12.identifier)("__stackDetails"), false), (0, types_12.identifier)("_e"))));
      }
      statements.push((0, types_12.returnStatement)(functionIdentifier));
      const newFun = (0, types_12.functionExpression)(void 0, [], (0, types_12.blockStatement)(statements));
      return newFun;
    }
    exports2.makeWorkletFactory = makeWorkletFactory;
    function removeWorkletDirective(fun) {
      fun.traverse({
        DirectiveLiteral(path) {
          if (path.node.value === "worklet" && path.getFunctionParent() === fun) {
            path.parentPath.remove();
          }
        }
      });
    }
    function shouldMockVersion() {
      return process.env.REANIMATED_JEST_SHOULD_MOCK_VERSION === "1";
    }
    function hash(str) {
      let i = str.length;
      let hash1 = 5381;
      let hash2 = 52711;
      while (i--) {
        const char = str.charCodeAt(i);
        hash1 = hash1 * 33 ^ char;
        hash2 = hash2 * 33 ^ char;
      }
      return (hash1 >>> 0) * 4096 + (hash2 >>> 0);
    }
    function makeWorkletName(fun) {
      if ((0, types_12.isObjectMethod)(fun.node) && (0, types_12.isIdentifier)(fun.node.key)) {
        return fun.node.key.name;
      }
      if ((0, types_12.isFunctionDeclaration)(fun.node) && (0, types_12.isIdentifier)(fun.node.id)) {
        return fun.node.id.name;
      }
      if ((0, types_12.isFunctionExpression)(fun.node) && (0, types_12.isIdentifier)(fun.node.id)) {
        return fun.node.id.name;
      }
      return "anonymous";
    }
    function makeArrayFromCapturedBindings(ast, fun) {
      const closure = /* @__PURE__ */ new Map();
      const isLocationAssignedMap = /* @__PURE__ */ new Map();
      (0, core_1.traverse)(ast, {
        Identifier(path) {
          if (!path.isReferencedIdentifier()) {
            return;
          }
          const name = path.node.name;
          if (globals_12.globals.has(name)) {
            return;
          }
          if ("id" in fun.node && fun.node.id && fun.node.id.name === name) {
            return;
          }
          const parentNode = path.parent;
          if ((0, types_12.isMemberExpression)(parentNode) && parentNode.property === path.node && !parentNode.computed) {
            return;
          }
          if ((0, types_12.isObjectProperty)(parentNode) && (0, types_12.isObjectExpression)(path.parentPath.parent) && path.node !== parentNode.value) {
            return;
          }
          let currentScope = path.scope;
          while (currentScope != null) {
            if (currentScope.bindings[name] != null) {
              return;
            }
            currentScope = currentScope.parent;
          }
          closure.set(name, path.node);
          isLocationAssignedMap.set(name, false);
        }
      });
      fun.traverse({
        Identifier(path) {
          if (!path.isReferencedIdentifier()) {
            return;
          }
          const node = closure.get(path.node.name);
          if (!node || isLocationAssignedMap.get(path.node.name)) {
            return;
          }
          node.loc = path.node.loc;
          isLocationAssignedMap.set(path.node.name, true);
        }
      });
      return Array.from(closure.values());
    }
  }
});

// lib/processIfWorkletFunction.js
var require_processIfWorkletFunction = __commonJS({
  "lib/processIfWorkletFunction.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.makeWorkletFactoryCall = void 0;
    var types_12 = require("@babel/types");
    var makeWorklet_1 = require_makeWorklet();
    function makeWorkletFactoryCall(path, state) {
      const workletFactory = (0, makeWorklet_1.makeWorkletFactory)(path, state);
      const workletFactoryCall = (0, types_12.callExpression)(workletFactory, []);
      addStackTraceDataToWorkletFactory(path, workletFactoryCall);
      const replacement = workletFactoryCall;
      return replacement;
    }
    exports2.makeWorkletFactoryCall = makeWorkletFactoryCall;
    function addStackTraceDataToWorkletFactory(path, workletFactoryCall) {
      const originalWorkletLocation = path.node.loc;
      if (originalWorkletLocation) {
        workletFactoryCall.callee.loc = {
          start: originalWorkletLocation.start,
          end: originalWorkletLocation.start
        };
      }
    }
  }
});

// lib/processIfWorkletNode.js
var require_processIfWorkletNode = __commonJS({
  "lib/processIfWorkletNode.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.maybeSubstituteFunctionDeclarationWithVariableDeclaration = exports2.substituteObjectMethodWithObjectProperty = exports2.processWorklet = exports2.processIfWithWorkletDirective = void 0;
    var types_12 = require("@babel/types");
    var processIfWorkletFunction_1 = require_processIfWorkletFunction();
    var types_2 = require_types();
    function processIfWithWorkletDirective(path, state) {
      if (!(0, types_12.isBlockStatement)(path.node.body)) {
        return false;
      }
      if (!hasWorkletDirective(path.node.body.directives)) {
        return false;
      }
      processWorklet(path, state);
      return true;
    }
    exports2.processIfWithWorkletDirective = processIfWithWorkletDirective;
    function processWorklet(path, state) {
      if (state.opts.processNestedWorklets) {
        path.traverse({
          [types_2.WorkletizableFunction](subPath, passedState) {
            processIfWithWorkletDirective(subPath, passedState);
          }
        }, state);
      }
      const workletFactoryCall = (0, processIfWorkletFunction_1.makeWorkletFactoryCall)(path, state);
      substituteWithWorkletFactoryCall(path, workletFactoryCall);
    }
    exports2.processWorklet = processWorklet;
    function hasWorkletDirective(directives) {
      return directives.some((directive) => (0, types_12.isDirectiveLiteral)(directive.value) && directive.value.value === "worklet");
    }
    function substituteWithWorkletFactoryCall(path, workletFactoryCall) {
      if (path.isObjectMethod()) {
        substituteObjectMethodWithObjectProperty(path, workletFactoryCall);
      } else if (path.isFunctionDeclaration()) {
        maybeSubstituteFunctionDeclarationWithVariableDeclaration(path, workletFactoryCall);
      } else {
        path.replaceWith(workletFactoryCall);
      }
    }
    function substituteObjectMethodWithObjectProperty(path, workletFactoryCall) {
      const replacement = (0, types_12.objectProperty)(path.node.key, workletFactoryCall);
      path.replaceWith(replacement);
    }
    exports2.substituteObjectMethodWithObjectProperty = substituteObjectMethodWithObjectProperty;
    function maybeSubstituteFunctionDeclarationWithVariableDeclaration(path, workletFactoryCall) {
      const needDeclaration = (0, types_12.isScopable)(path.parent) || (0, types_12.isExportNamedDeclaration)(path.parent);
      const replacement = "id" in path.node && path.node.id && needDeclaration ? (0, types_12.variableDeclaration)("const", [
        (0, types_12.variableDeclarator)(path.node.id, workletFactoryCall)
      ]) : workletFactoryCall;
      path.replaceWith(replacement);
    }
    exports2.maybeSubstituteFunctionDeclarationWithVariableDeclaration = maybeSubstituteFunctionDeclarationWithVariableDeclaration;
  }
});

// lib/processForCalleesWorklets.js
var require_processForCalleesWorklets = __commonJS({
  "lib/processForCalleesWorklets.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.processCalleesAutoworkletizableCallbacks = void 0;
    var types_12 = require("@babel/types");
    var types_2 = require_types();
    var assert_1 = require("assert");
    var processIfWorkletNode_12 = require_processIfWorkletNode();
    var functionArgsToWorkletize = /* @__PURE__ */ new Map([
      ["useFrameCallback", [0]],
      ["useAnimatedStyle", [0]],
      ["useAnimatedProps", [0]],
      ["createAnimatedPropAdapter", [0]],
      ["useDerivedValue", [0]],
      ["useAnimatedScrollHandler", [0]],
      ["useAnimatedReaction", [0, 1]],
      ["useWorkletCallback", [0]],
      ["withTiming", [2]],
      ["withSpring", [2]],
      ["withDecay", [1]],
      ["withRepeat", [3]],
      ["runOnUI", [0]],
      ["executeOnUIRuntimeSync", [0]]
    ]);
    var objectHooks = /* @__PURE__ */ new Set([
      "useAnimatedGestureHandler",
      "useAnimatedScrollHandler"
    ]);
    function processCalleesAutoworkletizableCallbacks(path, state) {
      const callee = (0, types_12.isSequenceExpression)(path.node.callee) ? path.node.callee.expressions[path.node.callee.expressions.length - 1] : path.node.callee;
      const name = "name" in callee ? callee.name : "property" in callee && "name" in callee.property ? callee.property.name : void 0;
      if (name === void 0) {
        return;
      }
      if (objectHooks.has(name)) {
        const maybeWorklet = path.get("arguments.0");
        (0, assert_1.strict)(!Array.isArray(maybeWorklet), "[Reanimated] `workletToProcess` is an array.");
        if (maybeWorklet.isObjectExpression()) {
          processObjectHook(maybeWorklet, state);
        } else if (name === "useAnimatedScrollHandler") {
          if ((0, types_2.isWorkletizableFunctionType)(maybeWorklet)) {
            (0, processIfWorkletNode_12.processWorklet)(maybeWorklet, state);
          }
        }
      } else {
        const indices = functionArgsToWorkletize.get(name);
        if (indices === void 0) {
          return;
        }
        processArguments(path, indices, state);
      }
    }
    exports2.processCalleesAutoworkletizableCallbacks = processCalleesAutoworkletizableCallbacks;
    function processObjectHook(path, state) {
      const properties = path.get("properties");
      for (const property of properties) {
        if (property.isObjectMethod()) {
          (0, processIfWorkletNode_12.processWorklet)(property, state);
        } else if (property.isObjectProperty()) {
          const value = property.get("value");
          if ((0, types_2.isWorkletizableFunctionType)(value)) {
            (0, processIfWorkletNode_12.processWorklet)(value, state);
          }
        } else {
          throw new Error(`[Reanimated] '${property.type}' as to-be workletized argument is not supported for object hooks.`);
        }
      }
    }
    function processArguments(path, indices, state) {
      const argumentsArray = path.get("arguments");
      indices.forEach((index) => {
        const maybeWorklet = argumentsArray[index];
        if (!maybeWorklet) {
          return;
        }
        if ((0, types_2.isWorkletizableFunctionType)(maybeWorklet)) {
          (0, processIfWorkletNode_12.processWorklet)(maybeWorklet, state);
        }
      });
    }
  }
});

// lib/processInlineStylesWarning.js
var require_processInlineStylesWarning = __commonJS({
  "lib/processInlineStylesWarning.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.processInlineStylesWarning = void 0;
    var types_12 = require("@babel/types");
    var utils_1 = require_utils();
    var assert_1 = require("assert");
    function generateInlineStylesWarning(path) {
      return (0, types_12.callExpression)((0, types_12.arrowFunctionExpression)([], (0, types_12.blockStatement)([
        (0, types_12.expressionStatement)((0, types_12.callExpression)((0, types_12.memberExpression)((0, types_12.identifier)("console"), (0, types_12.identifier)("warn")), [
          (0, types_12.callExpression)((0, types_12.memberExpression)((0, types_12.callExpression)((0, types_12.identifier)("require"), [
            (0, types_12.stringLiteral)("react-native-reanimated")
          ]), (0, types_12.identifier)("getUseOfValueInStyleWarning")), [])
        ])),
        (0, types_12.returnStatement)(path.node)
      ])), []);
    }
    function processPropertyValueForInlineStylesWarning(path) {
      if (path.isMemberExpression() && (0, types_12.isIdentifier)(path.node.property)) {
        if (path.node.property.name === "value") {
          path.replaceWith(generateInlineStylesWarning(path));
        }
      }
    }
    function processTransformPropertyForInlineStylesWarning(path) {
      if ((0, types_12.isArrayExpression)(path.node)) {
        const elements = path.get("elements");
        (0, assert_1.strict)(Array.isArray(elements), "[Reanimated] `elements` should be an array.");
        for (const element of elements) {
          if (element.isObjectExpression()) {
            processStyleObjectForInlineStylesWarning(element);
          }
        }
      }
    }
    function processStyleObjectForInlineStylesWarning(path) {
      const properties = path.get("properties");
      for (const property of properties) {
        if (property.isObjectProperty()) {
          const value = property.get("value");
          if ((0, types_12.isIdentifier)(property.node.key) && property.node.key.name === "transform") {
            processTransformPropertyForInlineStylesWarning(value);
          } else {
            processPropertyValueForInlineStylesWarning(value);
          }
        }
      }
    }
    function processInlineStylesWarning(path, state) {
      if ((0, utils_1.isRelease)()) {
        return;
      }
      if (state.opts.disableInlineStylesWarning) {
        return;
      }
      if (path.node.name.name !== "style") {
        return;
      }
      if (!(0, types_12.isJSXExpressionContainer)(path.node.value)) {
        return;
      }
      const expression = path.get("value").get("expression");
      (0, assert_1.strict)(!Array.isArray(expression), "[Reanimated] `expression` should not be an array.");
      if (expression.isArrayExpression()) {
        const elements = expression.get("elements");
        (0, assert_1.strict)(Array.isArray(elements), "[Reanimated] `elements` should be an array.");
        for (const element of elements) {
          if (element.isObjectExpression()) {
            processStyleObjectForInlineStylesWarning(element);
          }
        }
      } else if (expression.isObjectExpression()) {
        processStyleObjectForInlineStylesWarning(expression);
      }
    }
    exports2.processInlineStylesWarning = processInlineStylesWarning;
  }
});

// lib/isGestureHandlerEventCallback.js
var require_isGestureHandlerEventCallback = __commonJS({
  "lib/isGestureHandlerEventCallback.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isGestureHandlerEventCallback = void 0;
    var types_12 = require("@babel/types");
    var gestureHandlerGestureObjects = /* @__PURE__ */ new Set([
      "Tap",
      "Pan",
      "Pinch",
      "Rotation",
      "Fling",
      "LongPress",
      "ForceTouch",
      "Native",
      "Manual",
      "Race",
      "Simultaneous",
      "Exclusive",
      "Hover"
    ]);
    var gestureHandlerBuilderMethods = /* @__PURE__ */ new Set([
      "onBegin",
      "onStart",
      "onEnd",
      "onFinalize",
      "onUpdate",
      "onChange",
      "onTouchesDown",
      "onTouchesMove",
      "onTouchesUp",
      "onTouchesCancelled"
    ]);
    function isGestureHandlerEventCallback(path) {
      return (0, types_12.isCallExpression)(path.parent) && (0, types_12.isExpression)(path.parent.callee) && isGestureObjectEventCallbackMethod(path.parent.callee);
    }
    exports2.isGestureHandlerEventCallback = isGestureHandlerEventCallback;
    function isGestureObjectEventCallbackMethod(exp) {
      return (0, types_12.isMemberExpression)(exp) && (0, types_12.isIdentifier)(exp.property) && gestureHandlerBuilderMethods.has(exp.property.name) && containsGestureObject(exp.object);
    }
    function containsGestureObject(exp) {
      if (isGestureObject(exp)) {
        return true;
      }
      if ((0, types_12.isCallExpression)(exp) && (0, types_12.isMemberExpression)(exp.callee) && containsGestureObject(exp.callee.object)) {
        return true;
      }
      return false;
    }
    function isGestureObject(exp) {
      return (0, types_12.isCallExpression)(exp) && (0, types_12.isMemberExpression)(exp.callee) && (0, types_12.isIdentifier)(exp.callee.object) && exp.callee.object.name === "Gesture" && (0, types_12.isIdentifier)(exp.callee.property) && gestureHandlerGestureObjects.has(exp.callee.property.name);
    }
  }
});

// lib/isLayoutAnimationCallback.js
var require_isLayoutAnimationCallback = __commonJS({
  "lib/isLayoutAnimationCallback.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.isLayoutAnimationCallback = void 0;
    var types_12 = require("@babel/types");
    var EntryExitAnimations = /* @__PURE__ */ new Set([
      "BounceIn",
      "BounceInDown",
      "BounceInLeft",
      "BounceInRight",
      "BounceInUp",
      "BounceOut",
      "BounceOutDown",
      "BounceOutLeft",
      "BounceOutRight",
      "BounceOutUp",
      "FadeIn",
      "FadeInDown",
      "FadeInLeft",
      "FadeInRight",
      "FadeInUp",
      "FadeOut",
      "FadeOutDown",
      "FadeOutLeft",
      "FadeOutRight",
      "FadeOutUp",
      "FlipInEasyX",
      "FlipInEasyY",
      "FlipInXDown",
      "FlipInXUp",
      "FlipInYLeft",
      "FlipInYRight",
      "FlipOutEasyX",
      "FlipOutEasyY",
      "FlipOutXDown",
      "FlipOutXUp",
      "FlipOutYLeft",
      "FlipOutYRight",
      "LightSpeedInLeft",
      "LightSpeedInRight",
      "LightSpeedOutLeft",
      "LightSpeedOutRight",
      "PinwheelIn",
      "PinwheelOut",
      "RollInLeft",
      "RollInRight",
      "RollOutLeft",
      "RollOutRight",
      "RotateInDownLeft",
      "RotateInDownRight",
      "RotateInUpLeft",
      "RotateInUpRight",
      "RotateOutDownLeft",
      "RotateOutDownRight",
      "RotateOutUpLeft",
      "RotateOutUpRight",
      "SlideInDown",
      "SlideInLeft",
      "SlideInRight",
      "SlideInUp",
      "SlideOutDown",
      "SlideOutLeft",
      "SlideOutRight",
      "SlideOutUp",
      "StretchInX",
      "StretchInY",
      "StretchOutX",
      "StretchOutY",
      "ZoomIn",
      "ZoomInDown",
      "ZoomInEasyDown",
      "ZoomInEasyUp",
      "ZoomInLeft",
      "ZoomInRight",
      "ZoomInRotate",
      "ZoomInUp",
      "ZoomOut",
      "ZoomOutDown",
      "ZoomOutEasyDown",
      "ZoomOutEasyUp",
      "ZoomOutLeft",
      "ZoomOutRight",
      "ZoomOutRotate",
      "ZoomOutUp"
    ]);
    var LayoutTransitions = /* @__PURE__ */ new Set([
      "Layout",
      "LinearTransition",
      "SequencedTransition",
      "FadingTransition",
      "JumpingTransition",
      "CurvedTransition",
      "EntryExitTransition"
    ]);
    var LayoutAnimations = /* @__PURE__ */ new Set([
      ...EntryExitAnimations,
      ...LayoutTransitions
    ]);
    var BaseAnimationsChainableMethods = /* @__PURE__ */ new Set([
      "build",
      "duration",
      "delay",
      "getDuration",
      "randomDelay",
      "getDelay",
      "getDelayFunction"
    ]);
    var ComplexAnimationsChainableMethods = /* @__PURE__ */ new Set([
      "easing",
      "rotate",
      "springify",
      "damping",
      "mass",
      "stiffness",
      "overshootClamping",
      "restDisplacementThreshold",
      "restSpeedThreshold",
      "withInitialValues",
      "getAnimationAndConfig"
    ]);
    var DefaultTransitionChainableMethods = /* @__PURE__ */ new Set([
      "easingX",
      "easingY",
      "easingWidth",
      "easingHeight",
      "entering",
      "exiting",
      "reverse"
    ]);
    var LayoutAnimationsChainableMethods = /* @__PURE__ */ new Set([
      ...BaseAnimationsChainableMethods,
      ...ComplexAnimationsChainableMethods,
      ...DefaultTransitionChainableMethods
    ]);
    var LayoutAnimationsCallbacks = /* @__PURE__ */ new Set(["withCallback"]);
    function isLayoutAnimationCallback(path) {
      return (0, types_12.isCallExpression)(path.parent) && (0, types_12.isExpression)(path.parent.callee) && isLayoutAnimationCallbackMethod(path.parent.callee);
    }
    exports2.isLayoutAnimationCallback = isLayoutAnimationCallback;
    function isLayoutAnimationCallbackMethod(exp) {
      return (0, types_12.isMemberExpression)(exp) && (0, types_12.isIdentifier)(exp.property) && LayoutAnimationsCallbacks.has(exp.property.name) && isLayoutAnimationsChainableOrNewOperator(exp.object);
    }
    function isLayoutAnimationsChainableOrNewOperator(exp) {
      if ((0, types_12.isIdentifier)(exp) && LayoutAnimations.has(exp.name)) {
        return true;
      } else if ((0, types_12.isNewExpression)(exp) && (0, types_12.isIdentifier)(exp.callee) && LayoutAnimations.has(exp.callee.name)) {
        return true;
      }
      if ((0, types_12.isCallExpression)(exp) && (0, types_12.isMemberExpression)(exp.callee) && (0, types_12.isIdentifier)(exp.callee.property) && LayoutAnimationsChainableMethods.has(exp.callee.property.name) && isLayoutAnimationsChainableOrNewOperator(exp.callee.object)) {
        return true;
      }
      return false;
    }
  }
});

// lib/processIfCallback.js
var require_processIfCallback = __commonJS({
  "lib/processIfCallback.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.processIfAutoworkletizableCallback = void 0;
    var isGestureHandlerEventCallback_1 = require_isGestureHandlerEventCallback();
    var isLayoutAnimationCallback_1 = require_isLayoutAnimationCallback();
    var processIfWorkletNode_12 = require_processIfWorkletNode();
    function processIfAutoworkletizableCallback(path, state) {
      if ((0, isGestureHandlerEventCallback_1.isGestureHandlerEventCallback)(path) || (0, isLayoutAnimationCallback_1.isLayoutAnimationCallback)(path)) {
        (0, processIfWorkletNode_12.processWorklet)(path, state);
        return true;
      }
      return false;
    }
    exports2.processIfAutoworkletizableCallback = processIfAutoworkletizableCallback;
  }
});

// lib/addCustomGlobals.js
var require_addCustomGlobals = __commonJS({
  "lib/addCustomGlobals.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.addCustomGlobals = void 0;
    var globals_12 = require_globals();
    function addCustomGlobals() {
      if (this.opts && Array.isArray(this.opts.globals)) {
        this.opts.globals.forEach((name) => {
          globals_12.globals.add(name);
        });
      }
    }
    exports2.addCustomGlobals = addCustomGlobals;
  }
});

// lib/substituteWebCallExpression.js
var require_substituteWebCallExpression = __commonJS({
  "lib/substituteWebCallExpression.js"(exports2) {
    "use strict";
    Object.defineProperty(exports2, "__esModule", { value: true });
    exports2.substituteWebCallExpression = void 0;
    var types_12 = require("@babel/types");
    function substituteWebCallExpression(path) {
      const callee = path.node.callee;
      if ((0, types_12.isIdentifier)(callee)) {
        const name = callee.name;
        if (name === "isWeb" || name === "shouldBeUseWeb") {
          path.replaceWith((0, types_12.booleanLiteral)(true));
        }
      }
    }
    exports2.substituteWebCallExpression = substituteWebCallExpression;
  }
});

// lib/plugin.js
Object.defineProperty(exports, "__esModule", { value: true });
var processForCalleesWorklets_1 = require_processForCalleesWorklets();
var types_1 = require_types();
var processIfWorkletNode_1 = require_processIfWorkletNode();
var processInlineStylesWarning_1 = require_processInlineStylesWarning();
var processIfCallback_1 = require_processIfCallback();
var addCustomGlobals_1 = require_addCustomGlobals();
var globals_1 = require_globals();
var substituteWebCallExpression_1 = require_substituteWebCallExpression();
module.exports = function() {
  function runWithTaggedExceptions(fun) {
    try {
      fun();
    } catch (e) {
      throw new Error("[Reanimated] Babel plugin exception: " + e);
    }
  }
  return {
    pre() {
      runWithTaggedExceptions(() => {
        (0, globals_1.initializeGlobals)();
        addCustomGlobals_1.addCustomGlobals.call(this);
      });
    },
    visitor: {
      CallExpression: {
        enter(path, state) {
          runWithTaggedExceptions(() => {
            (0, processForCalleesWorklets_1.processCalleesAutoworkletizableCallbacks)(path, state);
            if (state.opts.substituteWebPlatformChecks) {
              (0, substituteWebCallExpression_1.substituteWebCallExpression)(path);
            }
          });
        }
      },
      [types_1.WorkletizableFunction]: {
        enter(path, state) {
          runWithTaggedExceptions(() => {
            (0, processIfWorkletNode_1.processIfWithWorkletDirective)(path, state) || (0, processIfCallback_1.processIfAutoworkletizableCallback)(path, state);
          });
        }
      },
      JSXAttribute: {
        enter(path, state) {
          runWithTaggedExceptions(() => (0, processInlineStylesWarning_1.processInlineStylesWarning)(path, state));
        }
      }
    }
  };
};
//# sourceMappingURL=plugin.js.map
