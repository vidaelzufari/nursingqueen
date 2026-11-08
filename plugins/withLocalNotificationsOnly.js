const { withEntitlementsPlist } = require("expo/config-plugins");

// Local scheduled reminders need no APNs entitlement. Register before the notifications
// plugin (SDK 51 executes registered mod actions in reverse order) so installing expo-notifications cannot invalidate existing signing.
module.exports = function withLocalNotificationsOnly(config) {
  return withEntitlementsPlist(config, config => {
    delete config.modResults["aps-environment"];
    return config;
  });
};
