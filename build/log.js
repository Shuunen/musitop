'use strict';
exports.__esModule = true;
var Pino = require("pino");
var pino = Pino({
    prettyPrint: true
});
var Log = /** @class */ (function () {
    function Log() {
    }
    Log.info = function (thing) {
        pino.info(thing);
    };
    return Log;
}());
exports.Log = Log;
