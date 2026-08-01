"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toKstDateString = toKstDateString;
exports.isSameDay = isSameDay;
exports.isYesterday = isYesterday;
exports.todayKstDateString = todayKstDateString;
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
/** YYYY-MM-DD of `date` in KST — used to compare "same calendar day" regardless of server timezone. */
function toKstDateString(date) {
    return new Date(date.getTime() + KST_OFFSET_MS).toISOString().slice(0, 10);
}
function isSameDay(a, b) {
    return toKstDateString(a) === toKstDateString(b);
}
function isYesterday(prev, now) {
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return toKstDateString(prev) === toKstDateString(yesterday);
}
function todayKstDateString() {
    return toKstDateString(new Date());
}
//# sourceMappingURL=date.js.map