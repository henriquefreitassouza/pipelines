"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
var path = require("path");
var util = require("util");
var dotenv = require("dotenv");
var leads_inep_1 = require("./_data/leads_inep");
var appendFile = util.promisify(fs.appendFile);
dotenv.config();
var SPOTTER_API_KEY = (_a = process.env.SPOTTER_API_KEY) !== null && _a !== void 0 ? _a : '';
var SPOTTER_ADMIN = (_b = process.env.SPOTTER_ADMIN) !== null && _b !== void 0 ? _b : '';
var SPOTTER_API_ENDPOINT = 'https://api.exactspotter.com/v3/';
var SPOTTER_API_ENDPOINT_UPDATE_LEAD = "".concat(SPOTTER_API_ENDPOINT, "/LeadsUpdate");
function makeRequest(leadObj) {
    return __awaiter(this, void 0, void 0, function () {
        var options, response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    options = {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'token_exact': SPOTTER_API_KEY
                        },
                        body: JSON.stringify({
                            lead: {
                                customFields: [{
                                        id: '_inep',
                                        value: leadObj.inep
                                    }]
                            }
                        })
                    };
                    return [4 /*yield*/, fetch("".concat(SPOTTER_API_ENDPOINT_UPDATE_LEAD, "/").concat(leadObj.id), options)];
                case 1:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 2:
                    data = _a.sent();
                    if (!data.value) {
                        throw new Error(JSON.stringify(data));
                    }
                    return [2 /*return*/, __assign({}, leadObj)];
            }
        });
    });
}
function processLeads(leads) {
    return __awaiter(this, void 0, void 0, function () {
        var i, leadObj, newObj, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < leads.length)) return [3 /*break*/, 10];
                    leadObj = leads[i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 5, , 7]);
                    return [4 /*yield*/, makeRequest(leadObj)];
                case 3:
                    newObj = _a.sent();
                    return [4 /*yield*/, appendFile(path.join(__dirname, 'success.log.json'), JSON.stringify(newObj) + '\n')];
                case 4:
                    _a.sent();
                    console.log(newObj);
                    return [3 /*break*/, 7];
                case 5:
                    error_1 = _a.sent();
                    return [4 /*yield*/, appendFile(path.join(__dirname, 'error.log.json'), JSON.stringify(leads[i]) + '\n')];
                case 6:
                    _a.sent();
                    console.error("Error processing lead ".concat(leadObj.id, ": ").concat(error_1));
                    return [3 /*break*/, 7];
                case 7: return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1600); })];
                case 8:
                    _a.sent();
                    _a.label = 9;
                case 9:
                    i++;
                    return [3 /*break*/, 1];
                case 10: return [2 /*return*/];
            }
        });
    });
}
processLeads(leads_inep_1.leads).catch(console.error);
