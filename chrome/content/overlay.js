
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

    let ownerDocument = aEvent.target.ownerDocument;
    let topWindow = ownerDocument.defaultView.top;
    let uri = topWindow.document.documentURIObject;
    let browser = self._getBrowser(topWindow);

    if (browser == null) {
      Cu.reportError("FormPlow: Could not find browser for given window");
      return;
    }

    const notificationID = "formplow";
    let message = self.Utils.getString("notification.message", uri.host);
    const anchorID = "formplow-notification-icon";

    let mainAction = {
      label: self.Utils.getString("notification.mainAction.label"),
      accessKey: self.Utils.getString("notification.mainAction.accessKey"),
      callback: function() {
        self.Utils.trustSite(uri);
      }
    };

    let secondaryActions = [{
      label: self.Utils.getString("notification.secondaryAction.label"),
      accessKey: self.Utils.getString("notification.secondaryAction.accessKey"),
      callback: function() {
        BrowserPageInfo(null, "securityTab");
      }
    }];

    let options = {
      timeout:     Date.now() + 5000,
      persistWhileVisible: true
    };

    PopupNotifications.show(browser, notificationID, message, anchorID,
                            mainAction, secondaryActions, options);
  },

  _getBrowser: function(aWindow) {
    let browsers = gBrowser.browsers;
    for (let i = 0; i < browsers.length; i++)
      if (aWindow == browsers[i].contentWindow)
        return browsers[i];

    return null;
  }
}

window.addEventListener("load", FormPlow.initialize, false);

