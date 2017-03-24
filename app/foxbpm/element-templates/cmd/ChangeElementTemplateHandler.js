'use strict';

var findExtension = require('../Helper').findExtension,
    findExtensions = require('../Helper').findExtensions;

var createCamundaProperty = require('../CreateHelper').createCamundaProperty,
    createInputParameter = require('../CreateHelper').createInputParameter,
    createOutputParameter = require('../CreateHelper').createOutputParameter,
    createCamundaIn = require('../CreateHelper').createCamundaIn,
    createCamundaOut = require('../CreateHelper').createCamundaOut,
    createCamundaInWithBusinessKey = require('../CreateHelper').createCamundaInWithBusinessKey,
    createCamundaExecutionListenerScript = require('../CreateHelper').createCamundaExecutionListenerScript;

var CAMUNDA_SERVICE_TASK_LIKE = [
  'foxbpm:class',
  'foxbpm:delegateExpression',
  'foxbpm:expression'
];

/**
 * A handler that changes the modeling template of a BPMN element.
 */
function ChangeElementTemplateHandler(modeling, commandStack, bpmnFactory) {

  function getOrCreateExtensionElements(element) {

    var bo = element.businessObject;

    var extensionElements = bo.extensionElements;

    // add extension elements
    if (!extensionElements) {
      extensionElements = bpmnFactory.create('bpmn:ExtensionElements', {
        values: []
      });

      modeling.updateProperties(element, {
        extensionElements: extensionElements
      });
    }

    return extensionElements;
  }

  function updateModelerTemplate(element, newTemplate) {
    modeling.updateProperties(element, {
      'foxbpm:modelerTemplate': newTemplate && newTemplate.id
    });
  }

  function updateIoMappings(element, newTemplate) {

    var extensionElements;

    var newMappings = createInputOutputMappings(newTemplate, bpmnFactory),
        oldMappings;

    if (newMappings) {
      extensionElements = getOrCreateExtensionElements(element);

      oldMappings = findExtension(element, 'foxbpm:InputOutput');

      commandStack.execute('properties-panel.update-businessobject-list', {
        element: element,
        currentObject: extensionElements,
        propertyName: 'values',
        objectsToAdd: [ newMappings ],
        objectsToRemove: oldMappings ? [ oldMappings ] : []
      });
    }
  }

  function updateCamundaProperties(element, newTemplate) {

    var extensionElements;

    var newProperties = createCamundaProperties(newTemplate, bpmnFactory),
        oldProperties;

    if (newProperties) {
      extensionElements = getOrCreateExtensionElements(element);

      oldProperties = findExtension(element, 'foxbpm:Properties');

      commandStack.execute('properties-panel.update-businessobject-list', {
        element: element,
        currentObject: extensionElements,
        propertyName: 'values',
        objectsToAdd: [ newProperties ],
        objectsToRemove: oldProperties ? [ oldProperties ] : []
      });
    }
  }

  function updateProperties(element, newTemplate) {

    var newProperties = createBpmnPropertyUpdates(newTemplate, bpmnFactory);

    if (Object.keys(newProperties).length > 0) {
      modeling.updateProperties(element, newProperties);
    }
  }

  function updateInOut(element, newTemplate) {

    var extensionElements;

    var newInOut = createCamundaInOut(newTemplate, bpmnFactory),
        oldInOut;

    if (newInOut) {
      extensionElements = getOrCreateExtensionElements(element);

      oldInOut = findExtensions(extensionElements, [ 'foxbpm:In', 'foxbpm:Out' ]);

      commandStack.execute('properties-panel.update-businessobject-list', {
        element: element,
        currentObject: extensionElements,
        propertyName: 'values',
        objectsToAdd: newInOut,
        objectsToRemove: oldInOut
      });
    }
  }

  function updateExecutionListener(element, newTemplate) {

    var newExecutionListeners = createCamundaExecutionListener(newTemplate, bpmnFactory),
        oldExecutionsListeners;

    if (newExecutionListeners.length) {
      var extensionElements = getOrCreateExtensionElements(element);

      oldExecutionsListeners = findExtensions(extensionElements, [ 'foxbpm:ExecutionListener' ]);

      commandStack.execute('properties-panel.update-businessobject-list', {
        element: element,
        currentObject: extensionElements,
        propertyName: 'values',
        objectsToAdd: newExecutionListeners,
        objectsToRemove: oldExecutionsListeners
      });
    }

  }

  /**
   * Compose an element template change action, updating all
   * necessary underlying properties.
   *
   * @param {Object} context
   * @param {Object} context.element
   * @param {Object} context.oldTemplate
   * @param {Object} context.newTemplate
   */
  this.preExecute = function(context) {

    var element = context.element,
        newTemplate = context.newTemplate;

    // update foxbpm:modelerTemplate attribute
    updateModelerTemplate(element, newTemplate);

    if (newTemplate) {

      // update foxbpm:inputOutput
      updateIoMappings(element, newTemplate);

      // update foxbpm:properties
      updateCamundaProperties(element, newTemplate);

      // update other properties (bpmn:condition, foxbpm:async, ...)
      updateProperties(element, newTemplate);

      // update foxbpm:in and foxbpm:out
      updateInOut(element, newTemplate);

      // update foxbpm:executionListener
      updateExecutionListener(element, newTemplate);
    }
  };
}

