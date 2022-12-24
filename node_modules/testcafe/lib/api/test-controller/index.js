"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// TODO: Fix https://github.com/DevExpress/testcafe/issues/4139 to get rid of Pinkie
const pinkie_1 = __importDefault(require("pinkie"));
const lodash_1 = require("lodash");
const get_callsite_1 = require("../../errors/get-callsite");
const client_function_builder_1 = __importDefault(require("../../client-functions/client-function-builder"));
const assertion_1 = __importDefault(require("./assertion"));
const delegated_api_1 = require("../../utils/delegated-api");
const add_rendered_warning_1 = __importDefault(require("../../notifications/add-rendered-warning"));
const deprecated_1 = require("../../notifications/deprecated");
const actions_1 = require("../../test-run/commands/actions");
const browser_manipulation_1 = require("../../test-run/commands/browser-manipulation");
const observation_1 = require("../../test-run/commands/observation");
const execution_context_1 = require("./execution-context");
const types_1 = require("../../client-functions/types");
const test_run_proxy_1 = __importDefault(require("../../services/compiler/test-run-proxy"));
const test_run_1 = require("../../errors/test-run");
const assertion_2 = require("../../test-run/commands/assertion");
const callsite_1 = require("../../utils/callsite");
const re_executable_promise_1 = __importDefault(require("../../utils/re-executable-promise"));
const send_1 = __importDefault(require("../../test-run/request/send"));
const runtime_1 = require("../../errors/runtime");
const types_2 = require("../../errors/types");
const originalThen = pinkie_1.default.resolve().then;
let inDebug = false;
function delegatedAPI(methodName, accessor = '') {
    return `_${methodName}$${accessor}`;
}
class TestController {
    constructor(testRun) {
        this._executionContext = null;
        this.testRun = testRun;
        this.executionChain = pinkie_1.default.resolve();
        this.warningLog = testRun.warningLog;
        this._addTestControllerToExecutionChain();
    }
    _addTestControllerToExecutionChain() {
        this.executionChain._testController = this;
    }
    // NOTE: TestCafe executes actions and assertions asynchronously in the following cases:
    // a) The `await` keyword that proceeds the method declaration triggers the `then` function of a Promise.
    // b) The action is chained to another `awaited` method.
    //
    // In order to track missing `await` statements, TestCafe exposes a special Promise to the user.
    // When TestCafe detects a missing `await` statement, it compares the method's callsite to the call site of the exposed Promise.
    // This workaround is necessary for situations like these:
    //
    // var t2 = t.click('#btn1'); // <-- stores new callsiteWithoutAwait
    // await t2;                  // <-- callsiteWithoutAwait = null
    // t.click('#btn2');          // <-- stores new callsiteWithoutAwait
    // await t2.click('#btn3');   // <-- without check it will set callsiteWithoutAwait = null, so we will lost tracking
    _createExtendedPromise(promise, callsite) {
        const extendedPromise = promise.then(lodash_1.identity);
        const observedCallsites = this.testRun.observedCallsites;
        const markCallsiteAwaited = () => observedCallsites.callsitesWithoutAwait.delete(callsite);
        extendedPromise.then = function () {
            markCallsiteAwaited();
            return originalThen.apply(this, arguments);
        };
        (0, delegated_api_1.delegateAPI)(extendedPromise, TestController.API_LIST, {
            handler: this,
            proxyMethod: markCallsiteAwaited,
        });
        return extendedPromise;
    }
    _createCommand(CmdCtor, cmdArgs, callsite) {
        try {
            return new CmdCtor(cmdArgs, this.testRun);
        }
        catch (err) {
            err.callsite = callsite;
            throw err;
        }
    }
    _enqueueTask(apiMethodName, createTaskExecutor, callsite) {
        const executor = createTaskExecutor();
        this.executionChain.then = originalThen;
        this.executionChain = this.executionChain.then(executor);
        this.testRun.observedCallsites.callsitesWithoutAwait.add(callsite);
        this.executionChain = this._createExtendedPromise(this.executionChain, callsite);
        this._addTestControllerToExecutionChain();
        return this.executionChain;
    }
    _enqueueCommand(CmdCtor, cmdArgs, validateCommandFn) {
        const callsite = (0, get_callsite_1.getCallsiteForMethod)(CmdCtor.methodName);
        const command = this._createCommand(CmdCtor, cmdArgs, callsite);
        if (typeof validateCommandFn === 'function')
            validateCommandFn(this, command, callsite);
        return this._enqueueTask(command.methodName, () => {
            return () => {
                return this.testRun.executeCommand(command, callsite)
                    .catch(err => {
                    this.executionChain = pinkie_1.default.resolve();
                    throw err;
                });
            };
        }, callsite);
    }
    _validateMultipleWindowCommand(apiMethodName) {
        const { disableMultipleWindows, activeWindowId } = this.testRun;
        if (disableMultipleWindows)
            throw new test_run_1.MultipleWindowsModeIsDisabledError(apiMethodName);
        if (!activeWindowId)
            throw new test_run_1.MultipleWindowsModeIsNotAvailableInRemoteBrowserError(apiMethodName);
    }
    getExecutionContext() {
        if (!this._executionContext)
            this._executionContext = (0, execution_context_1.createExecutionContext)(this.testRun);
        return this._executionContext;
    }
    // API implementation
    // We need implementation methods to obtain correct callsites. If we use plain API
    // methods in chained wrappers then we will have callsite for the wrapped method
    // in this file instead of chained method callsite in user code.
    _ctx$getter() {
        return this.testRun.ctx;
    }
    _ctx$setter(val) {
        this.testRun.ctx = val;
        return this.testRun.ctx;
    }
    _fixtureCtx$getter() {
        return this.testRun.fixtureCtx;
    }
    _browser$getter() {
        return this.testRun.browser;
    }
    [delegatedAPI(actions_1.DispatchEventCommand.methodName)](selector, eventName, options = {}) {
        return this._enqueueCommand(actions_1.DispatchEventCommand, { selector, eventName, options, relatedTarget: options.relatedTarget });
    }
    _prepareCookieArguments(args, isSetCommand = false) {
        const urlsArg = (0, lodash_1.castArray)(args[1]);
        const urls = Array.isArray(urlsArg) && typeof urlsArg[0] === 'string' ? urlsArg : [];
        const cookiesArg = urls.length ? args[0] : args;
        const cookies = [];
        (0, lodash_1.flattenDeep)((0, lodash_1.castArray)(cookiesArg)).forEach(cookie => {
            if (isSetCommand && !cookie.name && typeof cookie === 'object')
                Object.entries(cookie).forEach(([name, value]) => cookies.push({ name, value }));
            else if (!isSetCommand && typeof cookie === 'string')
                cookies.push({ name: cookie });
            else
                cookies.push(cookie);
        });
        return { urls, cookies };
    }
    [delegatedAPI(actions_1.GetCookiesCommand.methodName)](...args) {
        return this._enqueueCommand(actions_1.GetCookiesCommand, this._prepareCookieArguments(args));
    }
    [delegatedAPI(actions_1.SetCookiesCommand.methodName)](...args) {
        const { urls, cookies } = this._prepareCookieArguments(args, true);
        return this._enqueueCommand(actions_1.SetCookiesCommand, { cookies, url: urls[0] });
    }
    [delegatedAPI(actions_1.DeleteCookiesCommand.methodName)](...args) {
        return this._enqueueCommand(actions_1.DeleteCookiesCommand, this._prepareCookieArguments(args));
    }
    _prepareRequestArguments(bindOptions, ...args) {
        const [url, options] = typeof args[0] === 'object' ? [args[0].url, args[0]] : args;
        return {
            url,
            options: Object.assign({}, options, bindOptions),
        };
    }
    _createRequestFunction(bindOptions = {}) {
        const controller = this;
        const callsite = (0, get_callsite_1.getCallsiteForMethod)(actions_1.RequestCommand.methodName);
        if (!controller.testRun || controller.testRun instanceof test_run_proxy_1.default)
            throw new runtime_1.RequestRuntimeError(callsite, types_2.RUNTIME_ERRORS.requestCannotResolveTestRun);
        return function (...args) {
            const cmdArgs = controller._prepareRequestArguments(bindOptions, ...args);
            const command = controller._createCommand(actions_1.RequestCommand, cmdArgs, callsite);
            const options = Object.assign(Object.assign({}, command.options), { url: command.url || command.options.url || '' });
            const promise = re_executable_promise_1.default.fromFn(async () => {
                return (0, send_1.default)(controller.testRun, options, callsite);
            });
            actions_1.RequestCommand.resultGetters.forEach(getter => {
                Object.defineProperty(promise, getter, {
                    get: () => re_executable_promise_1.default.fromFn(async () => {
                        const response = await (0, send_1.default)(controller.testRun, options, callsite);
                        return response[getter];
                    }),
                });
            });
            return promise;
        };
    }
    _decorateRequestFunction(fn) {
        actions_1.RequestCommand.extendedMethods.forEach(method => {
            Object.defineProperty(fn, method, {
                value: this._createRequestFunction({ method }),
            });
        });
    }
    [delegatedAPI(actions_1.RequestCommand.methodName, 'getter')]() {
        const fn = this._createRequestFunction();
        this._decorateRequestFunction(fn);
        return fn;
    }
    [delegatedAPI(actions_1.ClickCommand.methodName)](selector, options) {
        return this._enqueueCommand(actions_1.ClickCommand, { selector, options });
    }
    [delegatedAPI(actions_1.RightClickCommand.methodName)](selector, options) {
        return this._enqueueCommand(actions_1.RightClickCommand, { selector, options });
    }
    [delegatedAPI(actions_1.DoubleClickCommand.methodName)](selector, options) {
        return this._enqueueCommand(actions_1.DoubleClickCommand, { selector, options });
    }
    [delegatedAPI(actions_1.HoverCommand.methodName)](selector, options) {
        return this._enqueueCommand(actions_1.HoverCommand, { selector, options });
    }
    [delegatedAPI(actions_1.DragCommand.methodName)](selector, dragOffsetX, dragOffsetY, options) {
        return this._enqueueCommand(actions_1.DragCommand, { selector, dragOffsetX, dragOffsetY, options });
    }
    [delegatedAPI(actions_1.DragToElementCommand.methodName)](selector, destinationSelector, options) {
        return this._enqueueCommand(actions_1.DragToElementCommand, { selector, destinationSelector, options });
    }
    _getSelectorForScroll(args) {
        const selector = typeof args[0] === 'string' || (0, types_1.isSelector)(args[0]) ? args[0] : null;
        if (selector)
            args.shift();
        else
            // NOTE: here we use document.scrollingElement for old Safari versions
            // document.documentElement does not work as expected on Mojave Safari 12.1/ High Sierra Safari 11.1
            // eslint-disable-next-line no-undef
            return () => document.scrollingElement || document.documentElement;
        return selector;
    }
    _getPosition(args) {
        const position = args.length === 1 && typeof args[0] === 'string' ? args[0] : null;
        if (position)
            args.shift();
        return position;
    }
    [delegatedAPI(actions_1.ScrollCommand.methodName)](...args) {
        let position = this._getPosition(args);
        const selector = this._getSelectorForScroll(args);
        let x = void 0;
        let y = void 0;
        let options = void 0;
        if (typeof args[0] === 'string')
            [position, options] = args;
        if (typeof args[0] === 'number')
            [x, y, options] = args;
        return this._enqueueCommand(actions_1.ScrollCommand, { selector, x, y, position, options });
    }
    [delegatedAPI(actions_1.ScrollByCommand.methodName)](...args) {
        const selector = this._getSelectorForScroll(args);
        const [byX, byY, options] = args;
        return this._enqueueCommand(actions_1.ScrollByCommand, { selector, byX, byY, options });
    }
    [delegatedAPI(actions_1.ScrollIntoViewCommand.methodName)](selector, options) {
        return this._enqueueCommand(actions_1.ScrollIntoViewCommand, { selector, options });
    }
    [delegatedAPI(actions_1.TypeTextCommand.methodName)](selector, text, options) {
        return this._enqueueCommand(actions_1.TypeTextCommand, { selector, text, options });
    }
    [delegatedAPI(actions_1.SelectTextCommand.methodName)](selector, startPos, endPos, options) {
        return this._enqueueCommand(actions_1.SelectTextCommand, { selector, startPos, endPos, options });
    }
    [delegatedAPI(actions_1.SelectTextAreaContentCommand.methodName)](selector, startLine, startPos, endLine, endPos, options) {
        return this._enqueueCommand(actions_1.SelectTextAreaContentCommand, {
            selector,
            startLine,
            startPos,
            endLine,
            endPos,
            options,
        });
    }
    [delegatedAPI(actions_1.SelectEditableContentCommand.methodName)](startSelector, endSelector, options) {
        return this._enqueueCommand(actions_1.SelectEditableContentCommand, {
            startSelector,
            endSelector,
            options,
        });
    }
    [delegatedAPI(actions_1.PressKeyCommand.methodName)](keys, options) {
        return this._enqueueCommand(actions_1.PressKeyCommand, { keys, options });
    }
    [delegatedAPI(observation_1.WaitCommand.methodName)](timeout) {
        return this._enqueueCommand(observation_1.WaitCommand, { timeout });
    }
    [delegatedAPI(actions_1.NavigateToCommand.methodName)](url) {
        return this._enqueueCommand(actions_1.NavigateToCommand, { url });
    }
    [delegatedAPI(actions_1.SetFilesToUploadCommand.methodName)](selector, filePath) {
        return this._enqueueCommand(actions_1.SetFilesToUploadCommand, { selector, filePath });
    }
    [delegatedAPI(actions_1.ClearUploadCommand.methodName)](selector) {
        return this._enqueueCommand(actions_1.ClearUploadCommand, { selector });
    }
    [delegatedAPI(browser_manipulation_1.TakeScreenshotCommand.methodName)](options) {
        if (options && typeof options !== 'object')
            options = { path: options };
        return this._enqueueCommand(browser_manipulation_1.TakeScreenshotCommand, options);
    }
    [delegatedAPI(browser_manipulation_1.TakeElementScreenshotCommand.methodName)](selector, ...args) {
        const commandArgs = { selector };
        if (args[1]) {
            commandArgs.path = args[0];
            commandArgs.options = args[1];
        }
        else if (typeof args[0] === 'object')
            commandArgs.options = args[0];
        else
            commandArgs.path = args[0];
        return this._enqueueCommand(browser_manipulation_1.TakeElementScreenshotCommand, commandArgs);
    }
    [delegatedAPI(browser_manipulation_1.ResizeWindowCommand.methodName)](width, height) {
        return this._enqueueCommand(browser_manipulation_1.ResizeWindowCommand, { width, height });
    }
    [delegatedAPI(browser_manipulation_1.ResizeWindowToFitDeviceCommand.methodName)](device, options) {
        return this._enqueueCommand(browser_manipulation_1.ResizeWindowToFitDeviceCommand, { device, options });
    }
    [delegatedAPI(browser_manipulation_1.MaximizeWindowCommand.methodName)]() {
        return this._enqueueCommand(browser_manipulation_1.MaximizeWindowCommand);
    }
    [delegatedAPI(actions_1.SwitchToIframeCommand.methodName)](selector) {
        return this._enqueueCommand(actions_1.SwitchToIframeCommand, { selector });
    }
    [delegatedAPI(actions_1.SwitchToMainWindowCommand.methodName)]() {
        return this._enqueueCommand(actions_1.SwitchToMainWindowCommand);
    }
    [delegatedAPI(actions_1.OpenWindowCommand.methodName)](url) {
        this._validateMultipleWindowCommand(actions_1.OpenWindowCommand.methodName);
        return this._enqueueCommand(actions_1.OpenWindowCommand, { url });
    }
    [delegatedAPI(actions_1.CloseWindowCommand.methodName)](window) {
        const windowId = (window === null || window === void 0 ? void 0 : window.id) || null;
        this._validateMultipleWindowCommand(actions_1.CloseWindowCommand.methodName);
        return this._enqueueCommand(actions_1.CloseWindowCommand, { windowId });
    }
    [delegatedAPI(actions_1.GetCurrentWindowCommand.methodName)]() {
        this._validateMultipleWindowCommand(actions_1.GetCurrentWindowCommand.methodName);
        return this._enqueueCommand(actions_1.GetCurrentWindowCommand);
    }
    [delegatedAPI(actions_1.SwitchToWindowCommand.methodName)](windowSelector) {
        this._validateMultipleWindowCommand(actions_1.SwitchToWindowCommand.methodName);
        let command;
        let args;
        if (typeof windowSelector === 'function') {
            command = actions_1.SwitchToWindowByPredicateCommand;
            args = { checkWindow: windowSelector };
        }
        else {
            command = actions_1.SwitchToWindowCommand;
            args = { windowId: windowSelector === null || windowSelector === void 0 ? void 0 : windowSelector.id };
        }
        return this._enqueueCommand(command, args);
    }
    [delegatedAPI(actions_1.SwitchToParentWindowCommand.methodName)]() {
        this._validateMultipleWindowCommand(actions_1.SwitchToParentWindowCommand.methodName);
        return this._enqueueCommand(actions_1.SwitchToParentWindowCommand);
    }
    [delegatedAPI(actions_1.SwitchToPreviousWindowCommand.methodName)]() {
        this._validateMultipleWindowCommand(actions_1.SwitchToPreviousWindowCommand.methodName);
        return this._enqueueCommand(actions_1.SwitchToPreviousWindowCommand);
    }
    _eval$(fn, options) {
        if (!(0, lodash_1.isNil)(options))
            options = (0, lodash_1.assign)({}, options, { boundTestRun: this });
        const builder = new client_function_builder_1.default(fn, options, { instantiation: 'eval', execution: 'eval' });
        const clientFn = builder.getFunction();
        return clientFn();
    }
    [delegatedAPI(actions_1.SetNativeDialogHandlerCommand.methodName)](fn, options) {
        return this._enqueueCommand(actions_1.SetNativeDialogHandlerCommand, {
            dialogHandler: { fn, options },
        });
    }
    [delegatedAPI(actions_1.GetNativeDialogHistoryCommand.methodName)]() {
        const callsite = (0, get_callsite_1.getCallsiteForMethod)(actions_1.GetNativeDialogHistoryCommand.methodName);
        const command = this._createCommand(actions_1.GetNativeDialogHistoryCommand, {}, callsite);
        return this.testRun.executeCommand(command, callsite);
    }
    [delegatedAPI(actions_1.GetBrowserConsoleMessagesCommand.methodName)]() {
        const callsite = (0, get_callsite_1.getCallsiteForMethod)(actions_1.GetBrowserConsoleMessagesCommand.methodName);
        const command = this._createCommand(actions_1.GetBrowserConsoleMessagesCommand, {}, callsite);
        return this.testRun.executeCommand(command, callsite);
    }
    checkForExcessiveAwaits(checkedCallsite, { actionId }) {
        const snapshotPropertyCallsites = this.testRun.observedCallsites.snapshotPropertyCallsites;
        const callsiteId = (0, callsite_1.getCallsiteId)(checkedCallsite);
        // NOTE: If there are unasserted callsites, we should add all of them to awaitedSnapshotWarnings.
        // The warnings themselves are raised after the test run in wrap-test-function
        if (snapshotPropertyCallsites[callsiteId] && !snapshotPropertyCallsites[callsiteId].checked) {
            for (const propertyCallsite of snapshotPropertyCallsites[callsiteId].callsites)
                this.testRun.observedCallsites.awaitedSnapshotWarnings.set((0, callsite_1.getCallsiteStackFrameString)(propertyCallsite), { callsite: propertyCallsite, actionId });
            delete snapshotPropertyCallsites[callsiteId];
        }
        else
            snapshotPropertyCallsites[callsiteId] = { callsites: [], checked: true };
    }
    [delegatedAPI(assertion_2.AssertionCommand.methodName)](actual) {
        const callsite = (0, get_callsite_1.getCallsiteForMethod)(assertion_2.AssertionCommand.methodName);
        return new assertion_1.default(actual, this, callsite);
    }
    [delegatedAPI(observation_1.DebugCommand.methodName)]() {
        // NOTE: do not need to enqueue the Debug command if we are in debugging mode.
        // The Debug command will be executed by CDP.
        // Also, we are forced to add empty function to the execution chain to preserve it.
        return this.isCompilerServiceMode() ? this._enqueueTask(observation_1.DebugCommand.methodName, lodash_1.noop) : this._enqueueCommand(observation_1.DebugCommand);
    }
    [delegatedAPI(actions_1.SetTestSpeedCommand.methodName)](speed) {
        return this._enqueueCommand(actions_1.SetTestSpeedCommand, { speed });
    }
    [delegatedAPI(actions_1.SetPageLoadTimeoutCommand.methodName)](duration) {
        return this._enqueueCommand(actions_1.SetPageLoadTimeoutCommand, { duration }, (testController, command) => {
            (0, add_rendered_warning_1.default)(testController.warningLog, { message: (0, deprecated_1.getDeprecationMessage)(deprecated_1.DEPRECATED.setPageLoadTimeout), actionId: command.actionId });
        });
    }
    [delegatedAPI(actions_1.UseRoleCommand.methodName)](role) {
        return this._enqueueCommand(actions_1.UseRoleCommand, { role });
    }
    [delegatedAPI(actions_1.SkipJsErrorsCommand.methodName)](options) {
        return this._enqueueCommand(actions_1.SkipJsErrorsCommand, { options });
    }
    [delegatedAPI(actions_1.AddRequestHooksCommand.methodName)](...hooks) {
        hooks = (0, lodash_1.flattenDeep)(hooks);
        return this._enqueueCommand(actions_1.AddRequestHooksCommand, { hooks });
    }
    [delegatedAPI(actions_1.RemoveRequestHooksCommand.methodName)](...hooks) {
        hooks = (0, lodash_1.flattenDeep)(hooks);
        return this._enqueueCommand(actions_1.RemoveRequestHooksCommand, { hooks });
    }
    static enableDebugForNonDebugCommands() {
        inDebug = true;
    }
    static disableDebugForNonDebugCommands() {
        inDebug = false;
    }
    shouldStop(command) {
        // NOTE: should never stop in not compliler debugging mode
        if (!this.isCompilerServiceMode())
            return false;
        // NOTE: should always stop on Debug command
        if (command === 'debug')
            return true;
        // NOTE: should stop on other actions after the `Next Action` button is clicked
        if (inDebug) {
            inDebug = false;
            return true;
        }
        return false;
    }
    isCompilerServiceMode() {
        return this.testRun instanceof test_run_proxy_1.default;
    }
}
exports.default = TestController;
TestController.API_LIST = (0, delegated_api_1.getDelegatedAPIList)(TestController.prototype);
(0, delegated_api_1.delegateAPI)(TestController.prototype, TestController.API_LIST, { useCurrentCtxAsHandler: true });
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYXBpL3Rlc3QtY29udHJvbGxlci9pbmRleC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztBQUFBLG9GQUFvRjtBQUNwRixvREFBNkI7QUFDN0IsbUNBT2dCO0FBRWhCLDREQUFpRTtBQUNqRSw2R0FBbUY7QUFDbkYsNERBQW9DO0FBQ3BDLDZEQUE2RTtBQUM3RSxvR0FBa0U7QUFDbEUsK0RBQW1GO0FBRW5GLDZEQXlDeUM7QUFFekMsdUZBTXNEO0FBRXRELHFFQUFnRjtBQUNoRiwyREFBOEU7QUFDOUUsd0RBQTBEO0FBQzFELDRGQUFrRTtBQUVsRSxvREFHK0I7QUFFL0IsaUVBQXFFO0FBQ3JFLG1EQUFrRjtBQUNsRiw4RkFBb0U7QUFDcEUsdUVBQXNEO0FBQ3RELGtEQUEyRDtBQUMzRCw4Q0FBb0Q7QUFFcEQsTUFBTSxZQUFZLEdBQUcsZ0JBQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUM7QUFFNUMsSUFBSSxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBRXBCLFNBQVMsWUFBWSxDQUFFLFVBQVUsRUFBRSxRQUFRLEdBQUcsRUFBRTtJQUM1QyxPQUFPLElBQUksVUFBVSxJQUFJLFFBQVEsRUFBRSxDQUFDO0FBQ3hDLENBQUM7QUFFRCxNQUFxQixjQUFjO0lBQy9CLFlBQWEsT0FBTztRQUNoQixJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxDQUFDO1FBRTlCLElBQUksQ0FBQyxPQUFPLEdBQVUsT0FBTyxDQUFDO1FBQzlCLElBQUksQ0FBQyxjQUFjLEdBQUcsZ0JBQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztRQUN4QyxJQUFJLENBQUMsVUFBVSxHQUFPLE9BQU8sQ0FBQyxVQUFVLENBQUM7UUFFekMsSUFBSSxDQUFDLGtDQUFrQyxFQUFFLENBQUM7SUFDOUMsQ0FBQztJQUVELGtDQUFrQztRQUM5QixJQUFJLENBQUMsY0FBYyxDQUFDLGVBQWUsR0FBRyxJ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QUFFLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztJQUN0RSxDQUFDO0lBRUQsTUFBTSxDQUFDLDhCQUE4QjtRQUNqQyxPQUFPLEdBQUcsSUFBSSxDQUFDO0lBQ25CLENBQUM7SUFFRCxNQUFNLENBQUMsK0JBQStCO1FBQ2xDLE9BQU8sR0FBRyxLQUFLLENBQUM7SUFDcEIsQ0FBQztJQUVELFVBQVUsQ0FBRSxPQUFPO1FBQ2YsMERBQTBEO1FBQzFELElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLEVBQUU7WUFDN0IsT0FBTyxLQUFLLENBQUM7UUFFakIsNENBQTRDO1FBQzVDLElBQUksT0FBTyxLQUFLLE9BQU87WUFDbkIsT0FBTyxJQUFJLENBQUM7UUFFaEIsK0VBQStFO1FBQy9FLElBQUksT0FBTyxFQUFFO1lBQ1QsT0FBTyxHQUFHLEtBQUssQ0FBQztZQUVoQixPQUFPLElBQUksQ0FBQztTQUNmO1FBRUQsT0FBTyxLQUFLLENBQUM7SUFDakIsQ0FBQztJQUVELHFCQUFxQjtRQUNqQixPQUFPLElBQUksQ0FBQyxPQUFPLFlBQVksd0JBQVksQ0FBQztJQUNoRCxDQUFDO0NBRUo7QUFwakJELGlDQW9qQkM7QUFFRCxjQUFjLENBQUMsUUFBUSxHQUFHLElBQUEsbUNBQW1CLEVBQUMsY0FBYyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBRXhFLElBQUEsMkJBQVcsRUFBQyxjQUFjLENBQUMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxRQUFRLEVBQUUsRUFBRSxzQkFBc0IsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiLy8gVE9ETzogRml4IGh0dHBzOi8vZ2l0aHViLmNvbS9EZXZFeHByZXNzL3Rlc3RjYWZlL2lzc3Vlcy80MTM5IHRvIGdldCByaWQgb2YgUGlua2llXG5pbXBvcnQgUHJvbWlzZSBmcm9tICdwaW5raWUnO1xuaW1wb3J0IHtcbiAgICBpZGVudGl0eSxcbiAgICBhc3NpZ24sXG4gICAgaXNOaWwgYXMgaXNOdWxsT3JVbmRlZmluZWQsXG4gICAgZmxhdHRlbkRlZXAsXG4gICAgbm9vcCxcbiAgICBjYXN0QXJyYXksXG59IGZyb20gJ2xvZGFzaCc7XG5cbmltcG9ydCB7IGdldENhbGxzaXRlRm9yTWV0aG9kIH0gZnJvbSAnLi4vLi4vZXJyb3JzL2dldC1jYWxsc2l0ZSc7XG5pbXBvcnQgQ2xpZW50RnVuY3Rpb25CdWlsZGVyIGZyb20gJy4uLy4uL2NsaWVudC1mdW5jdGlvbnMvY2xpZW50LWZ1bmN0aW9uLWJ1aWxkZXInO1xuaW1wb3J0IEFzc2VydGlvbiBmcm9tICcuL2Fzc2VydGlvbic7XG5pbXBvcnQgeyBnZXREZWxlZ2F0ZWRBUElMaXN0LCBkZWxlZ2F0ZUFQSSB9IGZyb20gJy4uLy4uL3V0aWxzL2RlbGVnYXRlZC1hcGknO1xuaW1wb3J0IGFkZFdhcm5pbmcgZnJvbSAnLi4vLi4vbm90aWZpY2F0aW9ucy9hZGQtcmVuZGVyZWQtd2FybmluZyc7XG5pbXBvcnQgeyBnZXREZXByZWNhdGlvbk1lc3NhZ2UsIERFUFJFQ0FURUQgfSBmcm9tICcuLi8uLi9ub3RpZmljYXRpb25zL2RlcHJlY2F0ZWQnO1xuXG5pbXBvcnQge1xuICAgIENsaWNrQ29tbWFuZCxcbiAgICBSaWdodENsaWNrQ29tbWFuZCxcbiAgICBEb3VibGVDbGlja0NvbW1hbmQsXG4gICAgSG92ZXJDb21tYW5kLFxuICAgIERyYWdDb21tYW5kLFxuICAgIERyYWdUb0VsZW1lbnRDb21tYW5kLFxuICAgIFR5cGVUZXh0Q29tbWFuZCxcbiAgICBTZWxlY3RUZXh0Q29tbWFuZCxcbiAgICBTZWxlY3RUZXh0QXJlYUNvbnRlbnRDb21tYW5kLFxuICAgIFNlbGVjdEVkaXRhYmxlQ29udGVudENvbW1hbmQsXG4gICAgUHJlc3NLZXlDb21tYW5kLFxuICAgIE5hdmlnYXRlVG9Db21tYW5kLFxuICAgIFNldEZpbGVzVG9VcGxvYWRDb21tYW5kLFxuICAgIENsZWFyVXBsb2FkQ29tbWFuZCxcbiAgICBTd2l0Y2hUb0lmcmFtZUNvbW1hbmQsXG4gICAgU3dpdGNoVG9NYWluV2luZG93Q29tbWFuZCxcbiAgICBPcGVuV2luZG93Q29tbWFuZCxcbiAgICBDbG9zZVdpbmRvd0NvbW1hbmQsXG4gICAgR2V0Q3VycmVudFdpbmRvd0NvbW1hbmQsXG4gICAgU3dpdGNoVG9XaW5kb3dDb21tYW5kLFxuICAgIFN3aXRjaFRvV2luZG93QnlQcmVkaWNhdGVDb21tYW5kLFxuICAgIFN3aXRjaFRvUGFyZW50V2luZG93Q29tbWFuZCxcbiAgICBTd2l0Y2hUb1ByZXZpb3VzV2luZG93Q29tbWFuZCxcbiAgICBTZXROYXRpdmVEaWFsb2dIYW5kbGVyQ29tbWFuZCxcbiAgICBHZXROYXRpdmVEaWFsb2dIaXN0b3J5Q29tbWFuZCxcbiAgICBHZXRCcm93c2VyQ29uc29sZU1lc3NhZ2VzQ29tbWFuZCxcbiAgICBTZXRUZXN0U3BlZWRDb21tYW5kLFxuICAgIFNldFBhZ2VMb2FkVGltZW91dENvbW1hbmQsXG4gICAgU2Nyb2xsQ29tbWFuZCxcbiAgICBTY3JvbGxCeUNvbW1hbmQsXG4gICAgU2Nyb2xsSW50b1ZpZXdDb21tYW5kLFxuICAgIFVzZVJvbGVDb21tYW5kLFxuICAgIERpc3BhdGNoRXZlbnRDb21tYW5kLFxuICAgIEdldENvb2tpZXNDb21tYW5kLFxuICAgIFNldENvb2tpZXNDb21tYW5kLFxuICAgIERlbGV0ZUNvb2tpZXNDb21tYW5kLFxuICAgIFJlcXVlc3RDb21tYW5kLFxuICAgIFNraXBKc0Vycm9yc0NvbW1hbmQsXG4gICAgQWRkUmVxdWVzdEhvb2tzQ29tbWFuZCxcbiAgICBSZW1vdmVSZXF1ZXN0SG9va3NDb21tYW5kLFxufSBmcm9tICcuLi8uLi90ZXN0LXJ1bi9jb21tYW5kcy9hY3Rpb25zJztcblxuaW1wb3J0IHtcbiAgICBUYWtlU2NyZWVuc2hvdENvbW1hbmQsXG4gICAgVGFrZUVsZW1lbnRTY3JlZW5zaG90Q29tbWFuZCxcbiAgICBSZXNpemVXaW5kb3dDb21tYW5kLFxuICAgIFJlc2l6ZVdpbmRvd1RvRml0RGV2aWNlQ29tbWFuZCxcbiAgICBNYXhpbWl6ZVdpbmRvd0NvbW1hbmQsXG59IGZyb20gJy4uLy4uL3Rlc3QtcnVuL2NvbW1hbmRzL2Jyb3dzZXItbWFuaXB1bGF0aW9uJztcblxuaW1wb3J0IHsgV2FpdENvbW1hbmQsIERlYnVnQ29tbWFuZCB9IGZyb20gJy4uLy4uL3Rlc3QtcnVuL2NvbW1hbmRzL29ic2VydmF0aW9uJztcbmltcG9ydCB7IGNyZWF0ZUV4ZWN1dGlvbkNvbnRleHQgYXMgY3JlYXRlQ29udGV4dCB9IGZyb20gJy4vZXhlY3V0aW9uLWNvbnRleHQnO1xuaW1wb3J0IHsgaXNTZWxlY3RvciB9IGZyb20gJy4uLy4uL2NsaWVudC1mdW5jdGlvbnMvdHlwZXMnO1xuaW1wb3J0IFRlc3RSdW5Qcm94eSBmcm9tICcuLi8uLi9zZXJ2aWNlcy9jb21waWxlci90ZXN0LXJ1bi1wcm94eSc7XG5cbmltcG9ydCB7XG4gICAgTXVsdGlwbGVXaW5kb3dzTW9kZUlzRGlzYWJsZWRFcnJvcixcbiAgICBNdWx0aXBsZVdpbmRvd3NNb2RlSXNOb3RBdmFpbGFibGVJblJlbW90ZUJyb3dzZXJFcnJvcixcbn0gZnJvbSAnLi4vLi4vZXJyb3JzL3Rlc3QtcnVuJztcblxuaW1wb3J0IHsgQXNzZXJ0aW9uQ29tbWFuZCB9IGZyb20gJy4uLy4uL3Rlc3QtcnVuL2NvbW1hbmRzL2Fzc2VydGlvbic7XG5pbXBvcnQgeyBnZXRDYWxsc2l0ZUlkLCBnZXRDYWxsc2l0ZVN0YWNrRnJhbWVTdHJpbmcgfSBmcm9tICcuLi8uLi91dGlscy9jYWxsc2l0ZSc7XG5pbXBvcnQgUmVFeGVjdXRhYmxlUHJvbWlzZSBmcm9tICcuLi8uLi91dGlscy9yZS1leGVjdXRhYmxlLXByb21pc2UnO1xuaW1wb3J0IHNlbmRSZXF1ZXN0IGZyb20gJy4uLy4uL3Rlc3QtcnVuL3JlcXVlc3Qvc2VuZCc7XG5pbXBvcnQgeyBSZXF1ZXN0UnVudGltZUVycm9yIH0gZnJvbSAnLi4vLi4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IHsgUlVOVElNRV9FUlJPUlMgfSBmcm9tICcuLi8uLi9lcnJvcnMvdHlwZXMnO1xuXG5jb25zdCBvcmlnaW5hbFRoZW4gPSBQcm9taXNlLnJlc29sdmUoKS50aGVuO1xuXG5sZXQgaW5EZWJ1ZyA9IGZhbHNlO1xuXG5mdW5jdGlvbiBkZWxlZ2F0ZWRBUEkgKG1ldGhvZE5hbWUsIGFjY2Vzc29yID0gJycpIHtcbiAgICByZXR1cm4gYF8ke21ldGhvZE5hbWV9JCR7YWNjZXNzb3J9YDtcbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgVGVzdENvbnRyb2xsZXIge1xuICAgIGNvbnN0cnVjdG9yICh0ZXN0UnVuKSB7XG4gICAgICAgIHRoaXMuX2V4ZWN1dGlvbkNvbnRleHQgPSBudWxsO1xuXG4gICAgICAgIHRoaXMudGVzdFJ1biAgICAgICAgPSB0ZXN0UnVuO1xuICAgICAgICB0aGlzLmV4ZWN1dGlvbkNoYWluID0gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICAgIHRoaXMud2FybmluZ0xvZyAgICAgPSB0ZXN0UnVuLndhcm5pbmdMb2c7XG5cbiAgICAgICAgdGhpcy5fYWRkVGVzdENvbnRyb2xsZXJUb0V4ZWN1dGlvbkNoYWluKCk7XG4gICAgfVxuXG4gICAgX2FkZFRlc3RDb250cm9sbGVyVG9FeGVjdXRpb25DaGFpbiAoKSB7XG4gICAgICAgIHRoaXMuZXhlY3V0aW9uQ2hhaW4uX3Rlc3RDb250cm9sbGVyID0gdGhpcztcbiAgICB9XG5cbiAgICAvLyBOT1RFOiBUZXN0Q2FmZSBleGVjdXRlcyBhY3Rpb25zIGFuZCBhc3NlcnRpb25zIGFzeW5jaHJvbm91c2x5IGluIHRoZSBmb2xsb3dpbmcgY2FzZXM6XG4gICAgLy8gYSkgVGhlIGBhd2FpdGAga2V5d29yZCB0aGF0IHByb2NlZWRzIHRoZSBtZXRob2QgZGVjbGFyYXRpb24gdHJpZ2dlcnMgdGhlIGB0aGVuYCBmdW5jdGlvbiBvZiBhIFByb21pc2UuXG4gICAgLy8gYikgVGhlIGFjdGlvbiBpcyBjaGFpbmVkIHRvIGFub3RoZXIgYGF3YWl0ZWRgIG1ldGhvZC5cbiAgICAvL1xuICAgIC8vIEluIG9yZGVyIHRvIHRyYWNrIG1pc3NpbmcgYGF3YWl0YCBzdGF0ZW1lbnRzLCBUZXN0Q2FmZSBleHBvc2VzIGEgc3BlY2lhbCBQcm9taXNlIHRvIHRoZSB1c2VyLlxuICAgIC8vIFdoZW4gVGVzdENhZmUgZGV0ZWN0cyBhIG1pc3NpbmcgYGF3YWl0YCBzdGF0ZW1lbnQsIGl0IGNvbXBhcmVzIHRoZSBtZXRob2QncyBjYWxsc2l0ZSB0byB0aGUgY2FsbCBzaXRlIG9mIHRoZSBleHBvc2VkIFByb21pc2UuXG4gICAgLy8gVGhpcyB3b3JrYXJvdW5kIGlzIG5lY2Vzc2FyeSBmb3Igc2l0dWF0aW9ucyBsaWtlIHRoZXNlOlxuICAgIC8vXG4gICAgLy8gdmFyIHQyID0gdC5jbGljaygnI2J0bjEnKTsgLy8gPC0tIHN0b3JlcyBuZXcgY2FsbHNpdGVXaXRob3V0QXdhaXRcbiAgICAvLyBhd2FpdCB0MjsgICAgICAgICAgICAgICAgICAvLyA8LS0gY2FsbHNpdGVXaXRob3V0QXdhaXQgPSBudWxsXG4gICAgLy8gdC5jbGljaygnI2J0bjInKTsgICAgICAgICAgLy8gPC0tIHN0b3JlcyBuZXcgY2FsbHNpdGVXaXRob3V0QXdhaXRcbiAgICAvLyBhd2FpdCB0Mi5jbGljaygnI2J0bjMnKTsgICAvLyA8LS0gd2l0aG91dCBjaGVjayBpdCB3aWxsIHNldCBjYWxsc2l0ZVdpdGhvdXRBd2FpdCA9IG51bGwsIHNvIHdlIHdpbGwgbG9zdCB0cmFja2luZ1xuICAgIF9jcmVhdGVFeHRlbmRlZFByb21pc2UgKHByb21pc2UsIGNhbGxzaXRlKSB7XG4gICAgICAgIGNvbnN0IGV4dGVuZGVkUHJvbWlzZSAgICAgPSBwcm9taXNlLnRoZW4oaWRlbnRpdHkpO1xuICAgICAgICBjb25zdCBvYnNlcnZlZENhbGxzaXRlcyAgID0gdGhpcy50ZXN0UnVuLm9ic2VydmVkQ2FsbHNpdGVzO1xuICAgICAgICBjb25zdCBtYXJrQ2FsbHNpdGVBd2FpdGVkID0gKCkgPT4gb2JzZXJ2ZWRDYWxsc2l0ZXMuY2FsbHNpdGVzV2l0aG91dEF3YWl0LmRlbGV0ZShjYWxsc2l0ZSk7XG5cbiAgICAgICAgZXh0ZW5kZWRQcm9taXNlLnRoZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBtYXJrQ2FsbHNpdGVBd2FpdGVkKCk7XG5cbiAgICAgICAgICAgIHJldHVybiBvcmlnaW5hbFRoZW4uYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcblxuICAgICAgICBkZWxlZ2F0ZUFQSShleHRlbmRlZFByb21pc2UsIFRlc3RDb250cm9sbGVyLkFQSV9MSVNULCB7XG4gICAgICAgICAgICBoYW5kbGVyOiAgICAgdGhpcyxcbiAgICAgICAgICAgIHByb3h5TWV0aG9kOiBtYXJrQ2FsbHNpdGVBd2FpdGVkLFxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZXh0ZW5kZWRQcm9taXNlO1xuICAgIH1cblxuICAgIF9jcmVhdGVDb21tYW5kIChDbWRDdG9yLCBjbWRBcmdzLCBjYWxsc2l0ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBDbWRDdG9yKGNtZEFyZ3MsIHRoaXMudGVzdFJ1bik7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgZXJyLmNhbGxzaXRlID0gY2FsbHNpdGU7XG5cbiAgICAgICAgICAgIHRocm93IGVycjtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9lbnF1ZXVlVGFzayAoYXBpTWV0aG9kTmFtZSwgY3JlYXRlVGFza0V4ZWN1dG9yLCBjYWxsc2l0ZSkge1xuICAgICAgICBjb25zdCBleGVjdXRvciA9IGNyZWF0ZVRhc2tFeGVjdXRvcigpO1xuXG4gICAgICAgIHRoaXMuZXhlY3V0aW9uQ2hhaW4udGhlbiA9IG9yaWdpbmFsVGhlbjtcbiAgICAgICAgdGhpcy5leGVjdXRpb25DaGFpbiAgICAgID0gdGhpcy5leGVjdXRpb25DaGFpbi50aGVuKGV4ZWN1dG9yKTtcblxuICAgICAgICB0aGlzLnRlc3RSdW4ub2JzZXJ2ZWRDYWxsc2l0ZXMuY2FsbHNpdGVzV2l0aG91dEF3YWl0LmFkZChjYWxsc2l0ZSk7XG5cbiAgICAgICAgdGhpcy5leGVjdXRpb25DaGFpbiA9IHRoaXMuX2NyZWF0ZUV4dGVuZGVkUHJvbWlzZSh0aGlzLmV4ZWN1dGlvbkNoYWluLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgdGhpcy5fYWRkVGVzdENvbnRyb2xsZXJUb0V4ZWN1dGlvbkNoYWluKCk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhlY3V0aW9uQ2hhaW47XG4gICAgfVxuXG4gICAgX2VucXVldWVDb21tYW5kIChDbWRDdG9yLCBjbWRBcmdzLCB2YWxpZGF0ZUNvbW1hbmRGbikge1xuICAgICAgICBjb25zdCBjYWxsc2l0ZSA9IGdldENhbGxzaXRlRm9yTWV0aG9kKENtZEN0b3IubWV0aG9kTmFtZSk7XG4gICAgICAgIGNvbnN0IGNvbW1hbmQgID0gdGhpcy5fY3JlYXRlQ29tbWFuZChDbWRDdG9yLCBjbWRBcmdzLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgaWYgKHR5cGVvZiB2YWxpZGF0ZUNvbW1hbmRGbiA9PT0gJ2Z1bmN0aW9uJylcbiAgICAgICAgICAgIHZhbGlkYXRlQ29tbWFuZEZuKHRoaXMsIGNvbW1hbmQsIGNhbGxzaXRlKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZVRhc2soY29tbWFuZC5tZXRob2ROYW1lLCAoKSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLnRlc3RSdW4uZXhlY3V0ZUNvbW1hbmQoY29tbWFuZCwgY2FsbHNpdGUpXG4gICAgICAgICAgICAgICAgICAgIC5jYXRjaChlcnIgPT4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5leGVjdXRpb25DaGFpbiA9IFByb21pc2UucmVzb2x2ZSgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aHJvdyBlcnI7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfSwgY2FsbHNpdGUpO1xuICAgIH1cblxuICAgIF92YWxpZGF0ZU11bHRpcGxlV2luZG93Q29tbWFuZCAoYXBpTWV0aG9kTmFtZSkge1xuICAgICAgICBjb25zdCB7IGRpc2FibGVNdWx0aXBsZVdpbmRvd3MsIGFjdGl2ZVdpbmRvd0lkIH0gPSB0aGlzLnRlc3RSdW47XG5cbiAgICAgICAgaWYgKGRpc2FibGVNdWx0aXBsZVdpbmRvd3MpXG4gICAgICAgICAgICB0aHJvdyBuZXcgTXVsdGlwbGVXaW5kb3dzTW9kZUlzRGlzYWJsZWRFcnJvcihhcGlNZXRob2ROYW1lKTtcblxuICAgICAgICBpZiAoIWFjdGl2ZVdpbmRvd0lkKVxuICAgICAgICAgICAgdGhyb3cgbmV3IE11bHRpcGxlV2luZG93c01vZGVJc05vdEF2YWlsYWJsZUluUmVtb3RlQnJvd3NlckVycm9yKGFwaU1ldGhvZE5hbWUpO1xuICAgIH1cblxuICAgIGdldEV4ZWN1dGlvbkNvbnRleHQgKCkge1xuICAgICAgICBpZiAoIXRoaXMuX2V4ZWN1dGlvbkNvbnRleHQpXG4gICAgICAgICAgICB0aGlzLl9leGVjdXRpb25Db250ZXh0ID0gY3JlYXRlQ29udGV4dCh0aGlzLnRlc3RSdW4pO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9leGVjdXRpb25Db250ZXh0O1xuICAgIH1cblxuICAgIC8vIEFQSSBpbXBsZW1lbnRhdGlvblxuICAgIC8vIFdlIG5lZWQgaW1wbGVtZW50YXRpb24gbWV0aG9kcyB0byBvYnRhaW4gY29ycmVjdCBjYWxsc2l0ZXMuIElmIHdlIHVzZSBwbGFpbiBBUElcbiAgICAvLyBtZXRob2RzIGluIGNoYWluZWQgd3JhcHBlcnMgdGhlbiB3ZSB3aWxsIGhhdmUgY2FsbHNpdGUgZm9yIHRoZSB3cmFwcGVkIG1ldGhvZFxuICAgIC8vIGluIHRoaXMgZmlsZSBpbnN0ZWFkIG9mIGNoYWluZWQgbWV0aG9kIGNhbGxzaXRlIGluIHVzZXIgY29kZS5cbiAgICBfY3R4JGdldHRlciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLnRlc3RSdW4uY3R4O1xuICAgIH1cblxuICAgIF9jdHgkc2V0dGVyICh2YWwpIHtcbiAgICAgICAgdGhpcy50ZXN0UnVuLmN0eCA9IHZhbDtcblxuICAgICAgICByZXR1cm4gdGhpcy50ZXN0UnVuLmN0eDtcbiAgICB9XG5cbiAgICBfZml4dHVyZUN0eCRnZXR0ZXIgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXN0UnVuLmZpeHR1cmVDdHg7XG4gICAgfVxuXG4gICAgX2Jyb3dzZXIkZ2V0dGVyICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdFJ1bi5icm93c2VyO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoRGlzcGF0Y2hFdmVudENvbW1hbmQubWV0aG9kTmFtZSldIChzZWxlY3RvciwgZXZlbnROYW1lLCBvcHRpb25zID0ge30pIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKERpc3BhdGNoRXZlbnRDb21tYW5kLCB7IHNlbGVjdG9yLCBldmVudE5hbWUsIG9wdGlvbnMsIHJlbGF0ZWRUYXJnZXQ6IG9wdGlvbnMucmVsYXRlZFRhcmdldCB9KTtcbiAgICB9XG5cbiAgICBfcHJlcGFyZUNvb2tpZUFyZ3VtZW50cyAoYXJncywgaXNTZXRDb21tYW5kID0gZmFsc2UpIHtcbiAgICAgICAgY29uc3QgdXJsc0FyZyA9IGNhc3RBcnJheShhcmdzWzFdKTtcbiAgICAgICAgY29uc3QgdXJscyAgICA9IEFycmF5LmlzQXJyYXkodXJsc0FyZykgJiYgdHlwZW9mIHVybHNBcmdbMF0gPT09ICdzdHJpbmcnID8gdXJsc0FyZyA6IFtdO1xuXG4gICAgICAgIGNvbnN0IGNvb2tpZXNBcmcgPSB1cmxzLmxlbmd0aCA/IGFyZ3NbMF0gOiBhcmdzO1xuICAgICAgICBjb25zdCBjb29raWVzICAgID0gW107XG5cbiAgICAgICAgZmxhdHRlbkRlZXAoY2FzdEFycmF5KGNvb2tpZXNBcmcpKS5mb3JFYWNoKGNvb2tpZSA9PiB7XG4gICAgICAgICAgICBpZiAoaXNTZXRDb21tYW5kICYmICFjb29raWUubmFtZSAmJiB0eXBlb2YgY29va2llID09PSAnb2JqZWN0JylcbiAgICAgICAgICAgICAgICBPYmplY3QuZW50cmllcyhjb29raWUpLmZvckVhY2goKFtuYW1lLCB2YWx1ZV0pID0+IGNvb2tpZXMucHVzaCh7IG5hbWUsIHZhbHVlIH0pKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKCFpc1NldENvbW1hbmQgJiYgdHlwZW9mIGNvb2tpZSA9PT0gJ3N0cmluZycpXG4gICAgICAgICAgICAgICAgY29va2llcy5wdXNoKHsgbmFtZTogY29va2llIH0pO1xuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIGNvb2tpZXMucHVzaChjb29raWUpO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4geyB1cmxzLCBjb29raWVzIH07XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShHZXRDb29raWVzQ29tbWFuZC5tZXRob2ROYW1lKV0gKC4uLmFyZ3MpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKEdldENvb2tpZXNDb21tYW5kLCB0aGlzLl9wcmVwYXJlQ29va2llQXJndW1lbnRzKGFyZ3MpKTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFNldENvb2tpZXNDb21tYW5kLm1ldGhvZE5hbWUpXSAoLi4uYXJncykge1xuICAgICAgICBjb25zdCB7IHVybHMsIGNvb2tpZXMgfSA9IHRoaXMuX3ByZXBhcmVDb29raWVBcmd1bWVudHMoYXJncywgdHJ1ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFNldENvb2tpZXNDb21tYW5kLCB7IGNvb2tpZXMsIHVybDogdXJsc1swXSB9KTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKERlbGV0ZUNvb2tpZXNDb21tYW5kLm1ldGhvZE5hbWUpXSAoLi4uYXJncykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoRGVsZXRlQ29va2llc0NvbW1hbmQsIHRoaXMuX3ByZXBhcmVDb29raWVBcmd1bWVudHMoYXJncykpO1xuICAgIH1cblxuICAgIF9wcmVwYXJlUmVxdWVzdEFyZ3VtZW50cyAoYmluZE9wdGlvbnMsIC4uLmFyZ3MpIHtcbiAgICAgICAgY29uc3QgW3VybCwgb3B0aW9uc10gPSB0eXBlb2YgYXJnc1swXSA9PT0gJ29iamVjdCcgPyBbYXJnc1swXS51cmwsIGFyZ3NbMF1dIDogYXJncztcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgdXJsLFxuICAgICAgICAgICAgb3B0aW9uczogT2JqZWN0LmFzc2lnbih7fSwgb3B0aW9ucywgYmluZE9wdGlvbnMpLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIF9jcmVhdGVSZXF1ZXN0RnVuY3Rpb24gKGJpbmRPcHRpb25zID0ge30pIHtcbiAgICAgICAgY29uc3QgY29udHJvbGxlciA9IHRoaXM7XG4gICAgICAgIGNvbnN0IGNhbGxzaXRlID0gZ2V0Q2FsbHNpdGVGb3JNZXRob2QoUmVxdWVzdENvbW1hbmQubWV0aG9kTmFtZSk7XG5cbiAgICAgICAgaWYgKCFjb250cm9sbGVyLnRlc3RSdW4gfHwgY29udHJvbGxlci50ZXN0UnVuIGluc3RhbmNlb2YgVGVzdFJ1blByb3h5KVxuICAgICAgICAgICAgdGhyb3cgbmV3IFJlcXVlc3RSdW50aW1lRXJyb3IoY2FsbHNpdGUsIFJVTlRJTUVfRVJST1JTLnJlcXVlc3RDYW5ub3RSZXNvbHZlVGVzdFJ1bik7XG5cbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uICguLi5hcmdzKSB7XG4gICAgICAgICAgICBjb25zdCBjbWRBcmdzID0gY29udHJvbGxlci5fcHJlcGFyZVJlcXVlc3RBcmd1bWVudHMoYmluZE9wdGlvbnMsIC4uLmFyZ3MpO1xuICAgICAgICAgICAgY29uc3QgY29tbWFuZCA9IGNvbnRyb2xsZXIuX2NyZWF0ZUNvbW1hbmQoUmVxdWVzdENvbW1hbmQsIGNtZEFyZ3MsIGNhbGxzaXRlKTtcblxuICAgICAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICAgICAgICAuLi5jb21tYW5kLm9wdGlvbnMsXG4gICAgICAgICAgICAgICAgdXJsOiBjb21tYW5kLnVybCB8fCBjb21tYW5kLm9wdGlvbnMudXJsIHx8ICcnLFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgY29uc3QgcHJvbWlzZSA9IFJlRXhlY3V0YWJsZVByb21pc2UuZnJvbUZuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gc2VuZFJlcXVlc3QoY29udHJvbGxlci50ZXN0UnVuLCBvcHRpb25zLCBjYWxsc2l0ZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgUmVxdWVzdENvbW1hbmQucmVzdWx0R2V0dGVycy5mb3JFYWNoKGdldHRlciA9PiB7XG4gICAgICAgICAgICAgICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KHByb21pc2UsIGdldHRlciwge1xuICAgICAgICAgICAgICAgICAgICBnZXQ6ICgpID0+IFJlRXhlY3V0YWJsZVByb21pc2UuZnJvbUZuKGFzeW5jICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgc2VuZFJlcXVlc3QoY29udHJvbGxlci50ZXN0UnVuLCBvcHRpb25zLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZVtnZXR0ZXJdO1xuICAgICAgICAgICAgICAgICAgICB9KSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICByZXR1cm4gcHJvbWlzZTtcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBfZGVjb3JhdGVSZXF1ZXN0RnVuY3Rpb24gKGZuKSB7XG4gICAgICAgIFJlcXVlc3RDb21tYW5kLmV4dGVuZGVkTWV0aG9kcy5mb3JFYWNoKG1ldGhvZCA9PiB7XG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoZm4sIG1ldGhvZCwge1xuICAgICAgICAgICAgICAgIHZhbHVlOiB0aGlzLl9jcmVhdGVSZXF1ZXN0RnVuY3Rpb24oeyBtZXRob2QgfSksXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShSZXF1ZXN0Q29tbWFuZC5tZXRob2ROYW1lLCAnZ2V0dGVyJyldICgpIHtcbiAgICAgICAgY29uc3QgZm4gPSB0aGlzLl9jcmVhdGVSZXF1ZXN0RnVuY3Rpb24oKTtcblxuICAgICAgICB0aGlzLl9kZWNvcmF0ZVJlcXVlc3RGdW5jdGlvbihmbik7XG5cbiAgICAgICAgcmV0dXJuIGZuO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoQ2xpY2tDb21tYW5kLm1ldGhvZE5hbWUpXSAoc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKENsaWNrQ29tbWFuZCwgeyBzZWxlY3Rvciwgb3B0aW9ucyB9KTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFJpZ2h0Q2xpY2tDb21tYW5kLm1ldGhvZE5hbWUpXSAoc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFJpZ2h0Q2xpY2tDb21tYW5kLCB7IHNlbGVjdG9yLCBvcHRpb25zIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoRG91YmxlQ2xpY2tDb21tYW5kLm1ldGhvZE5hbWUpXSAoc2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKERvdWJsZUNsaWNrQ29tbWFuZCwgeyBzZWxlY3Rvciwgb3B0aW9ucyB9KTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKEhvdmVyQ29tbWFuZC5tZXRob2ROYW1lKV0gKHNlbGVjdG9yLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChIb3ZlckNvbW1hbmQsIHsgc2VsZWN0b3IsIG9wdGlvbnMgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShEcmFnQ29tbWFuZC5tZXRob2ROYW1lKV0gKHNlbGVjdG9yLCBkcmFnT2Zmc2V0WCwgZHJhZ09mZnNldFksIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKERyYWdDb21tYW5kLCB7IHNlbGVjdG9yLCBkcmFnT2Zmc2V0WCwgZHJhZ09mZnNldFksIG9wdGlvbnMgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShEcmFnVG9FbGVtZW50Q29tbWFuZC5tZXRob2ROYW1lKV0gKHNlbGVjdG9yLCBkZXN0aW5hdGlvblNlbGVjdG9yLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChEcmFnVG9FbGVtZW50Q29tbWFuZCwgeyBzZWxlY3RvciwgZGVzdGluYXRpb25TZWxlY3Rvciwgb3B0aW9ucyB9KTtcbiAgICB9XG5cbiAgICBfZ2V0U2VsZWN0b3JGb3JTY3JvbGwgKGFyZ3MpIHtcbiAgICAgICAgY29uc3Qgc2VsZWN0b3IgPSB0eXBlb2YgYXJnc1swXSA9PT0gJ3N0cmluZycgfHwgaXNTZWxlY3RvcihhcmdzWzBdKSA/IGFyZ3NbMF0gOiBudWxsO1xuXG4gICAgICAgIGlmIChzZWxlY3RvcilcbiAgICAgICAgICAgIGFyZ3Muc2hpZnQoKTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgLy8gTk9URTogaGVyZSB3ZSB1c2UgZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCBmb3Igb2xkIFNhZmFyaSB2ZXJzaW9uc1xuICAgICAgICAgICAgLy8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50IGRvZXMgbm90IHdvcmsgYXMgZXhwZWN0ZWQgb24gTW9qYXZlIFNhZmFyaSAxMi4xLyBIaWdoIFNpZXJyYSBTYWZhcmkgMTEuMVxuICAgICAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXVuZGVmXG4gICAgICAgICAgICByZXR1cm4gKCkgPT4gZG9jdW1lbnQuc2Nyb2xsaW5nRWxlbWVudCB8fCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cbiAgICAgICAgcmV0dXJuIHNlbGVjdG9yO1xuICAgIH1cblxuICAgIF9nZXRQb3NpdGlvbiAoYXJncykge1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IGFyZ3MubGVuZ3RoID09PSAxICYmIHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJyA/IGFyZ3NbMF0gOiBudWxsO1xuXG4gICAgICAgIGlmIChwb3NpdGlvbilcbiAgICAgICAgICAgIGFyZ3Muc2hpZnQoKTtcblxuICAgICAgICByZXR1cm4gcG9zaXRpb247XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShTY3JvbGxDb21tYW5kLm1ldGhvZE5hbWUpXSAoLi4uYXJncykge1xuICAgICAgICBsZXQgcG9zaXRpb24gPSB0aGlzLl9nZXRQb3NpdGlvbihhcmdzKTtcblxuICAgICAgICBjb25zdCBzZWxlY3RvciA9IHRoaXMuX2dldFNlbGVjdG9yRm9yU2Nyb2xsKGFyZ3MpO1xuXG4gICAgICAgIGxldCB4ICAgICAgID0gdm9pZCAwO1xuICAgICAgICBsZXQgeSAgICAgICA9IHZvaWQgMDtcbiAgICAgICAgbGV0IG9wdGlvbnMgPSB2b2lkIDA7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnc3RyaW5nJylcbiAgICAgICAgICAgIFsgcG9zaXRpb24sIG9wdGlvbnMgXSA9IGFyZ3M7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBhcmdzWzBdID09PSAnbnVtYmVyJylcbiAgICAgICAgICAgIFsgeCwgeSwgb3B0aW9ucyBdID0gYXJncztcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU2Nyb2xsQ29tbWFuZCwgeyBzZWxlY3RvciwgeCwgeSwgcG9zaXRpb24sIG9wdGlvbnMgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShTY3JvbGxCeUNvbW1hbmQubWV0aG9kTmFtZSldICguLi5hcmdzKSB7XG4gICAgICAgIGNvbnN0IHNlbGVjdG9yID0gdGhpcy5fZ2V0U2VsZWN0b3JGb3JTY3JvbGwoYXJncyk7XG5cbiAgICAgICAgY29uc3QgW2J5WCwgYnlZLCBvcHRpb25zXSA9IGFyZ3M7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFNjcm9sbEJ5Q29tbWFuZCwgeyBzZWxlY3RvciwgYnlYLCBieVksIG9wdGlvbnMgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShTY3JvbGxJbnRvVmlld0NvbW1hbmQubWV0aG9kTmFtZSldIChzZWxlY3Rvciwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU2Nyb2xsSW50b1ZpZXdDb21tYW5kLCB7IHNlbGVjdG9yLCBvcHRpb25zIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoVHlwZVRleHRDb21tYW5kLm1ldGhvZE5hbWUpXSAoc2VsZWN0b3IsIHRleHQsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFR5cGVUZXh0Q29tbWFuZCwgeyBzZWxlY3RvciwgdGV4dCwgb3B0aW9ucyB9KTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFNlbGVjdFRleHRDb21tYW5kLm1ldGhvZE5hbWUpXSAoc2VsZWN0b3IsIHN0YXJ0UG9zLCBlbmRQb3MsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFNlbGVjdFRleHRDb21tYW5kLCB7IHNlbGVjdG9yLCBzdGFydFBvcywgZW5kUG9zLCBvcHRpb25zIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoU2VsZWN0VGV4dEFyZWFDb250ZW50Q29tbWFuZC5tZXRob2ROYW1lKV0gKHNlbGVjdG9yLCBzdGFydExpbmUsIHN0YXJ0UG9zLCBlbmRMaW5lLCBlbmRQb3MsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFNlbGVjdFRleHRBcmVhQ29udGVudENvbW1hbmQsIHtcbiAgICAgICAgICAgIHNlbGVjdG9yLFxuICAgICAgICAgICAgc3RhcnRMaW5lLFxuICAgICAgICAgICAgc3RhcnRQb3MsXG4gICAgICAgICAgICBlbmRMaW5lLFxuICAgICAgICAgICAgZW5kUG9zLFxuICAgICAgICAgICAgb3B0aW9ucyxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShTZWxlY3RFZGl0YWJsZUNvbnRlbnRDb21tYW5kLm1ldGhvZE5hbWUpXSAoc3RhcnRTZWxlY3RvciwgZW5kU2VsZWN0b3IsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFNlbGVjdEVkaXRhYmxlQ29udGVudENvbW1hbmQsIHtcbiAgICAgICAgICAgIHN0YXJ0U2VsZWN0b3IsXG4gICAgICAgICAgICBlbmRTZWxlY3RvcixcbiAgICAgICAgICAgIG9wdGlvbnMsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoUHJlc3NLZXlDb21tYW5kLm1ldGhvZE5hbWUpXSAoa2V5cywgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoUHJlc3NLZXlDb21tYW5kLCB7IGtleXMsIG9wdGlvbnMgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShXYWl0Q29tbWFuZC5tZXRob2ROYW1lKV0gKHRpbWVvdXQpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFdhaXRDb21tYW5kLCB7IHRpbWVvdXQgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShOYXZpZ2F0ZVRvQ29tbWFuZC5tZXRob2ROYW1lKV0gKHVybCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoTmF2aWdhdGVUb0NvbW1hbmQsIHsgdXJsIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoU2V0RmlsZXNUb1VwbG9hZENvbW1hbmQubWV0aG9kTmFtZSldIChzZWxlY3RvciwgZmlsZVBhdGgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFNldEZpbGVzVG9VcGxvYWRDb21tYW5kLCB7IHNlbGVjdG9yLCBmaWxlUGF0aCB9KTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKENsZWFyVXBsb2FkQ29tbWFuZC5tZXRob2ROYW1lKV0gKHNlbGVjdG9yKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChDbGVhclVwbG9hZENvbW1hbmQsIHsgc2VsZWN0b3IgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShUYWtlU2NyZWVuc2hvdENvbW1hbmQubWV0aG9kTmFtZSldIChvcHRpb25zKSB7XG4gICAgICAgIGlmIChvcHRpb25zICYmIHR5cGVvZiBvcHRpb25zICE9PSAnb2JqZWN0JylcbiAgICAgICAgICAgIG9wdGlvbnMgPSB7IHBhdGg6IG9wdGlvbnMgfTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoVGFrZVNjcmVlbnNob3RDb21tYW5kLCBvcHRpb25zKTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFRha2VFbGVtZW50U2NyZWVuc2hvdENvbW1hbmQubWV0aG9kTmFtZSldIChzZWxlY3RvciwgLi4uYXJncykge1xuICAgICAgICBjb25zdCBjb21tYW5kQXJncyA9IHsgc2VsZWN0b3IgfTtcblxuICAgICAgICBpZiAoYXJnc1sxXSkge1xuICAgICAgICAgICAgY29tbWFuZEFyZ3MucGF0aCAgICA9IGFyZ3NbMF07XG4gICAgICAgICAgICBjb21tYW5kQXJncy5vcHRpb25zID0gYXJnc1sxXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgYXJnc1swXSA9PT0gJ29iamVjdCcpXG4gICAgICAgICAgICBjb21tYW5kQXJncy5vcHRpb25zID0gYXJnc1swXTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgY29tbWFuZEFyZ3MucGF0aCA9IGFyZ3NbMF07XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFRha2VFbGVtZW50U2NyZWVuc2hvdENvbW1hbmQsIGNvbW1hbmRBcmdzKTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFJlc2l6ZVdpbmRvd0NvbW1hbmQubWV0aG9kTmFtZSldICh3aWR0aCwgaGVpZ2h0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChSZXNpemVXaW5kb3dDb21tYW5kLCB7IHdpZHRoLCBoZWlnaHQgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShSZXNpemVXaW5kb3dUb0ZpdERldmljZUNvbW1hbmQubWV0aG9kTmFtZSldIChkZXZpY2UsIG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFJlc2l6ZVdpbmRvd1RvRml0RGV2aWNlQ29tbWFuZCwgeyBkZXZpY2UsIG9wdGlvbnMgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShNYXhpbWl6ZVdpbmRvd0NvbW1hbmQubWV0aG9kTmFtZSldICgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKE1heGltaXplV2luZG93Q29tbWFuZCk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShTd2l0Y2hUb0lmcmFtZUNvbW1hbmQubWV0aG9kTmFtZSldIChzZWxlY3Rvcikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU3dpdGNoVG9JZnJhbWVDb21tYW5kLCB7IHNlbGVjdG9yIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoU3dpdGNoVG9NYWluV2luZG93Q29tbWFuZC5tZXRob2ROYW1lKV0gKCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU3dpdGNoVG9NYWluV2luZG93Q29tbWFuZCk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShPcGVuV2luZG93Q29tbWFuZC5tZXRob2ROYW1lKV0gKHVybCkge1xuICAgICAgICB0aGlzLl92YWxpZGF0ZU11bHRpcGxlV2luZG93Q29tbWFuZChPcGVuV2luZG93Q29tbWFuZC5tZXRob2ROYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoT3BlbldpbmRvd0NvbW1hbmQsIHsgdXJsIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoQ2xvc2VXaW5kb3dDb21tYW5kLm1ldGhvZE5hbWUpXSAod2luZG93KSB7XG4gICAgICAgIGNvbnN0IHdpbmRvd0lkICAgICAgPSB3aW5kb3c/LmlkIHx8IG51bGw7XG5cbiAgICAgICAgdGhpcy5fdmFsaWRhdGVNdWx0aXBsZVdpbmRvd0NvbW1hbmQoQ2xvc2VXaW5kb3dDb21tYW5kLm1ldGhvZE5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChDbG9zZVdpbmRvd0NvbW1hbmQsIHsgd2luZG93SWQgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShHZXRDdXJyZW50V2luZG93Q29tbWFuZC5tZXRob2ROYW1lKV0gKCkge1xuICAgICAgICB0aGlzLl92YWxpZGF0ZU11bHRpcGxlV2luZG93Q29tbWFuZChHZXRDdXJyZW50V2luZG93Q29tbWFuZC5tZXRob2ROYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoR2V0Q3VycmVudFdpbmRvd0NvbW1hbmQpO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoU3dpdGNoVG9XaW5kb3dDb21tYW5kLm1ldGhvZE5hbWUpXSAod2luZG93U2VsZWN0b3IpIHtcbiAgICAgICAgdGhpcy5fdmFsaWRhdGVNdWx0aXBsZVdpbmRvd0NvbW1hbmQoU3dpdGNoVG9XaW5kb3dDb21tYW5kLm1ldGhvZE5hbWUpO1xuXG4gICAgICAgIGxldCBjb21tYW5kO1xuICAgICAgICBsZXQgYXJncztcblxuICAgICAgICBpZiAodHlwZW9mIHdpbmRvd1NlbGVjdG9yID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjb21tYW5kID0gU3dpdGNoVG9XaW5kb3dCeVByZWRpY2F0ZUNvbW1hbmQ7XG5cbiAgICAgICAgICAgIGFyZ3MgPSB7IGNoZWNrV2luZG93OiB3aW5kb3dTZWxlY3RvciB9O1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgY29tbWFuZCA9IFN3aXRjaFRvV2luZG93Q29tbWFuZDtcblxuICAgICAgICAgICAgYXJncyA9IHsgd2luZG93SWQ6IHdpbmRvd1NlbGVjdG9yPy5pZCB9O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKGNvbW1hbmQsIGFyZ3MpO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoU3dpdGNoVG9QYXJlbnRXaW5kb3dDb21tYW5kLm1ldGhvZE5hbWUpXSAoKSB7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlTXVsdGlwbGVXaW5kb3dDb21tYW5kKFN3aXRjaFRvUGFyZW50V2luZG93Q29tbWFuZC5tZXRob2ROYW1lKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU3dpdGNoVG9QYXJlbnRXaW5kb3dDb21tYW5kKTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFN3aXRjaFRvUHJldmlvdXNXaW5kb3dDb21tYW5kLm1ldGhvZE5hbWUpXSAoKSB7XG4gICAgICAgIHRoaXMuX3ZhbGlkYXRlTXVsdGlwbGVXaW5kb3dDb21tYW5kKFN3aXRjaFRvUHJldmlvdXNXaW5kb3dDb21tYW5kLm1ldGhvZE5hbWUpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChTd2l0Y2hUb1ByZXZpb3VzV2luZG93Q29tbWFuZCk7XG4gICAgfVxuXG4gICAgX2V2YWwkIChmbiwgb3B0aW9ucykge1xuICAgICAgICBpZiAoIWlzTnVsbE9yVW5kZWZpbmVkKG9wdGlvbnMpKVxuICAgICAgICAgICAgb3B0aW9ucyA9IGFzc2lnbih7fSwgb3B0aW9ucywgeyBib3VuZFRlc3RSdW46IHRoaXMgfSk7XG5cbiAgICAgICAgY29uc3QgYnVpbGRlciAgPSBuZXcgQ2xpZW50RnVuY3Rpb25CdWlsZGVyKGZuLCBvcHRpb25zLCB7IGluc3RhbnRpYXRpb246ICdldmFsJywgZXhlY3V0aW9uOiAnZXZhbCcgfSk7XG4gICAgICAgIGNvbnN0IGNsaWVudEZuID0gYnVpbGRlci5nZXRGdW5jdGlvbigpO1xuXG4gICAgICAgIHJldHVybiBjbGllbnRGbigpO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoU2V0TmF0aXZlRGlhbG9nSGFuZGxlckNvbW1hbmQubWV0aG9kTmFtZSldIChmbiwgb3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU2V0TmF0aXZlRGlhbG9nSGFuZGxlckNvbW1hbmQsIHtcbiAgICAgICAgICAgIGRpYWxvZ0hhbmRsZXI6IHsgZm4sIG9wdGlvbnMgfSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShHZXROYXRpdmVEaWFsb2dIaXN0b3J5Q29tbWFuZC5tZXRob2ROYW1lKV0gKCkge1xuICAgICAgICBjb25zdCBjYWxsc2l0ZSA9IGdldENhbGxzaXRlRm9yTWV0aG9kKEdldE5hdGl2ZURpYWxvZ0hpc3RvcnlDb21tYW5kLm1ldGhvZE5hbWUpO1xuICAgICAgICBjb25zdCBjb21tYW5kICA9IHRoaXMuX2NyZWF0ZUNvbW1hbmQoR2V0TmF0aXZlRGlhbG9nSGlzdG9yeUNvbW1hbmQsIHt9LCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdFJ1bi5leGVjdXRlQ29tbWFuZChjb21tYW5kLCBjYWxsc2l0ZSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShHZXRCcm93c2VyQ29uc29sZU1lc3NhZ2VzQ29tbWFuZC5tZXRob2ROYW1lKV0gKCkge1xuICAgICAgICBjb25zdCBjYWxsc2l0ZSA9IGdldENhbGxzaXRlRm9yTWV0aG9kKEdldEJyb3dzZXJDb25zb2xlTWVzc2FnZXNDb21tYW5kLm1ldGhvZE5hbWUpO1xuICAgICAgICBjb25zdCBjb21tYW5kICA9IHRoaXMuX2NyZWF0ZUNvbW1hbmQoR2V0QnJvd3NlckNvbnNvbGVNZXNzYWdlc0NvbW1hbmQsIHt9LCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdFJ1bi5leGVjdXRlQ29tbWFuZChjb21tYW5kLCBjYWxsc2l0ZSk7XG4gICAgfVxuXG4gICAgY2hlY2tGb3JFeGNlc3NpdmVBd2FpdHMgKGNoZWNrZWRDYWxsc2l0ZSwgeyBhY3Rpb25JZCB9KSB7XG4gICAgICAgIGNvbnN0IHNuYXBzaG90UHJvcGVydHlDYWxsc2l0ZXMgPSB0aGlzLnRlc3RSdW4ub2JzZXJ2ZWRDYWxsc2l0ZXMuc25hcHNob3RQcm9wZXJ0eUNhbGxzaXRlcztcbiAgICAgICAgY29uc3QgY2FsbHNpdGVJZCAgICAgICAgICAgICAgICA9IGdldENhbGxzaXRlSWQoY2hlY2tlZENhbGxzaXRlKTtcblxuICAgICAgICAvLyBOT1RFOiBJZiB0aGVyZSBhcmUgdW5hc3NlcnRlZCBjYWxsc2l0ZXMsIHdlIHNob3VsZCBhZGQgYWxsIG9mIHRoZW0gdG8gYXdhaXRlZFNuYXBzaG90V2FybmluZ3MuXG4gICAgICAgIC8vIFRoZSB3YXJuaW5ncyB0aGVtc2VsdmVzIGFyZSByYWlzZWQgYWZ0ZXIgdGhlIHRlc3QgcnVuIGluIHdyYXAtdGVzdC1mdW5jdGlvblxuICAgICAgICBpZiAoc25hcHNob3RQcm9wZXJ0eUNhbGxzaXRlc1tjYWxsc2l0ZUlkXSAmJiAhc25hcHNob3RQcm9wZXJ0eUNhbGxzaXRlc1tjYWxsc2l0ZUlkXS5jaGVja2VkKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IHByb3BlcnR5Q2FsbHNpdGUgb2Ygc25hcHNob3RQcm9wZXJ0eUNhbGxzaXRlc1tjYWxsc2l0ZUlkXS5jYWxsc2l0ZXMpXG4gICAgICAgICAgICAgICAgdGhpcy50ZXN0UnVuLm9ic2VydmVkQ2FsbHNpdGVzLmF3YWl0ZWRTbmFwc2hvdFdhcm5pbmdzLnNldChnZXRDYWxsc2l0ZVN0YWNrRnJhbWVTdHJpbmcocHJvcGVydHlDYWxsc2l0ZSksIHsgY2FsbHNpdGU6IHByb3BlcnR5Q2FsbHNpdGUsIGFjdGlvbklkIH0pO1xuXG4gICAgICAgICAgICBkZWxldGUgc25hcHNob3RQcm9wZXJ0eUNhbGxzaXRlc1tjYWxsc2l0ZUlkXTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBzbmFwc2hvdFByb3BlcnR5Q2FsbHNpdGVzW2NhbGxzaXRlSWRdID0geyBjYWxsc2l0ZXM6IFtdLCBjaGVja2VkOiB0cnVlIH07XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShBc3NlcnRpb25Db21tYW5kLm1ldGhvZE5hbWUpXSAoYWN0dWFsKSB7XG4gICAgICAgIGNvbnN0IGNhbGxzaXRlID0gZ2V0Q2FsbHNpdGVGb3JNZXRob2QoQXNzZXJ0aW9uQ29tbWFuZC5tZXRob2ROYW1lKTtcblxuICAgICAgICByZXR1cm4gbmV3IEFzc2VydGlvbihhY3R1YWwsIHRoaXMsIGNhbGxzaXRlKTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKERlYnVnQ29tbWFuZC5tZXRob2ROYW1lKV0gKCkge1xuICAgICAgICAvLyBOT1RFOiBkbyBub3QgbmVlZCB0byBlbnF1ZXVlIHRoZSBEZWJ1ZyBjb21tYW5kIGlmIHdlIGFyZSBpbiBkZWJ1Z2dpbmcgbW9kZS5cbiAgICAgICAgLy8gVGhlIERlYnVnIGNvbW1hbmQgd2lsbCBiZSBleGVjdXRlZCBieSBDRFAuXG4gICAgICAgIC8vIEFsc28sIHdlIGFyZSBmb3JjZWQgdG8gYWRkIGVtcHR5IGZ1bmN0aW9uIHRvIHRoZSBleGVjdXRpb24gY2hhaW4gdG8gcHJlc2VydmUgaXQuXG4gICAgICAgIHJldHVybiB0aGlzLmlzQ29tcGlsZXJTZXJ2aWNlTW9kZSgpID8gdGhpcy5fZW5xdWV1ZVRhc2soRGVidWdDb21tYW5kLm1ldGhvZE5hbWUsIG5vb3ApIDogdGhpcy5fZW5xdWV1ZUNvbW1hbmQoRGVidWdDb21tYW5kKTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFNldFRlc3RTcGVlZENvbW1hbmQubWV0aG9kTmFtZSldIChzcGVlZCkge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU2V0VGVzdFNwZWVkQ29tbWFuZCwgeyBzcGVlZCB9KTtcbiAgICB9XG5cbiAgICBbZGVsZWdhdGVkQVBJKFNldFBhZ2VMb2FkVGltZW91dENvbW1hbmQubWV0aG9kTmFtZSldIChkdXJhdGlvbikge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU2V0UGFnZUxvYWRUaW1lb3V0Q29tbWFuZCwgeyBkdXJhdGlvbiB9LCAodGVzdENvbnRyb2xsZXIsIGNvbW1hbmQpID0+IHtcbiAgICAgICAgICAgIGFkZFdhcm5pbmcodGVzdENvbnRyb2xsZXIud2FybmluZ0xvZywgeyBtZXNzYWdlOiBnZXREZXByZWNhdGlvbk1lc3NhZ2UoREVQUkVDQVRFRC5zZXRQYWdlTG9hZFRpbWVvdXQpLCBhY3Rpb25JZDogY29tbWFuZC5hY3Rpb25JZCB9KTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShVc2VSb2xlQ29tbWFuZC5tZXRob2ROYW1lKV0gKHJvbGUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKFVzZVJvbGVDb21tYW5kLCB7IHJvbGUgfSk7XG4gICAgfVxuXG4gICAgW2RlbGVnYXRlZEFQSShTa2lwSnNFcnJvcnNDb21tYW5kLm1ldGhvZE5hbWUpXSAob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5fZW5xdWV1ZUNvbW1hbmQoU2tpcEpzRXJyb3JzQ29tbWFuZCwgeyBvcHRpb25zIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoQWRkUmVxdWVzdEhvb2tzQ29tbWFuZC5tZXRob2ROYW1lKV0gKC4uLmhvb2tzKSB7XG4gICAgICAgIGhvb2tzID0gZmxhdHRlbkRlZXAoaG9va3MpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChBZGRSZXF1ZXN0SG9va3NDb21tYW5kLCB7IGhvb2tzIH0pO1xuICAgIH1cblxuICAgIFtkZWxlZ2F0ZWRBUEkoUmVtb3ZlUmVxdWVzdEhvb2tzQ29tbWFuZC5tZXRob2ROYW1lKV0gKC4uLmhvb2tzKSB7XG4gICAgICAgIGhvb2tzID0gZmxhdHRlbkRlZXAoaG9va3MpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQ29tbWFuZChSZW1vdmVSZXF1ZXN0SG9va3NDb21tYW5kLCB7IGhvb2tzIH0pO1xuICAgIH1cblxuICAgIHN0YXRpYyBlbmFibGVEZWJ1Z0Zvck5vbkRlYnVnQ29tbWFuZHMgKCkge1xuICAgICAgICBpbkRlYnVnID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBzdGF0aWMgZGlzYWJsZURlYnVnRm9yTm9uRGVidWdDb21tYW5kcyAoKSB7XG4gICAgICAgIGluRGVidWcgPSBmYWxzZTtcbiAgICB9XG5cbiAgICBzaG91bGRTdG9wIChjb21tYW5kKSB7XG4gICAgICAgIC8vIE5PVEU6IHNob3VsZCBuZXZlciBzdG9wIGluIG5vdCBjb21wbGlsZXIgZGVidWdnaW5nIG1vZGVcbiAgICAgICAgaWYgKCF0aGlzLmlzQ29tcGlsZXJTZXJ2aWNlTW9kZSgpKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuXG4gICAgICAgIC8vIE5PVEU6IHNob3VsZCBhbHdheXMgc3RvcCBvbiBEZWJ1ZyBjb21tYW5kXG4gICAgICAgIGlmIChjb21tYW5kID09PSAnZGVidWcnKVxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgLy8gTk9URTogc2hvdWxkIHN0b3Agb24gb3RoZXIgYWN0aW9ucyBhZnRlciB0aGUgYE5leHQgQWN0aW9uYCBidXR0b24gaXMgY2xpY2tlZFxuICAgICAgICBpZiAoaW5EZWJ1Zykge1xuICAgICAgICAgICAgaW5EZWJ1ZyA9IGZhbHNlO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBpc0NvbXBpbGVyU2VydmljZU1vZGUgKCkge1xuICAgICAgICByZXR1cm4gdGhpcy50ZXN0UnVuIGluc3RhbmNlb2YgVGVzdFJ1blByb3h5O1xuICAgIH1cblxufVxuXG5UZXN0Q29udHJvbGxlci5BUElfTElTVCA9IGdldERlbGVnYXRlZEFQSUxpc3QoVGVzdENvbnRyb2xsZXIucHJvdG90eXBlKTtcblxuZGVsZWdhdGVBUEkoVGVzdENvbnRyb2xsZXIucHJvdG90eXBlLCBUZXN0Q29udHJvbGxlci5BUElfTElTVCwgeyB1c2VDdXJyZW50Q3R4QXNIYW5kbGVyOiB0cnVlIH0pO1xuIl19