var postcss = require('postcss');
var postcssNested = require('postcss-nested');
var postcssNesting = require('postcss-nesting');
var resolveNestedSelector = require('..');

function actualResolvedSelector(plugin, code) {
  return postcss(plugin).process(code).then(function(result) {
    var resolvedSelectors = [];
    result.root.walkRules(function(rule) {
      resolvedSelectors = resolvedSelectors.concat(rule.selectors);
    });
    return resolvedSelectors.sort();
  }).catch(function(err) {
    console.log(err.stack);
  });
}

function postcssNestedResolve(code) {
  return actualResolvedSelector(postcssNested(), code);
}

function postcssNestingResolve(code) {
  return actualResolvedSelector(postcssNesting(), code);
}

function expected(code) {
  const codeWithoutAtNest = code.replace(/@nest /g, '/*@nest */');
  return postcss().process(codeWithoutAtNest).then(function(result) {
    var resolvedSelectors = [];
    result.root.walk(function(node) {
      if (node.type !== 'rule' && node.type !== 'atrule') return;

      const nodeContainsDeclChild = node.some(function(descendant) {
        return descendant.type === 'decl';
      });

      var nodeContainsBlockDescendant = false;
      node.walk(function(descendant) {
        if (descendant.type === 'rule' || descendant.type === 'atrule') {
          nodeContainsBlockDescendant = true;
          return false;
        }
      });

      if (node.type !== 'atrule' && !nodeContainsDeclChild && nodeContainsBlockDescendant) return;
      if (node.type === 'atrule' && !nodeContainsDeclChild) return;

      var selectors = (node.type === 'atrule') ? ['&'] : node.selectors;
      selectors.forEach(function(selector) {
        resolvedSelectors = resolvedSelectors.concat(resolveNestedSelector(selector, node));
      });
    });
    return resolvedSelectors.sort();
  }).catch(function(err) {
    console.log(err.stack);
  });
}

module.exports = {
  actualResolvedSelector: actualResolvedSelector,
  postcssNestedResolve: postcssNestedResolve,
  postcssNestingResolve: postcssNestingResolve,
  expected: expected,
};
