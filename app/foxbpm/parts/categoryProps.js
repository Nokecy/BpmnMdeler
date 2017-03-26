'use strict';

var categoryEntryFactory = require('./implementation/Category'),
    is = require('bpmn-js/lib/util/ModelUtil').is;

module.exports = function(group, element) {

  if (is(element, 'bpmn:Process')) {
    // name
    group.entries = group.entries.concat(categoryEntryFactory(element));
  }
};
