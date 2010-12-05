
let FormPlow = {
  // The form panel element used to display AutoFill warnings
  _formPanel: null,

  // Data about the last autofill so that users can respond to AutoFill warnings
  _autoFillData: null,

  // Initialize the FormPlow object for this window
  initialize: function() {
    let self = FormPlow;

    // Import JavaScript modules
    Cu.import("resource://formplow/Utils.jsm", self);
    Cu.import("resource://formplow/Phish.jsm", self);
    Cu.import("resource://formplow/AutoFill.jsm", self);

    // Add event listeners
    window.removeEventListener("load", self.initialize, false);
    window.addEventListener("unload", self.shutdown, false);
    window.addEventListener("keydown", self.handleKeyDown, true);

    let popup = document.getElementById("PopupAutoComplete");
    popup.addEventListener("popuphidden", self.handlePopupHidden, true);

    let button = document.getElementById("formplow-form-panel-button");
    button.addEventListener("command", self.handleButtonCommand, true);

    self._formPanel = document.getElementById("formplow-form-panel");
  },

  // Uninitialize the FormPlow extension
  shutdown: function() {
    let self = FormPlow;

    // Remove event listeners
    window.removeEventListener("unload", self.shutdown, false);
    window.removeEventListener("keydown", self.handleKeyDown, true);

    let popup = document.getElementById("PopupAutoComplete");
    popup.removeEventListener("popuphidden", self.handlePopupHidden, true);

    let button = document.getElementById("formplow-form-panel-button");
    button.removeEventListener("command", self.handleButtonCommand, true);
  },

  // Handle the key down event
  handleKeyDown: function(aEvent) {
    let self = FormPlow;

    // If the key down event is not blocked, do nothing
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

    // Don't show phishing notification if it was dismissed and the current
    // host is same as host when dismissed
    if (PopupNotifications.getNotification(notificationID, browser) &&
        browser._formplowLastHost &&
        browser._formplowLastHost == uri.host) {
      return;
    }

    browser._formplowLastHost = uri.host;

    let message = self.Utils.getString("notification.message", uri.host);
    const anchorID = "formplow-notification-icon";

    // Initialize main "Trust Site" action
    let mainAction = {
      label: self.Utils.getString("notification.mainAction.label"),
      accessKey: self.Utils.getString("notification.mainAction.accessKey"),
      callback: function() {
        self.Phish.trustSite(uri);
      }
    };

    // Initialize secondary "Report Phishing Site" and "More Information"
    // actions
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

    // Initialize popup notification options
    let options = {
      timeout:     Date.now() + 5000,
      persistWhileVisible: true
    };

    // Show the popup notification
    PopupNotifications.show(browser, notificationID, message, anchorID,
                            mainAction, secondaryActions, options);

    // Ensure the focus does not change, so the user can still use the site
    // as if the notification was never shown
    aEvent.target.focus();
  },

  // Handle the popup hidden event from the AutoComplete box
  handlePopupHidden: function(aEvent) {
    let self = FormPlow;

    // Pass the event to the AutoFill object
    self._autoFillData = self.AutoFill.handlePopupHidden(aEvent);

    // If nothing was AutoFilled, or no warnings were raised, do nothing else
    if (self._autoFillData == null ||
        self._autoFillData.warnings.length == 0)
      return;

    // Create form panel warning
    let description = self._formPanel.firstChild;
    let warnings = self._autoFillData.warnings.join(" and ");
    description.textContent = self.Utils.getString("panel.message", warnings);

    // Display the warning
    self._autoFillData.field.focus();
    self._formPanel.hidden = false;
    self._formPanel.openPopup(self._autoFillData.field, "after_start", 0, 0);
  },

  // Handle the oncommand event for the button inside the AutoFill warning panel
  handleButtonCommand: function(aEvent) {
    let self = FormPlow;

    // Hide the panel
    self._formPanel.hidePopup();
    self._formPanel.hidden = true;

    // Fill in the fields that were originally not filled because of warnings
    self.AutoFill.refill(self._autoFillData);
    self._autoFillData = null;
  },

  // Get the content window's corresponding browser
  _getBrowser: function(aWindow) {
    let browsers = gBrowser.browsers;
    for (let i = 0; i < browsers.length; i++)
      if (aWindow == browsers[i].contentWindow)
        return browsers[i];

    return null;
  }
}

window.addEventListener("load", FormPlow.initialize, false);

