
let EXPORTED_SYMBOLS = ["Utils"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

Components.utils.import("resource://formplow/Services.jsm");

let Utils = {
  // Set of blocked key codes
  _blockedKeyCodes: null,

  // Site whitelist
  _whitelist: null,

  // Initialize Utils
  _initialize: function() {
    this._initializeBlockedKeyCodes();
    this._initializeWhitelist();
  },

  // Check whether the event should be blocked
  isEventBlocked: function(aEvent) {
    // Check to see if user inputted a blocked key
    if (aEvent.ctrlKey || aEvent.altKey || aEvent.metaKey)
      return false;

    if (!this._blockedKeyCodes[aEvent.keyCode])
      return false;

    // Check if the target is an HTML element
    let target = aEvent.target;
    if (!target || !(target instanceof Ci.nsIDOMHTMLElement))
      return false;

    let topWindow = target.ownerDocument.defaultView.top;
    let topURI = topWindow.document.documentURIObject;
    if (topURI.scheme != "http" && topURI.scheme != "https")
      return false;

    return !this._isSiteTrusted(topURI);
  },

  // Add a site to the whitelist
  trustSite: function(aURI) {
    this._whitelist[aURI.host] = true;
  },

  // Check if the site is trusted based on what the browser knows
  _isSiteTrusted: function(aURI) {
    if (this._whitelist[aURI.host])
      return true;

    return this._historyTest(aURI) || this._passwordTest(aURI);
  },

  // Test that the site was visited on a day prior to today
  // Based on code from FormMetrics (http://github.com/bparr/FormMetrics)
  _historyTest: function(aURI) {
    let millisecondsInDay = 86400000; // 1000 * 60 * 60 * 24
    let now = Date.now();

    let options = Services.history.getNewQueryOptions();
    options.queryType = options.QUERY_TYPE_HISTORY;
    options.resultType = options.RESULTS_AS_VISIT;

    // Only need one result for a success
    options.maxResults = 1;

    let query = Services.history.getNewQuery();
    query.domainIsHost = true;
    query.domain = aURI.host;

    // Don't include entries that occurred today (in last 24 hours)
    query.endTimeReference = query.TIME_RELATIVE_NOW;
    query.endTime = -1000 * millisecondsInDay;

    let result = Services.history.executeQuery(query, options);
    let root = result.root;
    root.containerOpen = true;

    return (root.childCount > 0);
  },

  // Test if there is a password stored for the site
  // Based on code from FormMetrics (http://github.com/bparr/FormMetrics)
  _passwordTest: function(aURI) {
    // Based on the _getFormattedHostname function in mozilla-central's
    // toolkit/components/passwordmgr/src/nsLoginManagerPrompter.js
    let hostname = aURI.scheme + "://" + aURI.host;

    // Only include port if it's not the scheme's default
    let port = aURI.port;
    if (port != -1) {
      let handler = Services.io.getProtocolHandler(aURI.scheme);
      if (port != handler.defaultPort)
        hostname += ":" + port;
    }

    return (Services.login.countLogins(hostname, "", null) > 0);
  },

  // Get localised message
  // Based on https://developer.mozilla.org/En/Code_snippets/Miscellaneous#Using_string_bundles_from_JavaScript
  getString: function(aMsg, aArgs) {
    if (aArgs) {
      aArgs = Array.prototype.slice.call(arguments, 1);
      return this._stringBundle.formatStringFromName(aMsg, aArgs, aArgs.length);
    }

    return this._stringBundle.GetStringFromName(aMsg);
  },

  _stringBundle: Cc["@mozilla.org/intl/stringbundle;1"].
                 getService(Ci.nsIStringBundleService).
                 createBundle("chrome://formplow/locale/formplow.properties"),

  // Initialize set of blocked key codes
  _initializeBlockedKeyCodes: function() {
    // Generate alphanumeric keys
    let numericKeys = [];
    for (let i = 0; i < 10; i++)
      numericKeys.push(i, "NUMPAD" + i);
    let alphaKeys = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

    /*
     * Keys excluded:
     *    - SPACE because used to scroll pages
     *    - SLASH because used to Quick Find
     */
    let otherKeys = ["SEMICOLON", "EQUALS", "MULTIPLY", "ADD", "SEPARATOR",
                     "SUBTRACT", "DECIMAL", "DIVIDE", "COMMA", "PERIOD",
                     "BACK_QUOTE", "OPEN_BRACKET", "BACK_SLASH",
                     "CLOSE_BRACKET", "QUOTE"]

    // Retrieve key codes for blocked keys
    let blockedKeys = numericKeys.concat(alphaKeys, otherKeys);
    this._blockedKeyCodes = {};

    let keyEvent = Ci.nsIDOMKeyEvent;
    blockedKeys.forEach(function(aKey) {
      this._blockedKeyCodes[keyEvent["DOM_VK_" + aKey]] = true;
    }, this);
  },

  // Initialize set of whitelisted sites
  _initializeWhitelist: function() {
    this._whitelist = {};
  }
}

Utils._initialize();

