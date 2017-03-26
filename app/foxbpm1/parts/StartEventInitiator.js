'use strict';

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    is = require('bpmn-js/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;


module.exports = function(group, element) {

  var bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if ( is(element, 'foxbpm:Initiator') && !is(element.parent, 'bpmn:SubProcess') ) {
    group.entries.push(entryFactory.textField({
      id: 'initiator',
      label: 'Initiator',
      modelProperty: 'initiator'
    }));
  }
};