ChangeElementTemplateHandler.$inject = [ 'modeling', 'commandStack', 'bpmnFactory' ];

module.exports = ChangeElementTemplateHandler;



/////// helpers /////////////////////////////

function createBpmnPropertyUpdates(template, bpmnFactory) {

  var propertyUpdates = {};

  template.properties.forEach(function(p) {

    var binding = p.binding,
        bindingTarget = binding.name,
        propertyValue;

    if (binding.type === 'property') {

      if (bindingTarget === 'conditionExpression') {
        propertyValue = bpmnFactory.create('bpmn:FormalExpression', {
          body: p.value,
          language: binding.scriptFormat
        });
      } else {
        propertyValue = p.value;
      }

      // assigning foxbpm:async to true|false
      // assigning bpmn:conditionExpression to { $type: 'bpmn:FormalExpression', ... }
      propertyUpdates[bindingTarget] = propertyValue;

      // make sure we unset other "implementation types"
      // when applying a foxbpm:class template onto a preconfigured
      // foxbpm:delegateExpression element
      if (CAMUNDA_SERVICE_TASK_LIKE.indexOf(bindingTarget) !== -1) {
        CAMUNDA_SERVICE_TASK_LIKE.forEach(function(prop) {
          if (prop !== bindingTarget) {
            propertyUpdates[prop] = undefined;
          }
        });
      }
    }
  });

  return propertyUpdates;
}

function createCamundaProperties(template, bpmnFactory) {

  var properties = [];

  template.properties.forEach(function(p) {
    var binding = p.binding,
        bindingType  = binding.type;

    if (bindingType === 'foxbpm:property') {
      properties.push(createCamundaProperty(
        binding, p.value, bpmnFactory
      ));
    }
  });

  if (properties.length) {
    return bpmnFactory.create('foxbpm:Properties', {
      values: properties
    });
  }
}

function createInputOutputMappings(template, bpmnFactory) {

  var inputParameters = [],
      outputParameters = [];

  template.properties.forEach(function(p) {
    var binding = p.binding,
        bindingType = binding.type;

    if (bindingType === 'foxbpm:inputParameter') {
      inputParameters.push(createInputParameter(
        binding, p.value, bpmnFactory
      ));
    }

    if (bindingType === 'foxbpm:outputParameter') {
      outputParameters.push(createOutputParameter(
        binding, p.value, bpmnFactory
      ));
    }
  });

  // do we need to create new ioMappings (?)
  if (outputParameters.length || inputParameters.length) {
    return bpmnFactory.create('foxbpm:InputOutput', {
      inputParameters: inputParameters,
      outputParameters: outputParameters
    });
  }
}

function createCamundaInOut(template, bpmnFactory) {

  var inOuts = [];

  template.properties.forEach(function(p) {
    var binding = p.binding,
        bindingType  = binding.type;

    if (bindingType === 'foxbpm:in') {
      inOuts.push(createCamundaIn(
        binding, p.value, bpmnFactory
      ));
    } else
    if (bindingType === 'foxbpm:out') {
      inOuts.push(createCamundaOut(
        binding, p.value, bpmnFactory
      ));
    } else
    if (bindingType === 'foxbpm:in:businessKey') {
      inOuts.push(createCamundaInWithBusinessKey(
        binding, p.value, bpmnFactory
      ));
    }
  });

  return inOuts;
}


function createCamundaExecutionListener(template, bpmnFactory) {

  var executionListener = [];

  template.properties.forEach(function(p) {
    var binding = p.binding,
        bindingType  = binding.type;

    if (bindingType === 'foxbpm:executionListener') {
      executionListener.push(createCamundaExecutionListenerScript(
        binding, p.value, bpmnFactory
      ));
    }
  });

  return executionListener;
}