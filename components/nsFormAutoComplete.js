
const Ci = Components.interfaces;
const Cu = Components.utils;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://formplow/AutoFill.jsm");

let Original = null;

function FormAutoComplete() {
  Original = Components.classesByID["{c11c21b2-71c9-4f87-a0f8-5e13f50495fd}"].
             getService(Ci.nsIFormAutoComplete);
}

FormAutoComplete.prototype = {
  classID:        Components.ID("{7f0bbdc0-eb99-43fe-baa4-7477d545ed48}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIFormAutoComplete,
                                         Ci.nsISupportsWeakReference]),
  autoCompleteSearch: function (aInputName, aSearchString, aField, aPrevious) {
    let result = Original.autoCompleteSearch.apply(Original, arguments);
    let newEntryNames = AutoFill.getEntryNames(aField);
    if (newEntryNames == null)
      return result;

    let frecency = 99999.9;
    let newEntries = newEntryNames.map(function(aName) {
      frecency--;
      return {
        text:    aName,
        textLowerCase: aName.toLowerCase(),
        frecency: frecency,
        totalScore: Math.round(frecency)
      }
    });

    let entries = result.wrappedJSObject.entries;
    result.wrappedJSObject.entries = newEntries.concat(entries);
    return result;
  }
}

let component = [FormAutoComplete];
let NSGetFactory = XPCOMUtils.generateNSGetFactory(component);

