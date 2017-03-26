'use strict';

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    extensionElementsHelper = require('bpmn-js-properties-panel/lib/helper/ExtensionElementsHelper'),
    elementHelper = require('bpmn-js-properties-panel/lib/helper/ElementHelper');

var assign = require('lodash/object/assign');
var map = require('lodash/collection/map');

var DEFAULT_DELEGATE_PROPS = [ 'class', 'expression', 'delegateExpression' ];

var DELEGATE_PROPS = {
  'foxbpm:class': undefined,
  'foxbpm:expression': undefined,
  'foxbpm:delegateExpression': undefined,
  'foxbpm:resultVariable': undefined
};

var DMN_CAPABLE_PROPS = {
  'foxbpm:decisionRef': undefined,
  'foxbpm:decisionRefBinding': 'latest',
  'foxbpm:decisionRefVersion': undefined,
  'foxbpm:mapDecisionResult': 'resultList',
  'foxbpm:decisionRefTenantId': undefined
};


var EXTERNAL_CAPABLE_PROPS = {
  'foxbpm:type': undefined,
  'foxbpm:topic': undefined
};

var DEFAULT_OPTIONS = [
  { value: 'class', name: 'Java Class' },
  { value: 'expression', name: 'Expression' },
  { value: 'delegateExpression', name: 'Delegate Expression' }
];

var DMN_OPTION = [
  { value: 'dmn', name: 'DMN' }
];

var EXTERNAL_OPTION = [
  { value: 'external', name: 'External' }
];

var CONNECTOR_OPTION = [
  { value: 'connector', name: 'Connector' }
];

var SCRIPT_OPTION = [
  { value: 'script', name: 'Script' }
];

module.exports = function(element, bpmnFactory, options) {

  var getType           = options.getImplementationType,
      getBusinessObject = options.getBusinessObject;

  var hasDmnSupport             = options.hasDmnSupport,
      hasExternalSupport        = options.hasExternalSupport,
      hasServiceTaskLikeSupport = options.hasServiceTaskLikeSupport,
      hasScriptSupport          = options.hasScriptSupport;

  var entries = [];

  var selectOptions = DEFAULT_OPTIONS.concat([]);

  if (hasDmnSupport) {
    selectOptions = selectOptions.concat(DMN_OPTION);
  }

  if (hasExternalSupport) {
    selectOptions = selectOptions.concat(EXTERNAL_OPTION);
  }

  if (hasServiceTaskLikeSupport) {
    selectOptions = selectOptions.concat(CONNECTOR_OPTION);
  }

  if (hasScriptSupport) {
    selectOptions = selectOptions.concat(SCRIPT_OPTION);
  }

  selectOptions.push({ value: '' });

  entries.push(entryFactory.selectBox({
    id : 'implementation',
    label: 'Implementation',
    selectOptions: selectOptions,
    modelProperty: 'implType',

    get: function(element, node) {
      return {
        implType: getType(element) || ''
      };
    },

    set: function(element, values, node) {
      var bo = getBusinessObject(element);
      var oldType = getType(element);
      var newType = values.implType;

      var props = assign({}, DELEGATE_PROPS);

      if (DEFAULT_DELEGATE_PROPS.indexOf(newType) !== -1) {

        var newValue = '';
        if (DEFAULT_DELEGATE_PROPS.indexOf(oldType) !== -1) {
          newValue = bo.get('foxbpm:' + oldType);
        }
        props['foxbpm:' + newType] = newValue;
      }

      if (hasDmnSupport) {
        props = assign(props, DMN_CAPABLE_PROPS);
        if (newType === 'dmn') {
          props['foxbpm:decisionRef'] = '';
        }
      }

      if (hasExternalSupport) {
        props = assign(props, EXTERNAL_CAPABLE_PROPS);
        if (newType === 'external') {
          props['foxbpm:type'] = 'external';
          props['foxbpm:topic'] = '';
        }
      }

      if (hasScriptSupport) {      
        props['foxbpm:script'] = undefined;

        if (newType === 'script') {
          props['foxbpm:script'] = elementHelper.createElement('foxbpm:Script', {}, bo, bpmnFactory);
        }
      }

      var commands = [];
      commands.push(cmdHelper.updateBusinessObject(element, bo, props));

      if (hasServiceTaskLikeSupport) {
        var connectors = extensionElementsHelper.getExtensionElements(bo, 'foxbpm:Connector');
        commands.push(map(connectors, function(connector) {
          return extensionElementsHelper.removeEntry(bo, element, connector);
        }));

        if (newType === 'connector') {
          var extensionElements = bo.get('extensionElements');
          if (!extensionElements) {
            extensionElements = elementHelper.createElement('bpmn:ExtensionElements', { values: [] }, bo, bpmnFactory);
            commands.push(cmdHelper.updateBusinessObject(element, bo, { extensionElements: extensionElements }));
          }
          var connector = elementHelper.createElement('foxbpm:Connector', {}, extensionElements, bpmnFactory);
          commands.push(cmdHelper.addAndRemoveElementsFromList(
            element,
            extensionElements,
            'values',
            'extensionElements',
            [ connector ],
            []
          ));
        }
      }

      return commands;

    }
  }));

  return entries;

};
