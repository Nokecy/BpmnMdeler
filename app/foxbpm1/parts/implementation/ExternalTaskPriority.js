'use strict';

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

var cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

module.exports = function(element, bpmnFactory, options) {

  var getBusinessObject = options.getBusinessObject;

  var externalTaskPriorityEntry = entryFactory.textField({
    id: 'externalTaskPriority',
    label: 'Task Priority',
    modelProperty: 'taskPriority',

    get: function(element, node) {
      var bo = getBusinessObject(element);
      return {
        taskPriority: bo.get('foxbpm:taskPriority')
      };
    },

    set: function(element, values) {
      var bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        'foxbpm:taskPriority': values.taskPriority || undefined
      });
    }

  });

  return [ externalTaskPriorityEntry ];

};
