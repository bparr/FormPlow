
let EXPORTED_SYMBOLS = ["AutoFill"];

let Cc = Components.classes;
let Ci = Components.interfaces;
let Cu = Components.utils;

Cu.import("resource://formplow/Services.jsm");

let AutoFill = {
  getEntryNames: function(aField) {
    return null;
  },

  fill: function(aForm, aProfile) {
    return;
  },

  _regexes: {
    // firstname, first name, first_name, fname
    firstName: new RegExp("^(first( |_)?name|fname)$", "i"),

    // lastname, last name, last_name, lname
    lastName: new RegExp("^(last( |_)?name|lname)$", "i"),

    // middlename, middle name, middle_name, mname
    middleName: new RegExp("^(middle( |_)?name|mname)$", "i"),

    // fullname, full name, full_name
    fullName: new RegExp("^(full( |_)?name)$", "i"),

    // email
    email: new RegExp("^email$", "i"),

    // phone1, phonearea, phone area, phone_area, areacode, area code, area_code
    areaCode: new RegExp("^(phone1|phone( |_)?area|area( |_)?code)$", "i"),

    // phone2, phonefirst, phone first, phone_first, phoneprefix,
    // phone prefix, phone_prefix
    phonePrefix: new RegExp("^(phone(2|( |_)?(first|prefix)))$", "i"),

    // phone3, phonelast, phone last, phone_last, phonesuffix, phone suffix,
    // phone_suffix
    phoneSuffix: new RegExp("^(phone(3|( |_)?(last|suffix)))$", "i"),

    // phone
    fullPhone: new RegExp("^phone$", "i"),

    // street, addr1, address1
    address: new RegExp("^(street|addr1|address1)$", "i"),

    // addr2, address2
    address2: new RegExp("^(addr2|address2)$", "i"),

    // city
    city: new RegExp("^city$", "i"),

    // state
    state: new RegExp("^state$", "i"),

    // zip, postalcode, postal code, postal_code
    zip: new RegExp("^(zip|postal( |_)?code)$", "i")
  }
}

