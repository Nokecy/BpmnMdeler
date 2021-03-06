'use strict';

var inherits = require('inherits');

var getTemplate = require('./Helper').getTemplate;

var PropertiesActivator = require('bpmn-js-properties-panel/lib/PropertiesActivator');

var HIGHER_PRIORITY = 1100;

/**
 * Applies template visibility settings.
 *
 * Controlled using `entriesVisible` on template config object:
 *
 * ```json
 *     "entriesVisible": {
 *       "_all": true|false,
 *       "entryName": true|false,
 *       ...
 *     }
 * ```
 *
 * @param {EventBus} eventBus
 * @param {ElementTemplates} elementTemplates
 */
function CustomElementsPropertiesActivator(eventBus, elementTemplates) {
  PropertiesActivator.call(this, eventBus, HIGHER_PRIORITY);

  this.isEntryVisible = function(entry, element) {

    var template = getTemplate(element, elementTemplates);

    if (template && !isEntryVisible(entry, template)) {
      return false;
    }
  };

  this.isPropertyEditable = function(entry, propertyName, element) {

    var template = getTemplate(element, elementTemplates);

    if (template && !isEntryEditable(entry, template)) {
      return false;
    }
  };
}

CustomElementsPropertiesActivator.$inject = [ 'eventBus', 'elementTemplates' ];

inherits(CustomElementsPropertiesActivator, PropertiesActivator);

module.exports = CustomElementsPropertiesActivator;



////// helpers ////////////////////////////////////


var CUSTOM_PROPERTIES_PATTERN = /^custom-/;

var DEFAULT_ENTRIES_VISIBLE = {
  _all: false,
  id: true,
  name: true
};

function isCustomEntry(entry) {
  return CUSTOM_PROPERTIES_PATTERN.test(entry.id);
}

function isEntryVisible(entry, template) {

  var entryId = entry.id;

  if (entryId === 'elementTemplate-chooser' || isCustomEntry(entry)) {
    return true;
  }

  var entriesVisible = template.entriesVisible || DEFAULT_ENTRIES_VISIBLE;

  if (typeof entriesVisible === 'boolean') {
    return entriesVisible;
  }

  var defaultVisible = entriesVisible._all || false,
      entryVisible = entriesVisible[entryId];

  // d = true, e = false => false
  // d = false, e = true => true
  // d = false, e = false
  return (
    (defaultVisible === true && entryVisible !== false) ||
    (defaultVisible === false && entryVisible === true)
  );
}

function isEntryEditable(entry, template) {

  var property;

  if (isCustomEntry(entry)) {
    property = getProperty(template, entry);

    return property && property.editable !== false;
  }

  return true;
}

function getProperty(template, entry) {

  var index = parseInt(entry.id.replace('custom-' + template.id + '-', ''), 10);

  if (isNaN(index)) {
    throw new Error('cannot extract property index for entry <' + entry.id + '>');
  }

  return template.properties[index];
}
