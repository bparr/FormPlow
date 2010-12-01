
const Ci = Components.interfaces;
const Cu = Components.utils;
const Cr = Components.results;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://formplow/AutoFill.jsm");

let Original = null;

function FormAutoComplete() {
  Original = Components.classesByID["{bf1e01d0-953e-11df-981c-0800200c9a66}"].
             getService(Ci.nsIInputListAutoComplete);
}

FormAutoComplete.prototype = {
  classID:        Components.ID("{7f0bbdc0-eb99-43fe-baa4-7477d545ed48}"),
  QueryInterface: XPCOMUtils.generateQI([Ci.nsIInputListAutoComplete]),

  autoCompleteSearch: function (aInputName, aSearchString, aField, aPrevious) {
    let result = Original.autoCompleteSearch.apply(Original, arguments);
    let newEntryNames = AutoFill.getEntryNames(aField);
    if (newEntryNames == null)
      return result;

    let newComments = newEntryNames.map(function() "");
    let wrapped = result.wrappedJSObject;
    wrapped._values = newEntryNames.concat(wrapped._values);
    wrapped._labels = newEntryNames.concat(wrapped._labels);
    wrapped._comments = newComments.concat(wrapped._comments);

    let numNew = newEntryNames.length;
    let numTotal = wrapped._values.length;
    function checkIndexBounds(aIndex) {
      if (aIndex < 0 || aIndex >= numTotal)
        throw Components.Exception("Index out of range.", Cr.NS_ERROR_ILLEGAL_VALUE);
    }

    wrapped.getImageAt = function(aIndex) {
      checkIndexBounds(aIndex);
      if (aIndex < numNew)
        return "chrome://global/skin/icons/commandline.png";

      return "";
    }

    wrapped.getStyleAt = function(aIndex) {
      checkIndexBounds(aIndex);
      return (aIndex == numNew) ? "formplowTopBorder" : "";
    }

    return result;
  }
}

let component = [FormAutoComplete];
let NSGetFactory = XPCOMUtils.generateNSGetFactory(component);

