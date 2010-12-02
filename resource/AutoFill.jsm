
let EXPORTED_SYMBOLS = ["AutoFill"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

Cu.import("resource://formplow/Services.jsm");

let gProfiles = [{
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

  warnings:    [],
}];

let gEntryNames = [
  "Bob Smith - bob@smith.com",
  "Robert Smith - rsmith@work.com"
]



let AutoFill = {
  _currentField: null,
  get currentField() {
    return this._currentField;
  },

  getEntryNames: function(aField) {
    this._currentField = aField;
    return gEntryNames;
  },

  handlePopupHiding: function(aEvent) {
    let popup = aEvent.target;
    let textValue = popup.input.textValue;

    let index = gEntryNames.indexOf(textValue);
    if (index < 0)
      return null;

    let profile = gProfiles[index];
    let field = this._currentField;
    this._currentField = null;

    let ret = {
      profile:  profile,
      field:    field,
      warnings: null
    };

    if (field.form != null) {
      let typesUsed = this.fill(field.form, profile);
      ret.warnings = profile.warnings.filter(function(aType) !!typesUsed[aType]);
    }
    else {
      let type = this.fillField(field, profile);
      ret.warnings = (type != null) ? [type] : [];
    }

    return ret;
  },

  refill: function(aData) {
    if (aData.field.form != null)
      this.fill(aData.field.form, aData.profile, aData.warnings);
    else
      this.fillField(aData.field, aData.profile, aData.warnings);
  },

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

  fillField: function(aInput, aProfile, aIgnoredWarnings) {
    if (aInput.tagName.toLowerCase() != "input" ||
        aInput.type != "text" ||
        !aInput.name)
      return null;

    let name = aInput.name;
    for (let propertyName in this._profileProperties) {
      let profileProperty = this._profileProperties[propertyName];
      if (!profileProperty.regex.test(name))
        continue;

      // Found match
      let type = profileProperty.type;
      if (aProfile.warnings.indexOf(type) < 0 ||
          (aIgnoredWarnings && aIgnoredWarnings.indexOf(type) >= 0))
        aInput.value = aProfile[propertyName];

      return type;
    }

    return null
  },

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
  }
}

