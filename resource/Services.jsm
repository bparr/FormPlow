
// Modeled off of toolkit/content/Services.jsm
let EXPORTED_SYMBOLS = ["Services"];

Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

let obj = {};
Components.utils.import("resource://gre/modules/Services.jsm", obj);
let Default = obj.Services;

let Services = {};

// Use default (built-in) services
["io"].forEach(function(aService) {
 XPCOMUtils.defineLazyGetter(Services, aService, function() Default[aService]);
});

// Add additional lazy service getters
XPCOMUtils.defineLazyServiceGetter(Services, "history",
                                   "@mozilla.org/browser/nav-history-service;1",
                                   "nsINavHistoryService");

XPCOMUtils.defineLazyServiceGetter(Services, "login",
                                   "@mozilla.org/login-manager;1",
                                   "nsILoginManager");

