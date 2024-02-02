'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const utils_1 = require('@typescript-eslint/utils');
const rule = {
  create: function (context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.type === utils_1.AST_NODE_TYPES.JSXMemberExpression)
          return; // Property-like namespace syntax <Animated.View>
        if (node.name.type === utils_1.AST_NODE_TYPES.JSXNamespacedName) return; // XML-based namespace syntax: <Animated:View>
        const sourceCode = context.getSourceCode();
        const tokensBefore = sourceCode.getTokensBefore(node);
        const componentName = node?.name?.name;
        function isVariableDefinedAs(variableName, expectedToken) {
          let isAnimated = false;
          const variableNameTokenIds = [];
          tokensBefore.forEach((token, idx) => {
            if (token.value === variableName) {
              variableNameTokenIds.push(idx);
            }
          });
          variableNameTokenIds.forEach((idx) => {
            if (tokensBefore[idx + 2].value === expectedToken) {
              isAnimated = true;
            }
          });
          return isAnimated;
        }
        function checkIdentifierNode(styleExpression) {
          const variableName = styleExpression.name;
          const isAnimatedStyle = isVariableDefinedAs(
            variableName,
            'useAnimatedStyle'
          );
          if (isAnimatedStyle) {
            context.report({
              node,
              messageId: 'animatedStyle',
              data: { componentName, variableName },
            });
          }
        }
        function checkObjectNode(styleExpression) {
          const properties = styleExpression.properties;
          properties.forEach((property) => {
            if (property.type === utils_1.AST_NODE_TYPES.SpreadElement) {
              return; //Ignore spread elements
            }
            if (property.value.type === 'Identifier') {
              const variableName = property.value.name;
              if (isVariableDefinedAs(variableName, 'useSharedValue')) {
                const propertyName =
                  'name' in property.key ? property.key.name : variableName;
                context.report({
                  node,
                  messageId: 'sharedValue',
                  data: { propertyName, propertyValue: variableName },
                });
              }
            }
          });
        }
        function checkArrayNode(styleExpression) {
          const arrayNodes = styleExpression.elements;
          arrayNodes.forEach((node) => {
            if (node?.type === 'Identifier') {
              checkIdentifierNode(node);
            } else if (node?.type === 'ArrayExpression') {
              checkArrayNode(node);
            } else if (node?.type === 'ObjectExpression') {
              checkObjectNode(node);
            }
          });
        }
        if (
          isVariableDefinedAs(componentName, 'Animated') ||
          isVariableDefinedAs(componentName, 'createAnimatedComponent')
        ) {
          return;
        }
        const styleAttribute = node.attributes
          .map((attribute) => {
            return attribute.type === utils_1.AST_NODE_TYPES.JSXAttribute &&
              attribute.name.name === 'style'
              ? [attribute]
              : [];
          })
          .flat();
        if (styleAttribute.length == 0) {
          return;
        }
        const styleValue = styleAttribute[0].value; // assume no duplicate props
        if (
          styleValue === null ||
          styleValue.type === utils_1.AST_NODE_TYPES.Literal
        ) {
          return; //incorrect styles
        }
        if (styleValue.type === utils_1.AST_NODE_TYPES.JSXSpreadChild) {
          return; //TODO Ignore this for now
        }
        const styleExpression = styleValue.expression;
        switch (styleExpression.type) {
          case utils_1.AST_NODE_TYPES.Identifier: // style={myVariable}
            checkIdentifierNode(styleExpression);
            break;
          case utils_1.AST_NODE_TYPES.ArrayExpression: // style={[style1, style2]}
            checkArrayNode(styleExpression);
            break;
          case utils_1.AST_NODE_TYPES.ObjectExpression: //style={{backgroundColor:'pink'}}
            checkObjectNode(styleExpression);
            break;
          case utils_1.AST_NODE_TYPES.MemberExpression:
          //style={{backgroundColor:styles.myStyle}}
          //We assume that all member expressions are correct
        }
      },
    };
  },
  meta: {
    docs: {
      recommended: 'recommended',
      description: 'Avoid looping over enums.',
    },
    messages: {
      sharedValue:
        "Property  '{{propertyName} : {{propertyValue}}' is using a sharedValue '{{propertyValue}}', but was used in a default component. Replace your {{componentName}} with an Animated.{{componentName}}",
      animatedStyle:
        "Style '{{variableName}}' is an animated style, but was used in a default component. Replace your '{{componentName}}' with an Animated.{{componentName}}",
    },
    type: 'suggestion',
    schema: [],
  },
  defaultOptions: [],
};
exports.default = rule;
