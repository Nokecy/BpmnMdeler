'use strict';

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

/**
 * Create an entry to modify the name of an an element.
 *
 * @param  {djs.model.Base} element
 * @param  {Object} options
 * @param  {string} options.id the id of the entry
 * @param  {string} options.label the label of the entry
 *
 * @return {Array<Object>} return an array containing
 *                         the entry to modify the name
 */
module.exports = function(element, options) {

  options = options || {};
  var id = options.id || 'category',
      label = options.label || 'Category',
      modelProperty = options.modelProperty || 'category';

  var nameEntry = entryFactory.textBox({
    id: id,
    label: label,
    modelProperty: modelProperty
  });

  return [ nameEntry ];

};
