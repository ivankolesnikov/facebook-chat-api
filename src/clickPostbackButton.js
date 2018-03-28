"use strict";

var utils = require("../utils");
var log = require("npmlog");

module.exports = function(defaultFuncs, api, ctx) {
  return function clickPostbackButton(messageId, actionId, callback) {
    if (!messageId) {
      throw { error: "clickPostbackButton: need messageId" };
    }
    if (!actionId) {
      throw { error: "clickPostbackButton: need actionId" };
    }
    if (!callback) {
      throw { error: "clickPostbackButton: need callback" };
    }

    defaultFuncs
      .post("https://www.messenger.com/messages/commerce/postback/?cta_id=" + actionId + "&message_id=" + messageId + "&dpr=2", ctx.jar)
      .then(utils.parseAndCheckLogin(ctx, defaultFuncs))
      .then(function(resData) {
        if (resData.error) {
          throw resData;
        }
        callback(null, resData.payload);
      })
      .catch(function(err) {
        log.error("clickPostbackButton", err);
        return callback(err);
      });
  };
};
