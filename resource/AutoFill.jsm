
let EXPORTED_SYMBOLS = ["AutoFill"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

Cu.import("resource://formplow/Services.jsm");

let AutoFill = {
  getEntryNames: function(aField) {
    return null;
  },

  fill: function(aForm, aProfile) {
    return;
  }
}

