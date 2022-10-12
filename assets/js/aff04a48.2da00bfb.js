"use strict";(self.webpackChunkreact_native_reanimated=self.webpackChunkreact_native_reanimated||[]).push([[1905],{3905:function(e,t,n){n.d(t,{Zo:function(){return l},kt:function(){return d}});var r=n(7294);function i(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){i(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function u(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var c=r.createContext({}),s=function(e){var t=r.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},l=function(e){var t=s(e.components);return r.createElement(c.Provider,{value:t},e.children)},m={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},p=r.forwardRef((function(e,t){var n=e.components,i=e.mdxType,a=e.originalType,c=e.parentName,l=u(e,["components","mdxType","originalType","parentName"]),p=s(n),d=i,f=p["".concat(c,".").concat(d)]||p[d]||m[d]||a;return n?r.createElement(f,o(o({ref:t},l),{},{components:n})):r.createElement(f,o({ref:t},l))}));function d(e,t){var n=arguments,i=t&&t.mdxType;if("string"==typeof e||i){var a=n.length,o=new Array(a);o[0]=p;var u={};for(var c in t)hasOwnProperty.call(t,c)&&(u[c]=t[c]);u.originalType=e,u.mdxType="string"==typeof e?e:i,o[1]=u;for(var s=2;s<a;s++)o[s]=n[s];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}p.displayName="MDXCreateElement"},3378:function(e,t,n){n.r(t),n.d(t,{assets:function(){return c},contentTitle:function(){return o},default:function(){return m},frontMatter:function(){return a},metadata:function(){return u},toc:function(){return s}});var r=n(3117),i=(n(7294),n(3905));const a={id:"withSequence",title:"withSequence",sidebar_label:"withSequence"},o=void 0,u={unversionedId:"api/animations/withSequence",id:"api/animations/withSequence",title:"withSequence",description:"Runs the provided animations in a sequence.",source:"@site/docs/api/animations/withSequence.md",sourceDirName:"api/animations",slug:"/api/animations/withSequence",permalink:"/react-native-reanimated/docs/next/api/animations/withSequence",draft:!1,tags:[],version:"current",frontMatter:{id:"withSequence",title:"withSequence",sidebar_label:"withSequence"},sidebar:"docs",previous:{title:"withRepeat",permalink:"/react-native-reanimated/docs/next/api/animations/withRepeat"},next:{title:"withSpring",permalink:"/react-native-reanimated/docs/next/api/animations/withSpring"}},c={},s=[{value:"Arguments",id:"arguments",level:3},{value:"<code>...animations</code> Variable number of animation objects",id:"animations-variable-number-of-animation-objects",level:4},{value:"Returns",id:"returns",level:3},{value:"Example",id:"example",level:2}],l={toc:s};function m(e){let{components:t,...n}=e;return(0,i.kt)("wrapper",(0,r.Z)({},l,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("p",null,"Runs the provided animations in a sequence.\nThis modifier takes one or more animation objects as arguments (however fewer than two does not make too much sense).\nThen the execution starts by running the first animation, and the next one is started immediately after the first one is over."),(0,i.kt)("h3",{id:"arguments"},"Arguments"),(0,i.kt)("h4",{id:"animations-variable-number-of-animation-objects"},(0,i.kt)("inlineCode",{parentName:"h4"},"...animations")," ","[Variable number of animation objects]"),(0,i.kt)("p",null,"The animations to be run in sequence."),(0,i.kt)("h3",{id:"returns"},"Returns"),(0,i.kt)("p",null,"This method returns an animation object. It can be either assigned directly to a Shared Value or can be used as a value for a style object returned from ",(0,i.kt)("a",{parentName:"p",href:"../hooks/useAnimatedStyle"},(0,i.kt)("inlineCode",{parentName:"a"},"useAnimatedStyle")),"."),(0,i.kt)("h2",{id:"example"},"Example"),(0,i.kt)("p",null,"In the below example the Shared Values is initialized with 0.\nWe start a sequence of timing animations: first from 0 to 70 and then back to 0.\nThe sequence will will result in the value returning to the original position."),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-js"},"sharedValue.value = withSequence(withTiming(70), withTiming(0))\n")))}m.isMDXComponent=!0}}]);