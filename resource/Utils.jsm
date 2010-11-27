
let EXPORTED_SYMBOLS = ["Utils"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

let Utils = {
  // Check whether the event should be blocked
  isEventBlocked: function(aEvent) {
    // Check to see if user inputted a blocked key
    if (aEvent.ctrlKey || aEvent.altKey || aEvent.metaKey)
      return false;

    if (!this._blockedKeyCodes[aEvent.keyCode])
      return false;

    return true;
  },

  // Lazily generate set of blocked key codes
  get _blockedKeyCodes() {
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
    let blockedKeyCodes = {};

    let keyEvent = Ci.nsIDOMKeyEvent;
    blockedKeys.forEach(function(aKey) {
      blockedKeyCodes[keyEvent["DOM_VK_" + aKey]] = true;
    }, this);

    // Replace the getter with the set of blocked key codes
    delete this._blockedKeyCodes;
    this._blockedKeyCodes = blockedKeyCodes;

    return blockedKeyCodes;
  }
}

