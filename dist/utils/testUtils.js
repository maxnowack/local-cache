"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearInputs = exports.setInputs = exports.setInput = void 0;
const constants_1 = require("../constants");
// See: https://github.com/actions/toolkit/blob/master/packages/core/src/core.ts#L67
function getInputName(name) {
    return `INPUT_${name.replace(/ /g, '_').toUpperCase()}`;
}
function setInput(name, value) {
    process.env[getInputName(name)] = value;
}
exports.setInput = setInput;
function setInputs(input) {
    setInput(constants_1.Inputs.Path, input.path);
    setInput(constants_1.Inputs.Key, input.key);
    if (input.restoreKeys)
        setInput(constants_1.Inputs.RestoreKeys, input.restoreKeys.join('\n'));
    if (input.failOnCacheMiss !== undefined) {
        setInput(constants_1.Inputs.FailOnCacheMiss, input.failOnCacheMiss.toString());
    }
    if (input.lookupOnly !== undefined) {
        setInput(constants_1.Inputs.LookupOnly, input.lookupOnly.toString());
    }
}
exports.setInputs = setInputs;
function clearInputs() {
    delete process.env[getInputName(constants_1.Inputs.Path)];
    delete process.env[getInputName(constants_1.Inputs.Key)];
    delete process.env[getInputName(constants_1.Inputs.RestoreKeys)];
    delete process.env[getInputName(constants_1.Inputs.FailOnCacheMiss)];
    delete process.env[getInputName(constants_1.Inputs.LookupOnly)];
}
exports.clearInputs = clearInputs;
