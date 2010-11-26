
let FormPlow = {
  initialize: function() {
    let self = FormPlow;

    Cu.import("resource://formplow/Utils.jsm", self);

    window.removeEventListener("load", self.initialize, false);
    window.addEventListener("unload", self.shutdown, false);
    window.addEventListener("keydown", self.handleKeyDown, true);
  },

  shutdown: function() {
    let self = FormPlow;
    window.removeEventListener("unload", self.shutdown, false);
    window.removeEventListener("keydown", self.handleKeyDown, true);
  },

  handleKeyDown: function(aEvent) {
    let self = FormPlow;
    window.dump(self.isEventBlocked(aEvent) + "\n");
  },

  isEventBlocked: function(aEvent) {
    if (aEvent.ctrlKey || aEvent.altKey || aEvent.metaKey)
      return false;

    return !!this.Utils.blockedKeyCodes[aEvent.keyCode];
  }
}

window.addEventListener("load", FormPlow.initialize, false);

