'use strict';

var getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject,
    is = require('bpmn-js/lib/util/ModelUtil').is;

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

var callable = require('./implementation/Callable');

var cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

var flattenDeep = require('lodash/array/flattenDeep');
var assign = require('lodash/object/assign');

function getCallableType(element) {
  var bo = getBusinessObject(element);

  var boCalledElement = bo.get('calledElement'),
      boCaseRef = bo.get('foxbpm:caseRef');

  var callActivityType = '';
  if (typeof boCalledElement !== 'undefined') {
    callActivityType = 'bpmn';
  } else

  if (typeof boCaseRef !== 'undefined') {
    callActivityType = 'cmmn';
  }

  return callActivityType;
}

var DEFAULT_PROPS = {
  calledElement: undefined,
  'foxbpm:calledElementBinding': 'latest',
  'foxbpm:calledElementVersion': undefined,
  'foxbpm:calledElementTenantId': undefined,
  'foxbpm:variableMappingClass' : undefined,
  'foxbpm:variableMappingDelegateExpression' : undefined,
  'foxbpm:caseRef': undefined,
  'foxbpm:caseBinding': 'latest',
  'foxbpm:caseVersion': undefined,
  'foxbpm:caseTenantId': undefined
};

module.exports = function(group, element, bpmnFactory) {

  if (!is(element, 'foxbpm:CallActivity')) {
    return;
  }

  group.entries.push(entryFactory.selectBox({
    id : 'callActivity',
    label: 'CallActivity Type',
    selectOptions: [
      { name: 'BPMN', value: 'bpmn' },
      { name: 'CMMN', value: 'cmmn' }
    ],
    emptyParameter: true,
    modelProperty: 'callActivityType',

    get: function(element, node) {
      return {
        callActivityType: getCallableType(element)
      };
    },

    set: function(element, values, node) {
      var type = values.callActivityType;

      var props = assign({}, DEFAULT_PROPS);

      if (type === 'bpmn') {
        props.calledElement = '';
      }
      else if (type === 'cmmn') {
        props['foxbpm:caseRef'] = '';
      }

      return cmdHelper.updateProperties(element, props);
    }

  }));

  group.entries.push(callable(element, bpmnFactory, {
    getCallableType: getCallableType
  }));

  group.entries = flattenDeep(group.entries);
};
