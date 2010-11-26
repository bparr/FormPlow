
let EXPORTED_SYMBOLS = ["Utils"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

let Utils = {

  _blockedKeyCodes: null,
  get blockedKeyCodes() {
    if (this._blockedKeyCodes == null) {
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
    }

    return this._blockedKeyCodes;
  }
}

