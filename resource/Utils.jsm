
let EXPORTED_SYMBOLS = ["Utils"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

let Utils = {
  _stringBundle: Cc["@mozilla.org/intl/stringbundle;1"].
                 getService(Ci.nsIStringBundleService).
                 createBundle("chrome://formplow/locale/formplow.properties"),

  // Based on https://developer.mozilla.org/En/Code_snippets/Miscellaneous#Using_string_bundles_from_JavaScript
  getString: function(aMsg, aArgs) {
    if (aArgs) {
      aArgs = Array.prototype.slice.call(arguments, 1);
      return this._stringBundle.formatStringFromName(aMsg, aArgs, aArgs.length);
    }

    return this._stringBundle.GetStringFromName(aMsg);
  }
}

