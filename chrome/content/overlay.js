
let FormPlow = {
  _formPanel: null,
  _autoFillData: null,

  initialize: function() {
    let self = FormPlow;

    Cu.import("resource://formplow/Utils.jsm", self);
    Cu.import("resource://formplow/Phish.jsm", self);
    Cu.import("resource://formplow/AutoFill.jsm", self);

    window.removeEventListener("load", self.initialize, false);
    window.addEventListener("unload", self.shutdown, false);
    window.addEventListener("keydown", self.handleKeyDown, true);

    let popup = document.getElementById("PopupAutoComplete");
    popup.addEventListener("popuphidden", self.handlePopupHidden, true);

    let button = document.getElementById("formplow-form-panel-button");
    button.addEventListener("command", self.handleButtonCommand, true);

    self._formPanel = document.getElementById("formplow-form-panel");
  },

  shutdown: function() {
    let self = FormPlow;
    window.removeEventListener("unload", self.shutdown, false);
    window.removeEventListener("keydown", self.handleKeyDown, true);

    let popup = document.getElementById("PopupAutoComplete");
    popup.removeEventListener("popuphidden", self.handlePopupHidden, true);

    let button = document.getElementById("formplow-form-panel-button");
    button.removeEventListener("command", self.handleButtonCommand, true);
  },

  handleKeyDown: function(aEvent) {
    let self = FormPlow;

    if (!self.Phish.isEventBlocked(aEvent))
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
    if (PopupNotifications.getNotification(notificationID, browser) &&
        browser._formplowLastHost &&
        browser._formplowLastHost == uri.host) {
      return;
    }

    let message = self.Utils.getString("notification.message", uri.host);
    const anchorID = "formplow-notification-icon";

    let mainAction = {
      label: self.Utils.getString("notification.mainAction.label"),
      accessKey: self.Utils.getString("notification.mainAction.accessKey"),
      callback: function() {
        self.Phish.trustSite(uri);
      }
    };

    let secondaryActions = [{
      label: self.Utils.getString("notification.secondaryAction1.label"),
      accessKey: self.Utils.getString("notification.secondaryAction1.accessKey"),
      callback: function() {
        alert(self.Utils.getString("sitereported.message"));
        browser.goHome();
      }
    }, {
      label: self.Utils.getString("notification.secondaryAction2.label"),
      accessKey: self.Utils.getString("notification.secondaryAction2.accessKey"),
      callback: function() {
        BrowserPageInfo(null, "securityTab");
      }
    }];

    let options = {
      timeout:     Date.now() + 5000,
      persistWhileVisible: true
    };

    browser._formplowLastHost = uri.host;
    PopupNotifications.show(browser, notificationID, message, anchorID,
                            mainAction, secondaryActions, options);
    aEvent.target.focus();
  },

  handlePopupHidden: function(aEvent) {
    let self = FormPlow;

    self._autoFillData = self.AutoFill.handlePopupHidden(aEvent);
    if (self._autoFillData == null ||
        self._autoFillData.warnings.length == 0)
      return;

    let description = self._formPanel.firstChild;
    let warnings = self._autoFillData.warnings.join(" and ");
    description.textContent = self.Utils.getString("panel.message", warnings);

    self._autoFillData.field.focus();
    self._formPanel.hidden = false;
    self._formPanel.openPopup(self._autoFillData.field, "after_start", 0, 0);
  },

  handleButtonCommand: function(aEvent) {
    let self = FormPlow;

    self._formPanel.hidePopup();
    self._formPanel.hidden = true;

    self.AutoFill.refill(self._autoFillData);
    self._autoFillData = null;
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

