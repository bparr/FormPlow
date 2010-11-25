
let FormPlow = {
  initialize: function() {
    window.removeEventListener("load", FormPlow.initialize, false);
    window.addEventListener("unload", FormPlow.shutdown, false);

    window.dump("initialize\n");
  },

  shutdown: function() {
    window.dump("shutdown\n");
  }
}

window.addEventListener("load", FormPlow.initialize, false);

