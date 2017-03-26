'use strict';

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory');

var cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper');

module.exports = function(element, bpmnFactory, options) {

  var getBusinessObject = options.getBusinessObject;

  var jobPriorityEntry = entryFactory.textField({
    id: 'jobPriority',
    label: 'Job Priority',
    modelProperty: 'jobPriority',

    get: function(element, node) {
      var bo = getBusinessObject(element);
      return {
        jobPriority: bo.get('foxbpm:jobPriority')
      };
    },

    set: function(element, values) {
      var bo = getBusinessObject(element);
      return cmdHelper.updateBusinessObject(element, bo, {
        'foxbpm:jobPriority': values.jobPriority || undefined
      });
    }

  });

  return [ jobPriorityEntry ];

};
