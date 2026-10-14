// SVG files are React components at runtime (react-native-svg-transformer); in tests they render nothing.
const React = require('react');

module.exports = function SvgMock() {
  return React.createElement('SvgMock');
};
module.exports.default = module.exports;
