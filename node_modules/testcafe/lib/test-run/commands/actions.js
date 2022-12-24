"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RemoveRequestHooksCommand = exports.AddRequestHooksCommand = exports.SkipJsErrorsCommand = exports.GetProxyUrlCommand = exports.RequestCommand = exports.DeleteCookiesCommand = exports.SetCookiesCommand = exports.GetCookiesCommand = exports.RecorderCommand = exports.CloseChildWindowOnFileDownloading = exports.UseRoleCommand = exports.SetPageLoadTimeoutCommand = exports.SetTestSpeedCommand = exports.GetBrowserConsoleMessagesCommand = exports.GetNativeDialogHistoryCommand = exports.SetNativeDialogHandlerCommand = exports.SwitchToPreviousWindowCommand = exports.SwitchToParentWindowCommand = exports.SwitchToWindowByPredicateCommand = exports.SwitchToWindowCommand = exports.GetCurrentWindowsCommand = exports.GetCurrentWindowCommand = exports.CloseWindowCommand = exports.OpenWindowCommand = exports.SwitchToMainWindowCommand = exports.SwitchToIframeCommand = exports.ClearUploadCommand = exports.SetFilesToUploadCommand = exports.NavigateToCommand = exports.PressKeyCommand = exports.SelectTextAreaContentCommand = exports.SelectEditableContentCommand = exports.SelectTextCommand = exports.ScrollIntoViewCommand = exports.ScrollByCommand = exports.ScrollCommand = exports.DragToElementCommand = exports.DragCommand = exports.TypeTextCommand = exports.HoverCommand = exports.DoubleClickCommand = exports.ExecuteAsyncExpressionCommand = exports.ExecuteExpressionCommand = exports.RightClickCommand = exports.ClickCommand = exports.DispatchEventCommand = void 0;
const type_1 = __importDefault(require("./type"));
const selector_builder_1 = __importDefault(require("../../client-functions/selectors/selector-builder"));
const client_function_builder_1 = __importDefault(require("../../client-functions/client-function-builder"));
const builder_symbol_1 = __importDefault(require("../../client-functions/builder-symbol"));
const base_1 = require("./base");
const options_1 = require("./options");
const initializers_1 = require("./validations/initializers");
const execute_js_expression_1 = require("../execute-js-expression");
const utils_1 = require("./utils");
const argument_1 = require("./validations/argument");
const test_run_1 = require("../../errors/test-run");
const observation_1 = require("./observation");
const lodash_1 = require("lodash");
const skip_js_errors_1 = require("../../api/skip-js-errors");
// Initializers
function initActionOptions(name, val, initOptions, validate = true) {
    return new options_1.ActionOptions(val, validate);
}
function initClickOptions(name, val, initOptions, validate = true) {
    return new options_1.ClickOptions(val, validate);
}
function initMouseOptions(name, val, initOptions, validate = true) {
    return new options_1.MouseOptions(val, validate);
}
function initOffsetOptions(name, val, initOptions, validate = true) {
    return new options_1.OffsetOptions(val, validate);
}
function initTypeOptions(name, val, initOptions, validate = true) {
    return new options_1.TypeOptions(val, validate);
}
function initDragToElementOptions(name, val, initOptions, validate = true) {
    return new options_1.DragToElementOptions(val, validate);
}
function initPressOptions(name, val, initOptions, validate = true) {
    return new options_1.PressOptions(val, validate);
}
function initDialogHandler(name, val, { skipVisibilityCheck, testRun }) {
    let fn;
    if ((0, utils_1.isJSExpression)(val))
        fn = (0, execute_js_expression_1.executeJsExpression)(val.value, testRun, { skipVisibilityCheck });
    else
        fn = val.fn;
    if (fn === null || fn instanceof observation_1.ExecuteClientFunctionCommand)
        return fn;
    const options = val.options;
    const methodName = 'setNativeDialogHandler';
    const functionType = typeof fn;
    let builder = fn && fn[builder_symbol_1.default];
    const isSelector = builder instanceof selector_builder_1.default;
    const isClientFunction = builder instanceof client_function_builder_1.default;
    if (functionType !== 'function' || isSelector)
        throw new test_run_1.SetNativeDialogHandlerCodeWrongTypeError(isSelector ? 'Selector' : functionType);
    if (isClientFunction)
        builder = fn.with(options)[builder_symbol_1.default];
    else
        builder = new client_function_builder_1.default(fn, options, { instantiation: methodName, execution: methodName });
    return builder.getCommand();
}
function initCookiesOption(name, val, initOptions, validate = true) {
    return val.map(cookie => new options_1.CookieOptions(cookie, validate));
}
function initRequestOption(name, val, initOptions, validate = true) {
    return new options_1.RequestOptions(val, validate);
}
function initGetProxyUrlOptions(name, val, initOptions, validate = true) {
    return new options_1.GetProxyUrlOptions(val, validate);
}
function initSkipJsErrorsOptions(name, val, initOptions, validate = true) {
    if (val === void 0)
        return true;
    if ((0, skip_js_errors_1.isSkipJsErrorsCallbackWithOptionsObject)(val))
        val = new options_1.SkipJsErrorsCallbackWithOptions(val, validate);
    else if ((0, skip_js_errors_1.isSkipJsErrorsOptionsObject)(val))
        val = new options_1.SkipJsErrorsOptions(val, validate);
    return (0, skip_js_errors_1.prepareSkipJsErrorsOptions)(val);
}
// Commands
class DispatchEventCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.dispatchEvent, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'eventName', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'options', type: argument_1.actionOptions },
            { name: 'relatedTarget', init: initializers_1.initSelector, required: false },
        ];
    }
}
exports.DispatchEventCommand = DispatchEventCommand;
DispatchEventCommand.methodName = (0, lodash_1.camelCase)(type_1.default.dispatchEvent);
class ClickCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.click, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initClickOptions, required: true },
        ];
    }
}
exports.ClickCommand = ClickCommand;
ClickCommand.methodName = (0, lodash_1.camelCase)(type_1.default.click);
class RightClickCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.rightClick, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initClickOptions, required: true },
        ];
    }
}
exports.RightClickCommand = RightClickCommand;
RightClickCommand.methodName = (0, lodash_1.camelCase)(type_1.default.rightClick);
class ExecuteExpressionCommand extends base_1.CommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.executeExpression, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'expression', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'resultVariableName', type: argument_1.nonEmptyStringArgument, defaultValue: null },
        ];
    }
}
exports.ExecuteExpressionCommand = ExecuteExpressionCommand;
class ExecuteAsyncExpressionCommand extends base_1.CommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.executeAsyncExpression, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'expression', type: argument_1.stringArgument, required: true },
        ];
    }
}
exports.ExecuteAsyncExpressionCommand = ExecuteAsyncExpressionCommand;
class DoubleClickCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.doubleClick, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initClickOptions, required: true },
        ];
    }
}
exports.DoubleClickCommand = DoubleClickCommand;
DoubleClickCommand.methodName = (0, lodash_1.camelCase)(type_1.default.doubleClick);
class HoverCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.hover, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initMouseOptions, required: true },
        ];
    }
}
exports.HoverCommand = HoverCommand;
HoverCommand.methodName = (0, lodash_1.camelCase)(type_1.default.hover);
class TypeTextCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.typeText, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initTypeSelector, required: true },
            { name: 'text', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initTypeOptions, required: true },
        ];
    }
}
exports.TypeTextCommand = TypeTextCommand;
TypeTextCommand.methodName = (0, lodash_1.camelCase)(type_1.default.typeText);
class DragCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.drag, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'dragOffsetX', type: argument_1.integerArgument, required: true },
            { name: 'dragOffsetY', type: argument_1.integerArgument, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initMouseOptions, required: true },
        ];
    }
}
exports.DragCommand = DragCommand;
DragCommand.methodName = (0, lodash_1.camelCase)(type_1.default.drag);
class DragToElementCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.dragToElement, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'destinationSelector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initDragToElementOptions, required: true },
        ];
    }
}
exports.DragToElementCommand = DragToElementCommand;
DragToElementCommand.methodName = (0, lodash_1.camelCase)(type_1.default.dragToElement);
class ScrollCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.scroll, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: false },
            { name: 'position', type: argument_1.nullableStringArgument, required: false },
            { name: 'x', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'y', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'options', type: argument_1.actionOptions, init: initOffsetOptions, required: true },
        ];
    }
}
exports.ScrollCommand = ScrollCommand;
ScrollCommand.methodName = (0, lodash_1.camelCase)(type_1.default.scroll);
class ScrollByCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.scrollBy, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: false },
            { name: 'byX', type: argument_1.integerArgument, defaultValue: 0 },
            { name: 'byY', type: argument_1.integerArgument, defaultValue: 0 },
            { name: 'options', type: argument_1.actionOptions, init: initOffsetOptions, required: true },
        ];
    }
}
exports.ScrollByCommand = ScrollByCommand;
ScrollByCommand.methodName = (0, lodash_1.camelCase)(type_1.default.scrollBy);
class ScrollIntoViewCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.scrollIntoView, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initOffsetOptions, required: true },
        ];
    }
}
exports.ScrollIntoViewCommand = ScrollIntoViewCommand;
ScrollIntoViewCommand.methodName = (0, lodash_1.camelCase)(type_1.default.scrollIntoView);
class SelectTextCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.selectText, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'startPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'endPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'options', type: argument_1.actionOptions, init: initActionOptions, required: true },
        ];
    }
}
exports.SelectTextCommand = SelectTextCommand;
SelectTextCommand.methodName = (0, lodash_1.camelCase)(type_1.default.selectText);
class SelectEditableContentCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.selectEditableContent, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'startSelector', init: initializers_1.initSelector, required: true },
            { name: 'endSelector', init: initializers_1.initSelector, defaultValue: null },
            { name: 'options', type: argument_1.actionOptions, init: initActionOptions, required: true },
        ];
    }
}
exports.SelectEditableContentCommand = SelectEditableContentCommand;
SelectEditableContentCommand.methodName = (0, lodash_1.camelCase)(type_1.default.selectEditableContent);
class SelectTextAreaContentCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.selectTextAreaContent, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
            { name: 'startLine', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'startPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'endLine', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'endPos', type: argument_1.positiveIntegerArgument, defaultValue: null },
            { name: 'options', type: argument_1.actionOptions, init: initActionOptions, required: true },
        ];
    }
}
exports.SelectTextAreaContentCommand = SelectTextAreaContentCommand;
SelectTextAreaContentCommand.methodName = (0, lodash_1.camelCase)(type_1.default.selectTextAreaContent);
class PressKeyCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.pressKey, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'keys', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'options', type: argument_1.actionOptions, init: initPressOptions, required: true },
        ];
    }
}
exports.PressKeyCommand = PressKeyCommand;
PressKeyCommand.methodName = (0, lodash_1.camelCase)(type_1.default.pressKey);
class NavigateToCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.navigateTo, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'url', type: argument_1.pageUrlArgument, required: true },
            { name: 'stateSnapshot', type: argument_1.nullableStringArgument, defaultValue: null },
            { name: 'forceReload', type: argument_1.booleanArgument, defaultValue: false },
        ];
    }
}
exports.NavigateToCommand = NavigateToCommand;
NavigateToCommand.methodName = (0, lodash_1.camelCase)(type_1.default.navigateTo);
class SetFilesToUploadCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.setFilesToUpload, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initUploadSelector, required: true },
            { name: 'filePath', type: argument_1.stringOrStringArrayArgument, required: true },
        ];
    }
}
exports.SetFilesToUploadCommand = SetFilesToUploadCommand;
SetFilesToUploadCommand.methodName = (0, lodash_1.camelCase)(type_1.default.setFilesToUpload);
class ClearUploadCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.clearUpload, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initUploadSelector, required: true },
        ];
    }
}
exports.ClearUploadCommand = ClearUploadCommand;
ClearUploadCommand.methodName = (0, lodash_1.camelCase)(type_1.default.clearUpload);
class SwitchToIframeCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.switchToIframe, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'selector', init: initializers_1.initSelector, required: true },
        ];
    }
}
exports.SwitchToIframeCommand = SwitchToIframeCommand;
SwitchToIframeCommand.methodName = (0, lodash_1.camelCase)(type_1.default.switchToIframe);
class SwitchToMainWindowCommand extends base_1.ActionCommandBase {
    constructor() {
        super();
        this.type = type_1.default.switchToMainWindow;
    }
}
exports.SwitchToMainWindowCommand = SwitchToMainWindowCommand;
SwitchToMainWindowCommand.methodName = (0, lodash_1.camelCase)(type_1.default.switchToMainWindow);
class OpenWindowCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.openWindow, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'url', type: argument_1.pageUrlArgument },
        ];
    }
}
exports.OpenWindowCommand = OpenWindowCommand;
OpenWindowCommand.methodName = (0, lodash_1.camelCase)(type_1.default.openWindow);
class CloseWindowCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.closeWindow, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'windowId', type: argument_1.nullableStringArgument, required: true },
        ];
    }
}
exports.CloseWindowCommand = CloseWindowCommand;
CloseWindowCommand.methodName = (0, lodash_1.camelCase)(type_1.default.closeWindow);
class GetCurrentWindowCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.getCurrentWindow, validateProperties);
    }
}
exports.GetCurrentWindowCommand = GetCurrentWindowCommand;
GetCurrentWindowCommand.methodName = (0, lodash_1.camelCase)(type_1.default.getCurrentWindow);
class GetCurrentWindowsCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.getCurrentWindows, validateProperties);
    }
}
exports.GetCurrentWindowsCommand = GetCurrentWindowsCommand;
GetCurrentWindowsCommand.methodName = (0, lodash_1.camelCase)(type_1.default.getCurrentWindows);
class SwitchToWindowCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.switchToWindow, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'windowId', type: argument_1.nonEmptyStringArgument, required: true },
        ];
    }
}
exports.SwitchToWindowCommand = SwitchToWindowCommand;
SwitchToWindowCommand.methodName = (0, lodash_1.camelCase)(type_1.default.switchToWindow);
class SwitchToWindowByPredicateCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.switchToWindowByPredicate, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'id', type: argument_1.nonEmptyStringArgument, required: false },
            { name: 'checkWindow', type: argument_1.functionArgument, required: true },
        ];
    }
}
exports.SwitchToWindowByPredicateCommand = SwitchToWindowByPredicateCommand;
SwitchToWindowByPredicateCommand.methodName = (0, lodash_1.camelCase)(type_1.default.switchToWindow);
class SwitchToParentWindowCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.switchToParentWindow, validateProperties);
    }
}
exports.SwitchToParentWindowCommand = SwitchToParentWindowCommand;
SwitchToParentWindowCommand.methodName = (0, lodash_1.camelCase)(type_1.default.switchToParentWindow);
class SwitchToPreviousWindowCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.switchToPreviousWindow, validateProperties);
    }
}
exports.SwitchToPreviousWindowCommand = SwitchToPreviousWindowCommand;
SwitchToPreviousWindowCommand.methodName = (0, lodash_1.camelCase)(type_1.default.switchToPreviousWindow);
class SetNativeDialogHandlerCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.setNativeDialogHandler, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'dialogHandler', init: initDialogHandler, required: true },
        ];
    }
    static from(val) {
        const dialogHandlerStub = {
            dialogHandler: { fn: null },
        };
        const command = new SetNativeDialogHandlerCommand(dialogHandlerStub);
        command.dialogHandler = val.dialogHandler;
        return command;
    }
}
exports.SetNativeDialogHandlerCommand = SetNativeDialogHandlerCommand;
SetNativeDialogHandlerCommand.methodName = (0, lodash_1.camelCase)(type_1.default.setNativeDialogHandler);
class GetNativeDialogHistoryCommand extends base_1.ActionCommandBase {
    constructor() {
        super();
        this.type = type_1.default.getNativeDialogHistory;
    }
}
exports.GetNativeDialogHistoryCommand = GetNativeDialogHistoryCommand;
GetNativeDialogHistoryCommand.methodName = (0, lodash_1.camelCase)(type_1.default.getNativeDialogHistory);
class GetBrowserConsoleMessagesCommand extends base_1.ActionCommandBase {
    constructor() {
        super();
        this.type = type_1.default.getBrowserConsoleMessages;
    }
}
exports.GetBrowserConsoleMessagesCommand = GetBrowserConsoleMessagesCommand;
GetBrowserConsoleMessagesCommand.methodName = (0, lodash_1.camelCase)(type_1.default.getBrowserConsoleMessages);
class SetTestSpeedCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.setTestSpeed, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'speed', type: argument_1.setSpeedArgument, required: true },
        ];
    }
}
exports.SetTestSpeedCommand = SetTestSpeedCommand;
SetTestSpeedCommand.methodName = (0, lodash_1.camelCase)(type_1.default.setTestSpeed);
class SetPageLoadTimeoutCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.setPageLoadTimeout, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'duration', type: argument_1.positiveIntegerArgument, required: true },
        ];
    }
}
exports.SetPageLoadTimeoutCommand = SetPageLoadTimeoutCommand;
SetPageLoadTimeoutCommand.methodName = (0, lodash_1.camelCase)(type_1.default.setPageLoadTimeout);
class UseRoleCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.useRole, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'role', type: argument_1.actionRoleArgument, required: true },
        ];
    }
}
exports.UseRoleCommand = UseRoleCommand;
UseRoleCommand.methodName = (0, lodash_1.camelCase)(type_1.default.useRole);
class CloseChildWindowOnFileDownloading extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.closeChildWindowOnFileDownloading, validateProperties);
    }
}
exports.CloseChildWindowOnFileDownloading = CloseChildWindowOnFileDownloading;
CloseChildWindowOnFileDownloading.methodName = (0, lodash_1.camelCase)(type_1.default.closeChildWindowOnFileDownloading);
class RecorderCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun) {
        super(obj, testRun, type_1.default.recorder);
    }
    getAssignableProperties() {
        return [
            { name: 'subtype', type: argument_1.nonEmptyStringArgument, required: true },
            { name: 'forceExecutionInTopWindowOnly', type: argument_1.booleanArgument, defaultValue: false },
        ];
    }
}
exports.RecorderCommand = RecorderCommand;
RecorderCommand.methodName = (0, lodash_1.camelCase)(type_1.default.recorder);
class GetCookiesCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.getCookies, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'urls', type: argument_1.urlsArgument, required: false },
            { name: 'cookies', type: argument_1.cookiesArgument, init: initCookiesOption, required: false },
        ];
    }
}
exports.GetCookiesCommand = GetCookiesCommand;
GetCookiesCommand.methodName = (0, lodash_1.camelCase)(type_1.default.getCookies);
class SetCookiesCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.setCookies, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'url', type: argument_1.urlsArgument, required: false },
            { name: 'cookies', type: argument_1.setCookiesArgument, init: initCookiesOption, required: true },
        ];
    }
}
exports.SetCookiesCommand = SetCookiesCommand;
SetCookiesCommand.methodName = (0, lodash_1.camelCase)(type_1.default.setCookies);
class DeleteCookiesCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.deleteCookies, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'urls', type: argument_1.urlsArgument, required: false },
            { name: 'cookies', type: argument_1.cookiesArgument, init: initCookiesOption, required: false },
        ];
    }
}
exports.DeleteCookiesCommand = DeleteCookiesCommand;
DeleteCookiesCommand.methodName = (0, lodash_1.camelCase)(type_1.default.deleteCookies);
class RequestCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.request, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'url', type: argument_1.urlArgument, required: false },
            { name: 'options', type: argument_1.actionOptions, init: initRequestOption, required: false },
        ];
    }
}
exports.RequestCommand = RequestCommand;
RequestCommand.methodName = (0, lodash_1.camelCase)(type_1.default.request);
RequestCommand.extendedMethods = ['get', 'post', 'delete', 'put', 'patch', 'head'];
RequestCommand.resultGetters = ['status', 'statusText', 'headers', 'body'];
class GetProxyUrlCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.getProxyUrl, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'url', type: argument_1.urlArgument, required: true },
            { name: 'options', init: initGetProxyUrlOptions, required: false },
        ];
    }
}
exports.GetProxyUrlCommand = GetProxyUrlCommand;
GetProxyUrlCommand.methodName = (0, lodash_1.camelCase)(type_1.default.getProxyUrl);
class SkipJsErrorsCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.skipJsErrors, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'options', type: argument_1.skipJsErrorOptions, init: initSkipJsErrorsOptions, required: false },
        ];
    }
}
exports.SkipJsErrorsCommand = SkipJsErrorsCommand;
SkipJsErrorsCommand.methodName = (0, lodash_1.camelCase)(type_1.default.skipJsErrors);
class AddRequestHooksCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.addRequestHooks, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'hooks', type: argument_1.requestHooksArgument, required: true },
        ];
    }
}
exports.AddRequestHooksCommand = AddRequestHooksCommand;
AddRequestHooksCommand.methodName = (0, lodash_1.camelCase)(type_1.default.addRequestHooks);
class RemoveRequestHooksCommand extends base_1.ActionCommandBase {
    constructor(obj, testRun, validateProperties) {
        super(obj, testRun, type_1.default.removeRequestHooks, validateProperties);
    }
    getAssignableProperties() {
        return [
            { name: 'hooks', type: argument_1.requestHooksArgument, required: true },
        ];
    }
}
exports.RemoveRequestHooksCommand = RemoveRequestHooksCommand;
RemoveRequestHooksCommand.methodName = (0, lodash_1.camelCase)(type_1.default.removeRequestHooks);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYWN0aW9ucy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy90ZXN0LXJ1bi9jb21tYW5kcy9hY3Rpb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGtEQUEwQjtBQUMxQix5R0FBZ0Y7QUFDaEYsNkdBQW1GO0FBQ25GLDJGQUEwRTtBQUMxRSxpQ0FBd0Q7QUFDeEQsdUNBYW1CO0FBRW5CLDZEQUlvQztBQUNwQyxvRUFBK0Q7QUFDL0QsbUNBQXlDO0FBRXpDLHFEQW1CZ0M7QUFFaEMsb0RBQWlGO0FBQ2pGLCtDQUE2RDtBQUM3RCxtQ0FBbUM7QUFDbkMsNkRBSWtDO0FBR2xDLGVBQWU7QUFDZixTQUFTLGlCQUFpQixDQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsR0FBRyxJQUFJO0lBQy9ELE9BQU8sSUFBSSx1QkFBYSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxnQkFBZ0IsQ0FBRSxJQUFJLEVBQUUsR0FBRyxFQUFFLFdBQVcsRUFBRSxRQUFRLEdBQUcsSUFBSTtJQUM5RCxPQUFPLElBQUksc0JBQVksQ0FBQyxHQUFHLEVBQUUsUUFBUSxDQUFDLENBQUM7QUFDM0MsQ0FBQztBQUVELFNBQVMsZ0JBQWdCLENBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsUUFBUSxHQUFHLElBQUk7SUFDOUQsT0FBTyxJQUFJLHNCQUFZLENBQUMsR0FBRyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0FBQzNDLENBQUM7QUFFRCxTQUFTLGlCQUFpQixDQUFFLElBQUksRUFBRSxHQUFHLEVBQUUsV0FBVyxFQUFFLFFBQVEsR0FBRyxJQUFJO0lBQy9ELE9BQU8sSUFBSSx1QkFBYSxDQUFDLEdBQUcsRUFBRSxRQUFRLENBQUMsQ0FBQztBQUM1QyxDQUFDO0FBRUQsU0FBUyxlQUFlLENBQUUsSUFBSSxFQUFFLEdBQUcsRUFBRSxXQUFXLEVBQUUsUUFB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QUMsR0FBRyxFQUFFLE9BQU8sRUFBRSxjQUFJLENBQUMsZUFBZSxFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDbEUsQ0FBQztJQUVELHVCQUF1QjtRQUNuQixPQUFPO1lBQ0gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSwrQkFBb0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO1NBQ2hFLENBQUM7SUFDTixDQUFDOztBQVhMLHdEQVlDO0FBWFUsaUNBQVUsR0FBRyxJQUFBLGtCQUFTLEVBQUMsY0FBSSxDQUFDLGVBQWUsQ0FBQyxDQUFDO0FBYXhELE1BQWEseUJBQTBCLFNBQVEsd0JBQWlCO0lBRzVELFlBQWEsR0FBRyxFQUFFLE9BQU8sRUFBRSxrQkFBa0I7UUFDekMsS0FBSyxDQUFDLEdBQUcsRUFBRSxPQUFPLEVBQUUsY0FBSSxDQUFDLGtCQUFrQixFQUFFLGtCQUFrQixDQUFDLENBQUM7SUFDckUsQ0FBQztJQUVELHVCQUF1QjtRQUNuQixPQUFPO1lBQ0gsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLElBQUksRUFBRSwrQkFBb0IsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFO1NBQ2hFLENBQUM7SUFDTixDQUFDOztBQVhMLDhEQVlDO0FBWFUsb0NBQVUsR0FBRyxJQUFBLGtCQUFTLEVBQUMsY0FBSSxDQUFDLGtCQUFrQixDQUFDLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgVFlQRSBmcm9tICcuL3R5cGUnO1xuaW1wb3J0IFNlbGVjdG9yQnVpbGRlciBmcm9tICcuLi8uLi9jbGllbnQtZnVuY3Rpb25zL3NlbGVjdG9ycy9zZWxlY3Rvci1idWlsZGVyJztcbmltcG9ydCBDbGllbnRGdW5jdGlvbkJ1aWxkZXIgZnJvbSAnLi4vLi4vY2xpZW50LWZ1bmN0aW9ucy9jbGllbnQtZnVuY3Rpb24tYnVpbGRlcic7XG5pbXBvcnQgZnVuY3Rpb25CdWlsZGVyU3ltYm9sIGZyb20gJy4uLy4uL2NsaWVudC1mdW5jdGlvbnMvYnVpbGRlci1zeW1ib2wnO1xuaW1wb3J0IHsgQWN0aW9uQ29tbWFuZEJhc2UsIENvbW1hbmRCYXNlIH0gZnJvbSAnLi9iYXNlJztcbmltcG9ydCB7XG4gICAgQWN0aW9uT3B0aW9ucyxcbiAgICBDbGlja09wdGlvbnMsXG4gICAgTW91c2VPcHRpb25zLFxuICAgIFR5cGVPcHRpb25zLFxuICAgIFByZXNzT3B0aW9ucyxcbiAgICBEcmFnVG9FbGVtZW50T3B0aW9ucyxcbiAgICBPZmZzZXRPcHRpb25zLFxuICAgIENvb2tpZU9wdGlvbnMsXG4gICAgR2V0UHJveHlVcmxPcHRpb25zLFxuICAgIFJlcXVlc3RPcHRpb25zLFxuICAgIFNraXBKc0Vycm9yc09wdGlvbnMsXG4gICAgU2tpcEpzRXJyb3JzQ2FsbGJhY2tXaXRoT3B0aW9ucyxcbn0gZnJvbSAnLi9vcHRpb25zJztcblxuaW1wb3J0IHtcbiAgICBpbml0U2VsZWN0b3IsXG4gICAgaW5pdFR5cGVTZWxlY3RvcixcbiAgICBpbml0VXBsb2FkU2VsZWN0b3IsXG59IGZyb20gJy4vdmFsaWRhdGlvbnMvaW5pdGlhbGl6ZXJzJztcbmltcG9ydCB7IGV4ZWN1dGVKc0V4cHJlc3Npb24gfSBmcm9tICcuLi9leGVjdXRlLWpzLWV4cHJlc3Npb24nO1xuaW1wb3J0IHsgaXNKU0V4cHJlc3Npb24gfSBmcm9tICcuL3V0aWxzJztcblxuaW1wb3J0IHtcbiAgICBhY3Rpb25PcHRpb25zLFxuICAgIGludGVnZXJBcmd1bWVudCxcbiAgICBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCxcbiAgICBzdHJpbmdBcmd1bWVudCxcbiAgICBub25FbXB0eVN0cmluZ0FyZ3VtZW50LFxuICAgIG51bGxhYmxlU3RyaW5nQXJndW1lbnQsXG4gICAgcGFnZVVybEFyZ3VtZW50LFxuICAgIHN0cmluZ09yU3RyaW5nQXJyYXlBcmd1bWVudCxcbiAgICBzZXRTcGVlZEFyZ3VtZW50LFxuICAgIGFjdGlvblJvbGVBcmd1bWVudCxcbiAgICBib29sZWFuQXJndW1lbnQsXG4gICAgZnVuY3Rpb25Bcmd1bWVudCxcbiAgICBjb29raWVzQXJndW1lbnQsXG4gICAgc2V0Q29va2llc0FyZ3VtZW50LFxuICAgIHVybHNBcmd1bWVudCxcbiAgICB1cmxBcmd1bWVudCxcbiAgICBza2lwSnNFcnJvck9wdGlvbnMsXG4gICAgcmVxdWVzdEhvb2tzQXJndW1lbnQsXG59IGZyb20gJy4vdmFsaWRhdGlvbnMvYXJndW1lbnQnO1xuXG5pbXBvcnQgeyBTZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29kZVdyb25nVHlwZUVycm9yIH0gZnJvbSAnLi4vLi4vZXJyb3JzL3Rlc3QtcnVuJztcbmltcG9ydCB7IEV4ZWN1dGVDbGllbnRGdW5jdGlvbkNvbW1hbmQgfSBmcm9tICcuL29ic2VydmF0aW9uJztcbmltcG9ydCB7IGNhbWVsQ2FzZSB9IGZyb20gJ2xvZGFzaCc7XG5pbXBvcnQge1xuICAgIHByZXBhcmVTa2lwSnNFcnJvcnNPcHRpb25zLFxuICAgIGlzU2tpcEpzRXJyb3JzT3B0aW9uc09iamVjdCxcbiAgICBpc1NraXBKc0Vycm9yc0NhbGxiYWNrV2l0aE9wdGlvbnNPYmplY3QsXG59IGZyb20gJy4uLy4uL2FwaS9za2lwLWpzLWVycm9ycyc7XG5cblxuLy8gSW5pdGlhbGl6ZXJzXG5mdW5jdGlvbiBpbml0QWN0aW9uT3B0aW9ucyAobmFtZSwgdmFsLCBpbml0T3B0aW9ucywgdmFsaWRhdGUgPSB0cnVlKSB7XG4gICAgcmV0dXJuIG5ldyBBY3Rpb25PcHRpb25zKHZhbCwgdmFsaWRhdGUpO1xufVxuXG5mdW5jdGlvbiBpbml0Q2xpY2tPcHRpb25zIChuYW1lLCB2YWwsIGluaXRPcHRpb25zLCB2YWxpZGF0ZSA9IHRydWUpIHtcbiAgICByZXR1cm4gbmV3IENsaWNrT3B0aW9ucyh2YWwsIHZhbGlkYXRlKTtcbn1cblxuZnVuY3Rpb24gaW5pdE1vdXNlT3B0aW9ucyAobmFtZSwgdmFsLCBpbml0T3B0aW9ucywgdmFsaWRhdGUgPSB0cnVlKSB7XG4gICAgcmV0dXJuIG5ldyBNb3VzZU9wdGlvbnModmFsLCB2YWxpZGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGluaXRPZmZzZXRPcHRpb25zIChuYW1lLCB2YWwsIGluaXRPcHRpb25zLCB2YWxpZGF0ZSA9IHRydWUpIHtcbiAgICByZXR1cm4gbmV3IE9mZnNldE9wdGlvbnModmFsLCB2YWxpZGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGluaXRUeXBlT3B0aW9ucyAobmFtZSwgdmFsLCBpbml0T3B0aW9ucywgdmFsaWRhdGUgPSB0cnVlKSB7XG4gICAgcmV0dXJuIG5ldyBUeXBlT3B0aW9ucyh2YWwsIHZhbGlkYXRlKTtcbn1cblxuZnVuY3Rpb24gaW5pdERyYWdUb0VsZW1lbnRPcHRpb25zIChuYW1lLCB2YWwsIGluaXRPcHRpb25zLCB2YWxpZGF0ZSA9IHRydWUpIHtcbiAgICByZXR1cm4gbmV3IERyYWdUb0VsZW1lbnRPcHRpb25zKHZhbCwgdmFsaWRhdGUpO1xufVxuXG5mdW5jdGlvbiBpbml0UHJlc3NPcHRpb25zIChuYW1lLCB2YWwsIGluaXRPcHRpb25zLCB2YWxpZGF0ZSA9IHRydWUpIHtcbiAgICByZXR1cm4gbmV3IFByZXNzT3B0aW9ucyh2YWwsIHZhbGlkYXRlKTtcbn1cblxuZnVuY3Rpb24gaW5pdERpYWxvZ0hhbmRsZXIgKG5hbWUsIHZhbCwgeyBza2lwVmlzaWJpbGl0eUNoZWNrLCB0ZXN0UnVuIH0pIHtcbiAgICBsZXQgZm47XG5cbiAgICBpZiAoaXNKU0V4cHJlc3Npb24odmFsKSlcbiAgICAgICAgZm4gPSBleGVjdXRlSnNFeHByZXNzaW9uKHZhbC52YWx1ZSwgdGVzdFJ1biwgeyBza2lwVmlzaWJpbGl0eUNoZWNrIH0pO1xuICAgIGVsc2VcbiAgICAgICAgZm4gPSB2YWwuZm47XG5cbiAgICBpZiAoZm4gPT09IG51bGwgfHwgZm4gaW5zdGFuY2VvZiBFeGVjdXRlQ2xpZW50RnVuY3Rpb25Db21tYW5kKVxuICAgICAgICByZXR1cm4gZm47XG5cbiAgICBjb25zdCBvcHRpb25zICAgICAgPSB2YWwub3B0aW9ucztcbiAgICBjb25zdCBtZXRob2ROYW1lICAgPSAnc2V0TmF0aXZlRGlhbG9nSGFuZGxlcic7XG4gICAgY29uc3QgZnVuY3Rpb25UeXBlID0gdHlwZW9mIGZuO1xuXG4gICAgbGV0IGJ1aWxkZXIgPSBmbiAmJiBmbltmdW5jdGlvbkJ1aWxkZXJTeW1ib2xdO1xuXG4gICAgY29uc3QgaXNTZWxlY3RvciAgICAgICA9IGJ1aWxkZXIgaW5zdGFuY2VvZiBTZWxlY3RvckJ1aWxkZXI7XG4gICAgY29uc3QgaXNDbGllbnRGdW5jdGlvbiA9IGJ1aWxkZXIgaW5zdGFuY2VvZiBDbGllbnRGdW5jdGlvbkJ1aWxkZXI7XG5cbiAgICBpZiAoZnVuY3Rpb25UeXBlICE9PSAnZnVuY3Rpb24nIHx8IGlzU2VsZWN0b3IpXG4gICAgICAgIHRocm93IG5ldyBTZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29kZVdyb25nVHlwZUVycm9yKGlzU2VsZWN0b3IgPyAnU2VsZWN0b3InIDogZnVuY3Rpb25UeXBlKTtcblxuICAgIGlmIChpc0NsaWVudEZ1bmN0aW9uKVxuICAgICAgICBidWlsZGVyID0gZm4ud2l0aChvcHRpb25zKVtmdW5jdGlvbkJ1aWxkZXJTeW1ib2xdO1xuICAgIGVsc2VcbiAgICAgICAgYnVpbGRlciA9IG5ldyBDbGllbnRGdW5jdGlvbkJ1aWxkZXIoZm4sIG9wdGlvbnMsIHsgaW5zdGFudGlhdGlvbjogbWV0aG9kTmFtZSwgZXhlY3V0aW9uOiBtZXRob2ROYW1lIH0pO1xuXG4gICAgcmV0dXJuIGJ1aWxkZXIuZ2V0Q29tbWFuZCgpO1xufVxuXG5mdW5jdGlvbiBpbml0Q29va2llc09wdGlvbiAobmFtZSwgdmFsLCBpbml0T3B0aW9ucywgdmFsaWRhdGUgPSB0cnVlKSB7XG4gICAgcmV0dXJuIHZhbC5tYXAoY29va2llID0+IG5ldyBDb29raWVPcHRpb25zKGNvb2tpZSwgdmFsaWRhdGUpKTtcbn1cblxuZnVuY3Rpb24gaW5pdFJlcXVlc3RPcHRpb24gKG5hbWUsIHZhbCwgaW5pdE9wdGlvbnMsIHZhbGlkYXRlID0gdHJ1ZSkge1xuICAgIHJldHVybiBuZXcgUmVxdWVzdE9wdGlvbnModmFsLCB2YWxpZGF0ZSk7XG59XG5cbmZ1bmN0aW9uIGluaXRHZXRQcm94eVVybE9wdGlvbnMgKG5hbWUsIHZhbCwgaW5pdE9wdGlvbnMsIHZhbGlkYXRlID0gdHJ1ZSkge1xuICAgIHJldHVybiBuZXcgR2V0UHJveHlVcmxPcHRpb25zKHZhbCwgdmFsaWRhdGUpO1xufVxuXG5mdW5jdGlvbiBpbml0U2tpcEpzRXJyb3JzT3B0aW9ucyAobmFtZSwgdmFsLCBpbml0T3B0aW9ucywgdmFsaWRhdGUgPSB0cnVlKSB7XG4gICAgaWYgKHZhbCA9PT0gdm9pZCAwKVxuICAgICAgICByZXR1cm4gdHJ1ZTtcblxuICAgIGlmIChpc1NraXBKc0Vycm9yc0NhbGxiYWNrV2l0aE9wdGlvbnNPYmplY3QodmFsKSlcbiAgICAgICAgdmFsID0gbmV3IFNraXBKc0Vycm9yc0NhbGxiYWNrV2l0aE9wdGlvbnModmFsLCB2YWxpZGF0ZSk7XG5cbiAgICBlbHNlIGlmIChpc1NraXBKc0Vycm9yc09wdGlvbnNPYmplY3QodmFsKSlcbiAgICAgICAgdmFsID0gbmV3IFNraXBKc0Vycm9yc09wdGlvbnModmFsLCB2YWxpZGF0ZSk7XG5cbiAgICByZXR1cm4gcHJlcGFyZVNraXBKc0Vycm9yc09wdGlvbnModmFsKTtcbn1cblxuLy8gQ29tbWFuZHNcbmV4cG9ydCBjbGFzcyBEaXNwYXRjaEV2ZW50Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLmRpc3BhdGNoRXZlbnQpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5kaXNwYXRjaEV2ZW50LCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZXZlbnROYW1lJywgdHlwZTogbm9uRW1wdHlTdHJpbmdBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdyZWxhdGVkVGFyZ2V0JywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDbGlja0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5jbGljayk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmNsaWNrLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRDbGlja09wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUmlnaHRDbGlja0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5yaWdodENsaWNrKTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUucmlnaHRDbGljaywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0Q2xpY2tPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEV4ZWN1dGVFeHByZXNzaW9uQ29tbWFuZCBleHRlbmRzIENvbW1hbmRCYXNlIHtcbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmV4ZWN1dGVFeHByZXNzaW9uLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2V4cHJlc3Npb24nLCB0eXBlOiBub25FbXB0eVN0cmluZ0FyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAncmVzdWx0VmFyaWFibGVOYW1lJywgdHlwZTogbm9uRW1wdHlTdHJpbmdBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBudWxsIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRXhlY3V0ZUFzeW5jRXhwcmVzc2lvbkNvbW1hbmQgZXh0ZW5kcyBDb21tYW5kQmFzZSB7XG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5leGVjdXRlQXN5bmNFeHByZXNzaW9uLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2V4cHJlc3Npb24nLCB0eXBlOiBzdHJpbmdBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBEb3VibGVDbGlja0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5kb3VibGVDbGljayk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmRvdWJsZUNsaWNrLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRDbGlja09wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgSG92ZXJDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuaG92ZXIpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5ob3ZlciwgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0TW91c2VPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFR5cGVUZXh0Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnR5cGVUZXh0KTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUudHlwZVRleHQsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0VHlwZVNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAndGV4dCcsIHR5cGU6IG5vbkVtcHR5U3RyaW5nQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgdHlwZTogYWN0aW9uT3B0aW9ucywgaW5pdDogaW5pdFR5cGVPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIERyYWdDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuZHJhZyk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmRyYWcsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdkcmFnT2Zmc2V0WCcsIHR5cGU6IGludGVnZXJBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2RyYWdPZmZzZXRZJywgdHlwZTogaW50ZWdlckFyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRNb3VzZU9wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRHJhZ1RvRWxlbWVudENvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5kcmFnVG9FbGVtZW50KTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZHJhZ1RvRWxlbWVudCwgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2Rlc3RpbmF0aW9uU2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgdHlwZTogYWN0aW9uT3B0aW9ucywgaW5pdDogaW5pdERyYWdUb0VsZW1lbnRPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjcm9sbENvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5zY3JvbGwpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zY3JvbGwsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiBmYWxzZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAncG9zaXRpb24nLCB0eXBlOiBudWxsYWJsZVN0cmluZ0FyZ3VtZW50LCByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ3gnLCB0eXBlOiBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBudWxsIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICd5JywgdHlwZTogcG9zaXRpdmVJbnRlZ2VyQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRPZmZzZXRPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNjcm9sbEJ5Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnNjcm9sbEJ5KTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc2Nyb2xsQnksIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiBmYWxzZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnYnlYJywgdHlwZTogaW50ZWdlckFyZ3VtZW50LCBkZWZhdWx0VmFsdWU6IDAgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2J5WScsIHR5cGU6IGludGVnZXJBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiAwIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgdHlwZTogYWN0aW9uT3B0aW9ucywgaW5pdDogaW5pdE9mZnNldE9wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2Nyb2xsSW50b1ZpZXdDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuc2Nyb2xsSW50b1ZpZXcpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zY3JvbGxJbnRvVmlldywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0T2Zmc2V0T3B0aW9ucywgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZWxlY3RUZXh0Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnNlbGVjdFRleHQpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zZWxlY3RUZXh0LCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc3RhcnRQb3MnLCB0eXBlOiBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBudWxsIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdlbmRQb3MnLCB0eXBlOiBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBudWxsIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgdHlwZTogYWN0aW9uT3B0aW9ucywgaW5pdDogaW5pdEFjdGlvbk9wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2VsZWN0RWRpdGFibGVDb250ZW50Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnNlbGVjdEVkaXRhYmxlQ29udGVudCk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnNlbGVjdEVkaXRhYmxlQ29udGVudCwgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzdGFydFNlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZW5kU2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnb3B0aW9ucycsIHR5cGU6IGFjdGlvbk9wdGlvbnMsIGluaXQ6IGluaXRBY3Rpb25PcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNlbGVjdFRleHRBcmVhQ29udGVudENvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5zZWxlY3RUZXh0QXJlYUNvbnRlbnQpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zZWxlY3RUZXh0QXJlYUNvbnRlbnQsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc2VsZWN0b3InLCBpbml0OiBpbml0U2VsZWN0b3IsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdzdGFydExpbmUnLCB0eXBlOiBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBudWxsIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdzdGFydFBvcycsIHR5cGU6IHBvc2l0aXZlSW50ZWdlckFyZ3VtZW50LCBkZWZhdWx0VmFsdWU6IG51bGwgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2VuZExpbmUnLCB0eXBlOiBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBudWxsIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdlbmRQb3MnLCB0eXBlOiBwb3NpdGl2ZUludGVnZXJBcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBudWxsIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgdHlwZTogYWN0aW9uT3B0aW9ucywgaW5pdDogaW5pdEFjdGlvbk9wdGlvbnMsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgUHJlc3NLZXlDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUucHJlc3NLZXkpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5wcmVzc0tleSwgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdrZXlzJywgdHlwZTogbm9uRW1wdHlTdHJpbmdBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ29wdGlvbnMnLCB0eXBlOiBhY3Rpb25PcHRpb25zLCBpbml0OiBpbml0UHJlc3NPcHRpb25zLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIE5hdmlnYXRlVG9Db21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUubmF2aWdhdGVUbyk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLm5hdmlnYXRlVG8sIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAndXJsJywgdHlwZTogcGFnZVVybEFyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnc3RhdGVTbmFwc2hvdCcsIHR5cGU6IG51bGxhYmxlU3RyaW5nQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogbnVsbCB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZm9yY2VSZWxvYWQnLCB0eXBlOiBib29sZWFuQXJndW1lbnQsIGRlZmF1bHRWYWx1ZTogZmFsc2UgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXRGaWxlc1RvVXBsb2FkQ29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnNldEZpbGVzVG9VcGxvYWQpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zZXRGaWxlc1RvVXBsb2FkLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFVwbG9hZFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnZmlsZVBhdGgnLCB0eXBlOiBzdHJpbmdPclN0cmluZ0FycmF5QXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQ2xlYXJVcGxvYWRDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuY2xlYXJVcGxvYWQpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5jbGVhclVwbG9hZCwgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdzZWxlY3RvcicsIGluaXQ6IGluaXRVcGxvYWRTZWxlY3RvciwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hUb0lmcmFtZUNvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5zd2l0Y2hUb0lmcmFtZSk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnN3aXRjaFRvSWZyYW1lLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NlbGVjdG9yJywgaW5pdDogaW5pdFNlbGVjdG9yLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN3aXRjaFRvTWFpbldpbmRvd0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5zd2l0Y2hUb01haW5XaW5kb3cpO1xuXG4gICAgY29uc3RydWN0b3IgKCkge1xuICAgICAgICBzdXBlcigpO1xuICAgICAgICB0aGlzLnR5cGUgPSBUWVBFLnN3aXRjaFRvTWFpbldpbmRvdztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBPcGVuV2luZG93Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLm9wZW5XaW5kb3cpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5vcGVuV2luZG93LCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3VybCcsIHR5cGU6IHBhZ2VVcmxBcmd1bWVudCB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENsb3NlV2luZG93Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLmNsb3NlV2luZG93KTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuY2xvc2VXaW5kb3csIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2luZG93SWQnLCB0eXBlOiBudWxsYWJsZVN0cmluZ0FyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuXG5leHBvcnQgY2xhc3MgR2V0Q3VycmVudFdpbmRvd0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5nZXRDdXJyZW50V2luZG93KTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZ2V0Q3VycmVudFdpbmRvdywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBHZXRDdXJyZW50V2luZG93c0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5nZXRDdXJyZW50V2luZG93cyk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmdldEN1cnJlbnRXaW5kb3dzLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN3aXRjaFRvV2luZG93Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnN3aXRjaFRvV2luZG93KTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc3dpdGNoVG9XaW5kb3csIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnd2luZG93SWQnLCB0eXBlOiBub25FbXB0eVN0cmluZ0FyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFN3aXRjaFRvV2luZG93QnlQcmVkaWNhdGVDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuc3dpdGNoVG9XaW5kb3cpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zd2l0Y2hUb1dpbmRvd0J5UHJlZGljYXRlLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2lkJywgdHlwZTogbm9uRW1wdHlTdHJpbmdBcmd1bWVudCwgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdjaGVja1dpbmRvdycsIHR5cGU6IGZ1bmN0aW9uQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU3dpdGNoVG9QYXJlbnRXaW5kb3dDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuc3dpdGNoVG9QYXJlbnRXaW5kb3cpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zd2l0Y2hUb1BhcmVudFdpbmRvdywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTd2l0Y2hUb1ByZXZpb3VzV2luZG93Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnN3aXRjaFRvUHJldmlvdXNXaW5kb3cpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5zd2l0Y2hUb1ByZXZpb3VzV2luZG93LCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFNldE5hdGl2ZURpYWxvZ0hhbmRsZXJDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuc2V0TmF0aXZlRGlhbG9nSGFuZGxlcik7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnNldE5hdGl2ZURpYWxvZ0hhbmRsZXIsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnZGlhbG9nSGFuZGxlcicsIGluaXQ6IGluaXREaWFsb2dIYW5kbGVyLCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cblxuICAgIHN0YXRpYyBmcm9tICh2YWwpIHtcbiAgICAgICAgY29uc3QgZGlhbG9nSGFuZGxlclN0dWIgPSB7XG4gICAgICAgICAgICBkaWFsb2dIYW5kbGVyOiB7IGZuOiBudWxsIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgY29uc3QgY29tbWFuZCA9IG5ldyBTZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29tbWFuZChkaWFsb2dIYW5kbGVyU3R1Yik7XG5cbiAgICAgICAgY29tbWFuZC5kaWFsb2dIYW5kbGVyID0gdmFsLmRpYWxvZ0hhbmRsZXI7XG5cbiAgICAgICAgcmV0dXJuIGNvbW1hbmQ7XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgR2V0TmF0aXZlRGlhbG9nSGlzdG9yeUNvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5nZXROYXRpdmVEaWFsb2dIaXN0b3J5KTtcblxuICAgIGNvbnN0cnVjdG9yICgpIHtcbiAgICAgICAgc3VwZXIoKTtcbiAgICAgICAgdGhpcy50eXBlID0gVFlQRS5nZXROYXRpdmVEaWFsb2dIaXN0b3J5O1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldEJyb3dzZXJDb25zb2xlTWVzc2FnZXNDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuZ2V0QnJvd3NlckNvbnNvbGVNZXNzYWdlcyk7XG5cbiAgICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgICAgIHN1cGVyKCk7XG4gICAgICAgIHRoaXMudHlwZSA9IFRZUEUuZ2V0QnJvd3NlckNvbnNvbGVNZXNzYWdlcztcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXRUZXN0U3BlZWRDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuc2V0VGVzdFNwZWVkKTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc2V0VGVzdFNwZWVkLCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ3NwZWVkJywgdHlwZTogc2V0U3BlZWRBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBTZXRQYWdlTG9hZFRpbWVvdXRDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuc2V0UGFnZUxvYWRUaW1lb3V0KTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc2V0UGFnZUxvYWRUaW1lb3V0LCB2YWxpZGF0ZVByb3BlcnRpZXMpO1xuICAgIH1cblxuICAgIGdldEFzc2lnbmFibGVQcm9wZXJ0aWVzICgpIHtcbiAgICAgICAgcmV0dXJuIFtcbiAgICAgICAgICAgIHsgbmFtZTogJ2R1cmF0aW9uJywgdHlwZTogcG9zaXRpdmVJbnRlZ2VyQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgVXNlUm9sZUNvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS51c2VSb2xlKTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUudXNlUm9sZSwgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdyb2xlJywgdHlwZTogYWN0aW9uUm9sZUFyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENsb3NlQ2hpbGRXaW5kb3dPbkZpbGVEb3dubG9hZGluZyBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLmNsb3NlQ2hpbGRXaW5kb3dPbkZpbGVEb3dubG9hZGluZyk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmNsb3NlQ2hpbGRXaW5kb3dPbkZpbGVEb3dubG9hZGluZywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZWNvcmRlckNvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5yZWNvcmRlcik7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5yZWNvcmRlcik7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnc3VidHlwZScsIHR5cGU6IG5vbkVtcHR5U3RyaW5nQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdmb3JjZUV4ZWN1dGlvbkluVG9wV2luZG93T25seScsIHR5cGU6IGJvb2xlYW5Bcmd1bWVudCwgZGVmYXVsdFZhbHVlOiBmYWxzZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldENvb2tpZXNDb21tYW5kIGV4dGVuZHMgQWN0aW9uQ29tbWFuZEJhc2Uge1xuICAgIHN0YXRpYyBtZXRob2ROYW1lID0gY2FtZWxDYXNlKFRZUEUuZ2V0Q29va2llcyk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmdldENvb2tpZXMsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAndXJscycsIHR5cGU6IHVybHNBcmd1bWVudCwgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdjb29raWVzJywgdHlwZTogY29va2llc0FyZ3VtZW50LCBpbml0OiBpbml0Q29va2llc09wdGlvbiwgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2V0Q29va2llc0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5zZXRDb29raWVzKTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuc2V0Q29va2llcywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICd1cmwnLCB0eXBlOiB1cmxzQXJndW1lbnQsIHJlcXVpcmVkOiBmYWxzZSB9LFxuICAgICAgICAgICAgeyBuYW1lOiAnY29va2llcycsIHR5cGU6IHNldENvb2tpZXNBcmd1bWVudCwgaW5pdDogaW5pdENvb2tpZXNPcHRpb24sIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgRGVsZXRlQ29va2llc0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5kZWxldGVDb29raWVzKTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZGVsZXRlQ29va2llcywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICd1cmxzJywgdHlwZTogdXJsc0FyZ3VtZW50LCByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgICAgIHsgbmFtZTogJ2Nvb2tpZXMnLCB0eXBlOiBjb29raWVzQXJndW1lbnQsIGluaXQ6IGluaXRDb29raWVzT3B0aW9uLCByZXF1aXJlZDogZmFsc2UgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBSZXF1ZXN0Q29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnJlcXVlc3QpO1xuICAgIHN0YXRpYyBleHRlbmRlZE1ldGhvZHMgPSBbJ2dldCcsICdwb3N0JywgJ2RlbGV0ZScsICdwdXQnLCAncGF0Y2gnLCAnaGVhZCddO1xuICAgIHN0YXRpYyByZXN1bHRHZXR0ZXJzID0gWydzdGF0dXMnLCAnc3RhdHVzVGV4dCcsICdoZWFkZXJzJywgJ2JvZHknXTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUucmVxdWVzdCwgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICd1cmwnLCB0eXBlOiB1cmxBcmd1bWVudCwgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgdHlwZTogYWN0aW9uT3B0aW9ucywgaW5pdDogaW5pdFJlcXVlc3RPcHRpb24sIHJlcXVpcmVkOiBmYWxzZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIEdldFByb3h5VXJsQ29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLmdldFByb3h5VXJsKTtcblxuICAgIGNvbnN0cnVjdG9yIChvYmosIHRlc3RSdW4sIHZhbGlkYXRlUHJvcGVydGllcykge1xuICAgICAgICBzdXBlcihvYmosIHRlc3RSdW4sIFRZUEUuZ2V0UHJveHlVcmwsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAndXJsJywgdHlwZTogdXJsQXJndW1lbnQsIHJlcXVpcmVkOiB0cnVlIH0sXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgaW5pdDogaW5pdEdldFByb3h5VXJsT3B0aW9ucywgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgU2tpcEpzRXJyb3JzQ29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLnNraXBKc0Vycm9ycyk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLnNraXBKc0Vycm9ycywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdvcHRpb25zJywgdHlwZTogc2tpcEpzRXJyb3JPcHRpb25zLCBpbml0OiBpbml0U2tpcEpzRXJyb3JzT3B0aW9ucywgcmVxdWlyZWQ6IGZhbHNlIH0sXG4gICAgICAgIF07XG4gICAgfVxufVxuXG5leHBvcnQgY2xhc3MgQWRkUmVxdWVzdEhvb2tzQ29tbWFuZCBleHRlbmRzIEFjdGlvbkNvbW1hbmRCYXNlIHtcbiAgICBzdGF0aWMgbWV0aG9kTmFtZSA9IGNhbWVsQ2FzZShUWVBFLmFkZFJlcXVlc3RIb29rcyk7XG5cbiAgICBjb25zdHJ1Y3RvciAob2JqLCB0ZXN0UnVuLCB2YWxpZGF0ZVByb3BlcnRpZXMpIHtcbiAgICAgICAgc3VwZXIob2JqLCB0ZXN0UnVuLCBUWVBFLmFkZFJlcXVlc3RIb29rcywgdmFsaWRhdGVQcm9wZXJ0aWVzKTtcbiAgICB9XG5cbiAgICBnZXRBc3NpZ25hYmxlUHJvcGVydGllcyAoKSB7XG4gICAgICAgIHJldHVybiBbXG4gICAgICAgICAgICB7IG5hbWU6ICdob29rcycsIHR5cGU6IHJlcXVlc3RIb29rc0FyZ3VtZW50LCByZXF1aXJlZDogdHJ1ZSB9LFxuICAgICAgICBdO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIFJlbW92ZVJlcXVlc3RIb29rc0NvbW1hbmQgZXh0ZW5kcyBBY3Rpb25Db21tYW5kQmFzZSB7XG4gICAgc3RhdGljIG1ldGhvZE5hbWUgPSBjYW1lbENhc2UoVFlQRS5yZW1vdmVSZXF1ZXN0SG9va3MpO1xuXG4gICAgY29uc3RydWN0b3IgKG9iaiwgdGVzdFJ1biwgdmFsaWRhdGVQcm9wZXJ0aWVzKSB7XG4gICAgICAgIHN1cGVyKG9iaiwgdGVzdFJ1biwgVFlQRS5yZW1vdmVSZXF1ZXN0SG9va3MsIHZhbGlkYXRlUHJvcGVydGllcyk7XG4gICAgfVxuXG4gICAgZ2V0QXNzaWduYWJsZVByb3BlcnRpZXMgKCkge1xuICAgICAgICByZXR1cm4gW1xuICAgICAgICAgICAgeyBuYW1lOiAnaG9va3MnLCB0eXBlOiByZXF1ZXN0SG9va3NBcmd1bWVudCwgcmVxdWlyZWQ6IHRydWUgfSxcbiAgICAgICAgXTtcbiAgICB9XG59XG5cbiJdfQ==