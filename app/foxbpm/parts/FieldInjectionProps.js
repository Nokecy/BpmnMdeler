'use strict';

var ImplementationTypeHelper = require('bpmn-js-properties-panel/lib/helper/ImplementationTypeHelper');

var fieldInjection = require('./implementation/FieldInjection');

module.exports = function(group, element, bpmnFactory) {

  if (!ImplementationTypeHelper.getServiceTaskLikeBusinessObject(element)) {
    return;
  }

  var fieldInjectionEntry = fieldInjection(element, bpmnFactory);

  if (fieldInjectionEntry && fieldInjectionEntry.length > 0) {
    group.entries = group.entries.concat(fieldInjectionEntry);
  }

};
