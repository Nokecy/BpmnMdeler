'use strict';

var entryFactory = require('bpmn-js-properties-panel/lib/factory/EntryFactory'),
    cmdHelper = require('bpmn-js-properties-panel/lib/helper/CmdHelper'),
    is = require('bpmn-js/lib/util/ModelUtil').is,
    getBusinessObject = require('bpmn-js/lib/util/ModelUtil').getBusinessObject;

module.exports = function(group, element) {

  var bo = getBusinessObject(element);

  if (!bo) {
    return;
  }

  if (is(element, 'bpmn:Process') || is(element, 'bpmn:Participant') && bo.get('processRef')) {
    var versionTagEntry = entryFactory.textField({
      id: 'versionTag',
      label: 'Version Tag',
      modelProperty: 'versionTag'
    });

    // in participants we have to change the default behavior of set and get
    if (is(element, 'bpmn:Participant')) {
      versionTagEntry.get = function(element) {
        var processBo = bo.get('processRef');
        
        return {
          versionTag: processBo.get('foxbpm:versionTag')
        };
      };

      versionTagEntry.set = function(element, values) {
        var processBo = bo.get('processRef');

        return cmdHelper.updateBusinessObject(element, processBo, {
          'foxbpm:versionTag': values.versionTag || undefined
        });
      };
    }

    group.entries.push(versionTagEntry);

  }
};
