
let EXPORTED_SYMBOLS = ["AutoFill"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

Cu.import("resource://formplow/Phish.jsm");
Cu.import("resource://formplow/Services.jsm");
Cu.import("resource://formplow/Utils.jsm");

let Constructor = Components.Constructor;
let nsLoginInfo = new Constructor("@mozilla.org/login-manager/loginInfo;1",
                                  Ci.nsILoginInfo,
                                  "init");

const kProfileNamesPref = "extensions.formplow.profileNames";
const kProfileHost      = "chrome://formplow";
const kProfileRealm     = "FormPlow Profile";

let AutoFill = {
  // The current field the AutoComplete box is attatched to
  _currentField: null,
  get currentField() {
    return this._currentField;
  },

  // Array of user profiles
  // Note: the information in these profiles is stored in the Login Manager
  // alongside passwords. So, it is encrypted if the user has a Master Password.
  get _profiles() {
    let profiles = this._getStoredProfiles();
    if (profiles == null) {
      profiles = this._defaultProfiles;

      // Store the profiles and corresponding profile names
      let profileNames = profiles.map(function(aProfile) aProfile.profileName);
      this._storeProfileNames(profileNames);
      this._storeProfiles(profiles);
    }

    delete this._profiles;
    this._profiles = profiles;
    return profiles;
  },

  // Array of profile names that are displayed in the AutoComplete box
  // Note: these names are not stored in an encrypted form
  get _profileNames() {
    let profileNames = this._getStoredProfileNames();
    if (profileNames == null) {
      let profiles = this._defaultProfiles;
      profileNames = profiles.map(function(aProfile) aProfile.profileName);

      // Store the profile names
      this._storeProfileNames(profileNames);
    }

    delete this._profileNames;
    this._profileNames = profileNames;
    return profileNames;
  },

  // Get array of profile names to show in AutoComplete box
  getEntryNames: function(aField) {
    // Only AutoFill on trusted sites
    let uri = Phish.getURIFromElement(aField);
    if (!Phish.isSiteTrusted(uri))
      return null;

    this._currentField = aField;
    return this._profileNames;
  },

  // Handle when the AutoComplete box is closed (i.e. the user has finished
  // autocompleting)
  handlePopupHidden: function(aEvent) {
    let popup = aEvent.target;
    let textValue = popup.input.textValue;

    let field = this._currentField;
    this._currentField = null;

    // Do nothing if an AutoFill entry was not selected
    if (this._profileNames.indexOf(textValue) < 0)
      return null;

    let profiles = this._profiles;
    let profile = null;

    // Find corresponding AutoFill profile
    for (let i = 0; i < this._profiles.length; i++) {
      if (textValue == this._profiles[i].profileName) {
        profile = this._profiles[i];
        break;
      }
    }

    if (profile == null)
      return null;

    let rv = {
      profile:  profile,
      field:    field,
      warnings: null
    };

    if (field.form != null) {
      // If the field is part of a form, AutoFill entire form
      let typesUsed = this.fill(field.form, profile);
      rv.warnings = profile.warnings.filter(function(aType) !!typesUsed[aType]);
    }
    else {
      // Only AutoFill the field if it is not part of a form
      let type = this.fillField(field, profile);
      rv.warnings = (type != null) ? [type] : [];
    }

    return rv;
  },

  // Re-AutoFill, ignoring the warnings
  // Note: this is called after a user confirms the warnings should be ignored
  refill: function(aData) {
    if (aData.field.form != null)
      this.fill(aData.field.form, aData.profile, aData.warnings);
    else
      this.fillField(aData.field, aData.profile, aData.warnings);
  },

  // Fill entire form
  fill: function(aForm, aProfile, aIgnoredWarnings) {
    let typesUsed = {};
    for (let i = 0; i < aForm.elements.length; i++) {
      let element = aForm.elements.item(i);
      let type = this.fillField(element, aProfile, aIgnoredWarnings);
      if (type != null)
        typesUsed[type] = true;
    }

    return typesUsed;
  },

  // Fill a field unless the user has set warning flag for the given field type
  fillField: function(aInput, aProfile, aIgnoredWarnings) {
    // Ignore field if not a text input, or has no name attribute
    if (aInput.tagName.toLowerCase() != "input" ||
        aInput.type != "text" ||
        !aInput.name)
      return null;

    // Match field name to a profile property
    let name = aInput.name;
    for (let propertyName in this._profileProperties) {
      let profileProperty = this._profileProperties[propertyName];
      if (!profileProperty.regex.test(name))
        continue;

      // Found match
      let type = profileProperty.type;

      // Don't fill in field if the user wants a warning before filling
      if (aProfile.warnings.indexOf(type) < 0 ||
          (aIgnoredWarnings && aIgnoredWarnings.indexOf(type) >= 0))
        aInput.value = aProfile[propertyName];

      return type;
    }

    return null
  },

  // Get array of stored profiles from the Login Manager
  _getStoredProfiles: function() {
    let logins = Services.login.findLogins({}, kProfileHost,
                                           null, kProfileRealm);
    if (logins.length == 0)
      return null;

    return logins.map(function(aLogin) JSON.parse(aLogin.password));
  },

  // Add a profile to the Login Manager
  _storeProfiles: function(aProfiles) {
    aProfiles.forEach(function(aProfile) {
      let username = aProfile.profileName;
      let password = JSON.stringify(aProfile);

      let loginInfo = new nsLoginInfo(kProfileHost, null, kProfileRealm,
                                      username, password, "", "");
      Services.login.addLogin(loginInfo);
    });
  },

  // Get the stored profile names from the preference
  _getStoredProfileNames: function() {
    let profileNames = null;

    // Attempt to parse profile names from preference
    try {
      let prefValue = Services.prefs.getCharPref(kProfileNamesPref);
      if (prefValue)
        profileNames = JSON.parse(prefValue);
    }
    catch(e) {}

    return profileNames;
  },

  // Store array of profile names in the preference
  _storeProfileNames: function(aProfileNames) {
    let prefValue = JSON.stringify(aProfileNames);
    Services.prefs.setCharPref(kProfileNamesPref, prefValue);
  },

  // Descriptions of the set of profile properties
  _profileProperties: {
    firstName: {
      type: "name",

      // firstname, first name, first_name, fname
      regex: new RegExp("^(first( |_)?name|fname)$", "i")
    },

    lastName: {
      type: "name",

      // lastname, last name, last_name, lname
      regex: new RegExp("^(last( |_)?name|lname)$", "i")
    },

    middleName: {
      type: "name",

      // middlename, middle name, middle_name, mname
      regex: new RegExp("^(middle( |_)?name|mname)$", "i")
    },

    fullName: {
      type: "name",

      // fullname, full name, full_name
      regex: new RegExp("^(full( |_)?name)$", "i")
    },

    email: {
      type: "email",

      // email
      regex: new RegExp("^email$", "i")
    },

    areaCode: {
      type: "phone",

      // phone1, phonearea, phone area, phone_area,
      // areacode, area code, area_code
      regex: new RegExp("^(phone1|phone( |_)?area|area( |_)?code)$", "i"),
    },

    phonePrefix: {
      type: "phone",

      // phone2, phonefirst, phone first, phone_first, phoneprefix,
      // phone prefix, phone_prefix
      regex: new RegExp("^(phone(2|( |_)?(first|prefix)))$", "i")
    },

    phoneSuffix: {
      type: "phone",

      // phone3, phonelast, phone last, phone_last, phonesuffix, phone suffix,
      // phone_suffix
      regex: new RegExp("^(phone(3|( |_)?(last|suffix)))$", "i")
    },

    fullPhone: {
      type: "phone",

      // phone
      regex: new RegExp("^phone$", "i")
    },

    address: {
      type: "address",

      // street, addr1, address1
      regex: new RegExp("^(street|addr1|address1)$", "i")
    },

    address2: {
      type: "address",

      // addr2, address2
      regex: new RegExp("^(addr2|address2)$", "i")
    },

    city: {
      type: "address",

      // city
      regex: new RegExp("^city$", "i")
    },

    state: {
      type: "address",

      // state
      regex: new RegExp("^state$", "i")
    },

    zip: {
      type: "address",

      // zip, postalcode, postal code, postal_code
      regex: new RegExp("^(zip|postal( |_)?code)$", "i")
    }
  },

  // Hardcoded set of default profiles (for sake of prototype)
  _defaultProfiles: [{
    firstName:   "Bob",
    lastName:    "Smith",
    middleName:  "Thomas",
    fullName:    "Bob Thomas Smith",
    email:       "bob@smith.com",
    areaCode:    "412",
    phonePrefix: "291",
    phoneSuffix: "1938",
    fullPhone:   "4122911938",
    address:     "Carnegie Mellon University",
    address2:    "5032 Forbes Avenue",
    city:        "Pittsburgh",
    state:       "Pennsylvania",
    zip:         "15213",

    profileName: "Bob Smith - bob@smith.com",
    warnings:    [ "address", "phone" ]
  }, {
    firstName:   "Robert",
    lastName:    "Smith",
    middleName:  "Thomas",
    fullName:    "Robert Thomas Smith",
    email:       "rsmith@work.com",
    areaCode:    "412",
    phonePrefix: "142",
    phoneSuffix: "4461",
    fullPhone:   "4121424461",
    address:     "5032 Forbes Avenue",
    address2:    "SMC 1888",
    city:        "Pittsburgh",
    state:       "Pennsylvania",
    zip:         "15213",

    profileName: "Robert Smith - rsmith@work.com",
    warnings:    []
  }]
}

