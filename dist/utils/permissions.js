"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasStatsRole = hasStatsRole;
const env_1 = require("../config/env");
function hasStatsRole(member) {
    if (!member)
        return false;
    return env_1.env.statsRoleIds.some((roleId) => member.roles.cache.has(roleId));
}
//# sourceMappingURL=permissions.js.map