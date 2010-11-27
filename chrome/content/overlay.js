
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

    if (!self.Utils.isEventBlocked(aEvent))
      return;

    aEvent.preventDefault();
    aEvent.stopPropagation();
    return false;
  },
}

window.addEventListener("load", FormPlow.initialize, false);

