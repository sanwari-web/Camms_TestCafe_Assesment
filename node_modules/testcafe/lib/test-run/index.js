"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lodash_1 = require("lodash");
const nanoid_1 = require("nanoid");
const read_file_relative_1 = require("read-file-relative");
const promisify_event_1 = __importDefault(require("promisify-event"));
const mustache_1 = __importDefault(require("mustache"));
const async_event_emitter_1 = __importDefault(require("../utils/async-event-emitter"));
const debug_log_1 = __importDefault(require("./debug-log"));
const formattable_adapter_1 = __importDefault(require("../errors/test-run/formattable-adapter"));
const error_list_1 = __importDefault(require("../errors/error-list"));
const runtime_1 = require("../errors/runtime");
const test_run_1 = require("../errors/test-run/");
const client_messages_1 = __importDefault(require("./client-messages"));
const type_1 = __importDefault(require("./commands/type"));
const delay_1 = __importDefault(require("../utils/delay"));
const is_password_input_1 = __importDefault(require("../utils/is-password-input"));
const marker_symbol_1 = __importDefault(require("./marker-symbol"));
const test_run_tracker_1 = __importDefault(require("../api/test-run-tracker"));
const phase_1 = __importDefault(require("../role/phase"));
const plugin_host_1 = __importDefault(require("../reporter/plugin-host"));
const browser_console_messages_1 = __importDefault(require("./browser-console-messages"));
const warning_log_1 = __importDefault(require("../notifications/warning-log"));
const warning_message_1 = __importDefault(require("../notifications/warning-message"));
const testcafe_hammerhead_1 = require("testcafe-hammerhead");
const INJECTABLES = __importStar(require("../assets/injectables"));
const utils_1 = require("../custom-client-scripts/utils");
const get_url_1 = __importDefault(require("../custom-client-scripts/get-url"));
const string_1 = require("../utils/string");
const utils_2 = require("./commands/utils");
const actions_1 = require("./commands/actions");
const types_1 = require("../errors/types");
const process_test_fn_error_1 = __importDefault(require("../errors/process-test-fn-error"));
const hook_method_names_1 = __importDefault(require("../api/request-hooks/hook-method-names"));
const replicator_1 = require("../client-functions/replicator");
const session_controller_1 = __importDefault(require("./session-controller"));
const browser_manipulation_queue_1 = __importDefault(require("./browser-manipulation-queue"));
const observed_callsites_storage_1 = __importDefault(require("./observed-callsites-storage"));
const base_js_1 = require("./commands/base.js");
const get_assertion_timeout_1 = __importDefault(require("../utils/get-options/get-assertion-timeout"));
const phase_2 = __importDefault(require("./phase"));
const observation_1 = require("./commands/observation");
const marker_1 = require("../services/serialization/replicator/transforms/re-executable-promise-transform/marker");
const re_executable_promise_1 = __importDefault(require("../utils/re-executable-promise"));
const add_rendered_warning_1 = __importDefault(require("../notifications/add-rendered-warning"));
const get_browser_1 = __importDefault(require("../utils/get-browser"));
const executor_1 = __importDefault(require("../assertions/executor"));
const async_filter_1 = __importDefault(require("../utils/async-filter"));
const execute_fn_with_timeout_1 = __importDefault(require("../utils/execute-fn-with-timeout"));
const url_1 = require("url");
const skip_js_errors_1 = require("../api/skip-js-errors");
const factory_1 = require("./cookies/factory");
const lazyRequire = require('import-lazy')(require);
const ClientFunctionBuilder = lazyRequire('../client-functions/client-function-builder');
const TestRunBookmark = lazyRequire('./bookmark');
const actionCommands = lazyRequire('./commands/actions');
const browserManipulationCommands = lazyRequire('./commands/browser-manipulation');
const serviceCommands = lazyRequire('./commands/service');
const observationCommands = lazyRequire('./commands/observation');
const { executeJsExpression, executeAsyncJsExpression } = lazyRequire('./execute-js-expression');
const TEST_RUN_TEMPLATE = (0, read_file_relative_1.readSync)('../client/test-run/index.js.mustache');
const IFRAME_TEST_RUN_TEMPLATE = (0, read_file_relative_1.readSync)('../client/test-run/iframe.js.mustache');
const TEST_DONE_CONFIRMATION_RESPONSE = 'test-done-confirmation';
const MAX_RESPONSE_DELAY = 3000;
const CHILD_WINDOW_READY_TIMEOUT = 30 * 1000;
const ALL_DRIVER_TASKS_ADDED_TO_QUEUE_EVENT = 'all-driver-tasks-added-to-queue';
const COMPILER_SERVICE_EVENTS = [
    'setMock',
    'setConfigureResponseEventOptions',
    'setHeaderOnConfigureResponseEvent',
    'removeHeaderOnConfigureResponseEvent',
];
class TestRun extends async_event_emitter_1.default {
    constructor({ test, browserConnection, screenshotCapturer, globalWarningLog, opts, compilerService, messageBus, startRunExecutionTime }) {
        super();
        this._clientEnvironmentPrepared = false;
        this[marker_symbol_1.default] = true;
        this._messageBus = messageBus;
        this.warningLog = new warning_log_1.default(globalWarningLog, warning_log_1.default.createAddWarningCallback(messageBus, this));
        this.opts = opts;
        this.test = test;
        this.browserConnection = browserConnection;
        this.unstable = false;
        this.browser = (0, get_browser_1.default)(browserConnection);
        this.phase = phase_2.default.initial;
        this.driverTaskQueue = [];
        this.testDoneCommandQueued = false;
        this.activeDialogHandler = null;
        this.activeIframeSelector = null;
        this.speed = this.opts.speed;
        this.pageLoadTimeout = this._getPageLoadTimeout(test, opts);
        this.testExecutionTimeout = this._getTestExecutionTimeout(opts);
        this.disablePageReloads = test.disablePageReloads || opts.disablePageReloads && test.disablePageReloads !== false;
        this.disablePageCaching = test.disablePageCaching || opts.disablePageCaching;
        this.disableMultipleWindows = opts.disableMultipleWindows;
        this.requestTimeout = this._getRequestTimeout(test, opts);
        this.session = session_controller_1.default.getSession(this);
        this.consoleMessages = new browser_console_messages_1.default();
        this.pendingRequest = null;
        this.pendingPageError = null;
        this.controller = null;
        this.ctx = Object.create(null);
        this.fixtureCtx = null;
        this.testRunCtx = null;
        this.currentRoleId = null;
        this.usedRoleStates = Object.create(null);
        this.errs = [];
        this.lastDriverStatusId = null;
        this.lastDriverStatusResponse = null;
        this.fileDownloadingHandled = false;
        this.resolveWaitForFileDownloadingPromise = null;
        this.attachmentDownloadingHandled = false;
        this.addingDriverTasksCount = 0;
        this.debugging = this.opts.debugMode;
        this.debugOnFail = this.opts.debugOnFail;
        this.disableDebugBreakpoints = false;
        this.debugReporterPluginHost = new plugin_host_1.default({ noColors: false });
        this.browserManipulationQueue = new browser_manipulation_queue_1.default(browserConnection, screenshotCapturer, this.warningLog);
        this.debugLog = new debug_log_1.default(this.browserConnection.userAgent);
        this.quarantine = null;
        this.debugLogger = this.opts.debugLogger;
        this.observedCallsites = new observed_callsites_storage_1.default();
        this.compilerService = compilerService;
        this.asyncJsExpressionCallsites = new Map();
        this.replicator = (0, replicator_1.createReplicator)([new replicator_1.SelectorNodeTransform()]);
        this.disconnected = false;
        this.errScreenshotPath = null;
        this.startRunExecutionTime = startRunExecutionTime;
        this.runExecutionTimeout = this._getRunExecutionTimeout(opts);
        this._requestHookEventProvider = this._getRequestHookEventProvider();
        this._cookieProvider = factory_1.CookieProviderFactory.create(this, this.opts.proxyless);
        this._addInjectables();
    }
    _getRequestHookEventProvider() {
        if (!this.opts.proxyless)
            return this.session.requestHookEventProvider;
        const runtimeInfo = this.browserConnection.provider.plugin.openedBrowsers[this.browserConnection.id];
        return runtimeInfo.proxyless.requestPipeline.requestHookEventProvider;
    }
    _getPageLoadTimeout(test, opts) {
        var _a;
        if (((_a = test.timeouts) === null || _a === void 0 ? void 0 : _a.pageLoadTimeout) !== void 0)
            return test.timeouts.pageLoadTimeout;
        return opts.pageLoadTimeout;
    }
    _getRequestTimeout(test, opts) {
        var _a, _b;
        return {
            page: ((_a = test.timeouts) === null || _a === void 0 ? void 0 : _a.pageRequestTimeout) || opts.pageRequestTimeout,
            ajax: ((_b = test.timeouts) === null || _b === void 0 ? void 0 : _b.ajaxRequestTimeout) || opts.ajaxRequestTimeout,
        };
    }
    _getExecutionTimeout(timeout, error) {
        return {
            timeout,
            rejectWith: error,
        };
    }
    _getTestExecutionTimeout(opts) {
        const testExecutionTimeout = opts.testExecutionTimeout || 0;
        if (!testExecutionTimeout)
            return null;
        return this._getExecutionTimeout(testExecutionTimeout, new test_run_1.TestTimeoutError(testExecutionTimeout));
    }
    _getRunExecutionTimeout(opts) {
        const runExecutionTimeout = opts.runExecutionTimeout || 0;
        if (!runExecutionTimeout)
            return null;
        return this._getExecutionTimeout(runExecutionTimeout, new test_run_1.RunTimeoutError(runExecutionTimeout));
    }
    get restRunExecutionTimeout() {
        if (!this.startRunExecutionTime || !this.runExecutionTimeout)
            return null;
        const currentTimeout = Math.max(this.runExecutionTimeout.timeout - (Date.now() - this.startRunExecutionTime.getTime()), 0);
        return this._getExecutionTimeout(currentTimeout, this.runExecutionTimeout.rejectWith);
    }
    get executionTimeout() {
        return this.restRunExecutionTimeout && (!this.testExecutionTimeout || this.restRunExecutionTimeout.timeout < this.testExecutionTimeout.timeout)
            ? this.restRunExecutionTimeout
            : this.testExecutionTimeout || null;
    }
    _addClientScriptContentWarningsIfNecessary() {
        const { empty, duplicatedContent } = (0, utils_1.findProblematicScripts)(this.test.clientScripts);
        if (empty.length)
            this.warningLog.addWarning(warning_message_1.default.clientScriptsWithEmptyContent);
        if (duplicatedContent.length) {
            const suffix = (0, string_1.getPluralSuffix)(duplicatedContent);
            const duplicatedContentClientScriptsStr = (0, string_1.getConcatenatedValuesString)(duplicatedContent, '\n');
            this.warningLog.addWarning(warning_message_1.default.clientScriptsWithDuplicatedContent, suffix, duplicatedContentClientScriptsStr);
        }
    }
    _addInjectables() {
        this._addClientScriptContentWarningsIfNecessary();
        this.injectable.scripts.push(...INJECTABLES.SCRIPTS);
        this.injectable.userScripts.push(...this.test.clientScripts.map(script => {
            return {
                url: (0, get_url_1.default)(script),
                page: script.page,
            };
        }));
        this.injectable.styles.push(INJECTABLES.TESTCAFE_UI_STYLES);
    }
    get id() {
        return this.session.id;
    }
    get injectable() {
        return this.session.injectable;
    }
    addQuarantineInfo(quarantine) {
        this.quarantine = quarantine;
    }
    async _addRequestHook(hook) {
        if (this.test.requestHooks.includes(hook))
            return;
        this.test.requestHooks.push(hook);
        await this._initRequestHook(hook);
    }
    async _removeRequestHook(hook) {
        if (!this.test.requestHooks.includes(hook))
            return;
        (0, lodash_1.pull)(this.test.requestHooks, hook);
        await this._disposeRequestHook(hook);
    }
    async _initRequestHook(hook) {
        hook._warningLog = this.warningLog;
        await Promise.all(hook._requestFilterRules.map(rule => {
            return this._requestHookEventProvider.addRequestEventListeners(rule, {
                onRequest: hook.onRequest.bind(hook),
                onConfigureResponse: hook._onConfigureResponse.bind(hook),
                onResponse: hook.onResponse.bind(hook),
            }, (err) => this._onRequestHookMethodError(err, hook._className));
        }));
    }
    async _initRequestHookForCompilerService(hookId, hookClassName, rules) {
        const testId = this.test.id;
        await Promise.all(rules.map(rule => {
            return this._requestHookEventProvider.addRequestEventListeners(rule, {
                onRequest: (event) => { var _a; return (_a = this.compilerService) === null || _a === void 0 ? void 0 : _a.onRequestHookEvent({ testId, hookId, name: hook_method_names_1.default.onRequest, eventData: event }); },
                onConfigureResponse: (event) => { var _a; return (_a = this.compilerService) === null || _a === void 0 ? void 0 : _a.onRequestHookEvent({ testId, hookId, name: hook_method_names_1.default._onConfigureResponse, eventData: event }); },
                onResponse: (event) => { var _a; return (_a = this.compilerService) === null || _a === void 0 ? void 0 : _a.onRequestHookEvent({ testId, hookId, name: hook_method_names_1.default.onResponse, eventData: event }); },
            }, err => this._onRequestHookMethodError(err, hookClassName));
        }));
    }
    _onRequestHookMethodError(event, hookClassName) {
        let err = event.error;
        const isRequestHookNotImplementedMethodError = (err === null || err === void 0 ? void 0 : err.code) === types_1.TEST_RUN_ERRORS.requestHookNotImplementedError;
        if (!isRequestHookNotImplementedMethodError)
            err = new test_run_1.RequestHookUnhandledError(err, hookClassName, event.methodName);
        this.addError(err);
    }
    async _disposeRequestHook(hook) {
        hook._warningLog = null;
        await Promise.all(hook._requestFilterRules.map(rule => {
            return this._requestHookEventProvider.removeRequestEventListeners(rule);
        }));
    }
    async _detachRequestEventListeners(rules) {
        await Promise.all(rules.map(rule => {
            return this._requestHookEventProvider.removeRequestEventListeners(rule);
        }));
    }
    _subscribeOnCompilerServiceEvents() {
        COMPILER_SERVICE_EVENTS.forEach(eventName => {
            if (this.compilerService) {
                this.compilerService.on(eventName, async (args) => {
                    // @ts-ignore
                    await this.session[eventName](...args);
                });
            }
        });
        if (this.compilerService) {
            this.compilerService.on('addRequestEventListeners', async ({ hookId, hookClassName, rules }) => {
                await this._initRequestHookForCompilerService(hookId, hookClassName, rules);
            });
            this.compilerService.on('removeRequestEventListeners', async ({ rules }) => {
                await this._detachRequestEventListeners(rules);
            });
        }
    }
    async _initRequestHooks() {
        if (this.compilerService) {
            this._subscribeOnCompilerServiceEvents();
            await Promise.all(this.test.requestHooks.map(hook => {
                return this._initRequestHookForCompilerService(hook.id, hook._className, hook._requestFilterRules);
            }));
        }
        else
            await Promise.all(this.test.requestHooks.map(hook => this._initRequestHook(hook)));
    }
    _prepareSkipJsErrorsOption() {
        const options = this.test.skipJsErrorsOptions !== void 0
            ? this.test.skipJsErrorsOptions
            : this.opts.skipJsErrors || false;
        return (0, skip_js_errors_1.prepareSkipJsErrorsOptions)(options);
    }
    // Hammerhead payload
    async getPayloadScript() {
        this.fileDownloadingHandled = false;
        this.resolveWaitForFileDownloadingPromise = null;
        const skipJsErrors = this._prepareSkipJsErrorsOption();
        return mustache_1.default.render(TEST_RUN_TEMPLATE, {
            testRunId: JSON.stringify(this.session.id),
            browserId: JSON.stringify(this.browserConnection.id),
            browserHeartbeatRelativeUrl: JSON.stringify(this.browserConnection.heartbeatRelativeUrl),
            browserStatusRelativeUrl: JSON.stringify(this.browserConnection.statusRelativeUrl),
            browserStatusDoneRelativeUrl: JSON.stringify(this.browserConnection.statusDoneRelativeUrl),
            browserIdleRelativeUrl: JSON.stringify(this.browserConnection.idleRelativeUrl),
            browserActiveWindowIdUrl: JSON.stringify(this.browserConnection.activeWindowIdUrl),
            browserCloseWindowUrl: JSON.stringify(this.browserConnection.closeWindowUrl),
            browserOpenFileProtocolRelativeUrl: JSON.stringify(this.browserConnection.openFileProtocolRelativeUrl),
            userAgent: JSON.stringify(this.browserConnection.userAgent),
            testName: JSON.stringify(this.test.name),
            fixtureName: JSON.stringify(this.test.fixture.name),
            selectorTimeout: this.opts.selectorTimeout,
            pageLoadTimeout: this.pageLoadTimeout,
            childWindowReadyTimeout: CHILD_WINDOW_READY_TIMEOUT,
            skipJsErrors: JSON.stringify(skipJsErrors),
            retryTestPages: this.opts.retryTestPages,
            speed: this.speed,
            dialogHandler: JSON.stringify(this.activeDialogHandler),
            canUseDefaultWindowActions: JSON.stringify(await this.browserConnection.canUseDefaultWindowActions()),
            proxyless: JSON.stringify(this.opts.proxyless),
            domain: JSON.stringify(this.browserConnection.browserConnectionGateway.proxy.server1Info.domain),
        });
    }
    async getIframePayloadScript() {
        return mustache_1.default.render(IFRAME_TEST_RUN_TEMPLATE, {
            testRunId: JSON.stringify(this.session.id),
            selectorTimeout: this.opts.selectorTimeout,
            pageLoadTimeout: this.pageLoadTimeout,
            retryTestPages: !!this.opts.retryTestPages,
            speed: this.speed,
            dialogHandler: JSON.stringify(this.activeDialogHandler),
        });
    }
    // Hammerhead handlers
    getAuthCredentials() {
        return this.test.authCredentials;
    }
    handleFileDownload() {
        if (this.resolveWaitForFileDownloadingPromise) {
            this.resolveWaitForFileDownloadingPromise(true);
            this.resolveWaitForFileDownloadingPromise = null;
        }
        else
            this.fileDownloadingHandled = true;
    }
    handleAttachment(data) {
        if (data.isOpenedInNewWindow)
            this.attachmentDownloadingHandled = true;
    }
    handlePageError(ctx, err) {
        this.pendingPageError = new test_run_1.PageLoadError(err, ctx.reqOpts.url);
        ctx.redirect(ctx.toProxyUrl(testcafe_hammerhead_1.SPECIAL_ERROR_PAGE));
    }
    // Test function execution
    async _executeTestFn(phase, fn, timeout) {
        this.phase = phase;
        try {
            await (0, execute_fn_with_timeout_1.default)(fn, timeout, this);
        }
        catch (err) {
            await this._makeScreenshotOnFail();
            this.addError(err);
            return false;
        }
        finally {
            this.errScreenshotPath = null;
        }
        return !this._addPendingPageErrorIfAny();
    }
    async _runBeforeHook() {
        var _a, _b;
        if (this.test.globalBeforeFn)
            await this._executeTestFn(phase_2.default.inTestBeforeHook, this.test.globalBeforeFn, this.executionTimeout);
        if (this.test.beforeFn)
            return await this._executeTestFn(phase_2.default.inTestBeforeHook, this.test.beforeFn, this.executionTimeout);
        if ((_a = this.test.fixture) === null || _a === void 0 ? void 0 : _a.beforeEachFn)
            return await this._executeTestFn(phase_2.default.inFixtureBeforeEachHook, (_b = this.test.fixture) === null || _b === void 0 ? void 0 : _b.beforeEachFn, this.executionTimeout);
        return true;
    }
    async _runAfterHook() {
        var _a, _b;
        if (this.test.afterFn)
            await this._executeTestFn(phase_2.default.inTestAfterHook, this.test.afterFn, this.executionTimeout);
        else if ((_a = this.test.fixture) === null || _a === void 0 ? void 0 : _a.afterEachFn)
            await this._executeTestFn(phase_2.default.inFixtureAfterEachHook, (_b = this.test.fixture) === null || _b === void 0 ? void 0 : _b.afterEachFn, this.executionTimeout);
        if (this.test.globalAfterFn)
            await this._executeTestFn(phase_2.default.inTestAfterHook, this.test.globalAfterFn, this.executionTimeout);
    }
    async _finalizeTestRun(id) {
        if (this.compilerService) {
            const warnings = await this.compilerService.getWarningMessages({ testRunId: id });
            warnings.forEach(warning => {
                this.warningLog.addWarning(warning);
            });
            await this.compilerService.removeTestRunFromState({ testRunId: id });
        }
        test_run_tracker_1.default.removeActiveTestRun(id);
    }
    async start() {
        test_run_tracker_1.default.addActiveTestRun(this);
        await this.emit('start');
        const onDisconnected = (err) => this._disconnect(err);
        this.browserConnection.once('disconnected', onDisconnected);
        await this.once('connected');
        await this.emit('ready');
        if (await this._runBeforeHook()) {
            await this._executeTestFn(phase_2.default.inTest, this.test.fn, this.executionTimeout);
            await this._runAfterHook();
        }
        if (this.disconnected)
            return;
        this.phase = phase_2.default.pendingFinalization;
        this.browserConnection.removeListener('disconnected', onDisconnected);
        if (this.errs.length && this.debugOnFail) {
            const errStr = this.debugReporterPluginHost.formatError(this.errs[0]);
            await this._enqueueSetBreakpointCommand(void 0, errStr);
        }
        await this.emit('before-done');
        await this._internalExecuteCommand(new serviceCommands.TestDoneCommand());
        this._addPendingPageErrorIfAny();
        this._requestHookEventProvider.clearRequestEventListeners();
        this.normalizeRequestHookErrors();
        await this._finalizeTestRun(this.session.id);
        await this.emit('done');
    }
    // Errors
    _addPendingPageErrorIfAny() {
        if (this.pendingPageError) {
            this.addError(this.pendingPageError);
            this.pendingPageError = null;
            return true;
        }
        return false;
    }
    _ensureErrorId(err) {
        // @ts-ignore
        err.id = err.id || (0, nanoid_1.nanoid)(7);
    }
    _createErrorAdapter(err) {
        this._ensureErrorId(err);
        return new formattable_adapter_1.default(err, {
            userAgent: this.browserConnection.userAgent,
            screenshotPath: this.errScreenshotPath || '',
            testRunId: this.id,
            testRunPhase: this.phase,
        });
    }
    addError(err) {
        const errList = (err instanceof error_list_1.default ? err.items : [err]);
        errList.forEach(item => {
            const adapter = this._createErrorAdapter(item);
            this.errs.push(adapter);
        });
    }
    normalizeRequestHookErrors() {
        const requestHookErrors = (0, lodash_1.remove)(this.errs, e => e.code === types_1.TEST_RUN_ERRORS.requestHookNotImplementedError ||
            e.code === types_1.TEST_RUN_ERRORS.requestHookUnhandledError);
        if (!requestHookErrors.length)
            return;
        const uniqRequestHookErrors = (0, lodash_1.chain)(requestHookErrors)
            .uniqBy(e => {
            const err = e;
            return err.hookClassName + err.methodName;
        })
            .sortBy(['hookClassName', 'methodName'])
            .value();
        this.errs = this.errs.concat(uniqRequestHookErrors);
    }
    // Task queue
    _enqueueCommand(command, callsite) {
        if (this.pendingRequest)
            this._resolvePendingRequest(command);
        return new Promise(async (resolve, reject) => {
            this.addingDriverTasksCount--;
            this.driverTaskQueue.push({ command, resolve, reject, callsite });
            if (!this.addingDriverTasksCount)
                await this.emit(ALL_DRIVER_TASKS_ADDED_TO_QUEUE_EVENT, this.driverTaskQueue.length);
        });
    }
    get driverTaskQueueLength() {
        return this.addingDriverTasksCount ? (0, promisify_event_1.default)(this, ALL_DRIVER_TASKS_ADDED_TO_QUEUE_EVENT) : Promise.resolve(this.driverTaskQueue.length);
    }
    async _enqueueBrowserConsoleMessagesCommand(command, callsite) {
        await this._enqueueCommand(command, callsite);
        const consoleMessageCopy = this.consoleMessages.getCopy();
        // @ts-ignore
        return consoleMessageCopy[String(this.activeWindowId)];
    }
    async _enqueueGetCookies(command) {
        const { cookies, urls } = command;
        return this._cookieProvider.getCookies(cookies, urls);
    }
    async _enqueueSetCookies(command) {
        const cookies = command.cookies;
        const url = command.url || await this.getCurrentUrl();
        return this._cookieProvider.setCookies(cookies, url);
    }
    async _enqueueDeleteCookies(command) {
        const { cookies, urls } = command;
        return this._cookieProvider.deleteCookies(cookies, urls);
    }
    async _enqueueSetBreakpointCommand(callsite, error) {
        if (this.debugLogger)
            this.debugLogger.showBreakpoint(this.session.id, this.browserConnection.userAgent, callsite, error);
        this.debugging = await this._internalExecuteCommand(new serviceCommands.SetBreakpointCommand(!!error, !!this.compilerService), callsite);
    }
    _removeAllNonServiceTasks() {
        this.driverTaskQueue = this.driverTaskQueue.filter(driverTask => (0, utils_2.isServiceCommand)(driverTask.command));
        this.browserManipulationQueue.removeAllNonServiceManipulations();
    }
    _handleDebugState(driverStatus) {
        if (driverStatus.debug)
            this.emit(driverStatus.debug);
    }
    // Current driver task
    get currentDriverTask() {
        return this.driverTaskQueue[0];
    }
    _resolveCurrentDriverTask(result) {
        this.currentDriverTask.resolve(result);
        this.driverTaskQueue.shift();
        if (this.testDoneCommandQueued)
            this._removeAllNonServiceTasks();
    }
    _rejectCurrentDriverTask(err) {
        // @ts-ignore
        err.callsite = err.callsite || this.currentDriverTask.callsite;
        this.currentDriverTask.reject(err);
        this._removeAllNonServiceTasks();
    }
    // Pending request
    _clearPendingRequest() {
        if (this.pendingRequest) {
            clearTimeout(this.pendingRequest.responseTimeout);
            this.pendingRequest = null;
        }
    }
    _resolvePendingRequest(command) {
        this.lastDriverStatusResponse = command;
        if (this.pendingRequest)
            this.pendingRequest.resolve(command);
        this._clearPendingRequest();
    }
    // Handle driver request
    _shouldResolveCurrentDriverTask(driverStatus) {
        const currentCommand = this.currentDriverTask.command;
        const isExecutingObservationCommand = currentCommand instanceof observationCommands.ExecuteSelectorCommand ||
            currentCommand instanceof observation_1.ExecuteClientFunctionCommand;
        const isDebugActive = currentCommand instanceof serviceCommands.SetBreakpointCommand;
        const shouldExecuteCurrentCommand = driverStatus.isFirstRequestAfterWindowSwitching && (isExecutingObservationCommand || isDebugActive);
        return !shouldExecuteCurrentCommand;
    }
    _fulfillCurrentDriverTask(driverStatus) {
        var _a;
        if (!this.currentDriverTask)
            return;
        if ((_a = driverStatus.warnings) === null || _a === void 0 ? void 0 : _a.length) {
            driverStatus.warnings.forEach((warning) => {
                this.warningLog.addWarning(warning_message_1.default[warning.type], ...warning.args);
            });
        }
        if (driverStatus.executionError)
            this._rejectCurrentDriverTask(driverStatus.executionError);
        else if (this._shouldResolveCurrentDriverTask(driverStatus))
            this._resolveCurrentDriverTask(driverStatus.result);
    }
    _handlePageErrorStatus(pageError) {
        if (this.currentDriverTask && (0, utils_2.isCommandRejectableByPageError)(this.currentDriverTask.command)) {
            this._rejectCurrentDriverTask(pageError);
            this.pendingPageError = null;
            return true;
        }
        this.pendingPageError = this.pendingPageError || pageError;
        return false;
    }
    _handleDriverRequest(driverStatus) {
        const isTestDone = this.currentDriverTask && this.currentDriverTask.command.type ===
            type_1.default.testDone;
        const pageError = this.pendingPageError || driverStatus.pageError;
        const currentTaskRejectedByError = pageError && this._handlePageErrorStatus(pageError);
        this.consoleMessages.concat(driverStatus.consoleMessages);
        this._handleDebugState(driverStatus);
        if (!currentTaskRejectedByError && driverStatus.isCommandResult) {
            if (isTestDone) {
                this._resolveCurrentDriverTask();
                return TEST_DONE_CONFIRMATION_RESPONSE;
            }
            this._fulfillCurrentDriverTask(driverStatus);
            if (driverStatus.isPendingWindowSwitching)
                return null;
        }
        return this._getCurrentDriverTaskCommand();
    }
    _getCurrentDriverTaskCommand() {
        if (!this.currentDriverTask)
            return null;
        const command = this.currentDriverTask.command;
        if (command.type === type_1.default.navigateTo && command.stateSnapshot)
            this.session.useStateSnapshot(JSON.parse(command.stateSnapshot));
        return command;
    }
    // Execute command
    async _executeJsExpression(command) {
        const resultVariableName = command.resultVariableName;
        let expression = command.expression;
        if (resultVariableName)
            expression = `${resultVariableName} = ${expression}, ${resultVariableName}`;
        if (this.compilerService) {
            return this.compilerService.executeJsExpression({
                expression,
                testRunId: this.id,
                options: { skipVisibilityCheck: false },
            });
        }
        return executeJsExpression(expression, this, { skipVisibilityCheck: false });
    }
    async _executeAsyncJsExpression(command, callsite) {
        if (this.compilerService) {
            this.asyncJsExpressionCallsites.clear();
            return this.compilerService.executeAsyncJsExpression({
                expression: command.expression,
                testRunId: this.id,
                callsite,
            });
        }
        return executeAsyncJsExpression(command.expression, this, callsite);
    }
    _redirectReExecutablePromiseExecutionToCompilerService(command) {
        if (!this.compilerService)
            return;
        const self = this;
        command.actual = re_executable_promise_1.default.fromFn(async () => {
            var _a;
            return (_a = self.compilerService) === null || _a === void 0 ? void 0 : _a.getAssertionActualValue({
                testRunId: self.id,
                commandId: command.id,
            });
        });
    }
    _redirectAssertionFnExecutionToCompilerService(executor) {
        executor.fn = () => {
            var _a;
            return (_a = this.compilerService) === null || _a === void 0 ? void 0 : _a.executeAssertionFn({
                testRunId: this.id,
                commandId: executor.command.id,
            });
        };
    }
    async _executeAssertion(command, callsite) {
        if (command.actual === Symbol.for(marker_1.RE_EXECUTABLE_PROMISE_MARKER_DESCRIPTION))
            this._redirectReExecutablePromiseExecutionToCompilerService(command);
        const assertionTimeout = (0, get_assertion_timeout_1.default)(command, this.opts);
        const executor = new executor_1.default(command, assertionTimeout, callsite);
        executor.once('start-assertion-retries', (timeout) => this._internalExecuteCommand(new serviceCommands.ShowAssertionRetriesStatusCommand(timeout)));
        executor.once('end-assertion-retries', (success) => this._internalExecuteCommand(new serviceCommands.HideAssertionRetriesStatusCommand(success)));
        executor.once('non-serializable-actual-value', this._redirectAssertionFnExecutionToCompilerService);
        const executeFn = this.decoratePreventEmitActionEvents(() => executor.run(), { prevent: true });
        return await executeFn();
    }
    _adjustConfigurationWithCommand(command) {
        if (command.type === type_1.default.testDone) {
            this.testDoneCommandQueued = true;
            if (this.debugLogger)
                this.debugLogger.hideBreakpoint(this.session.id);
        }
        else if (command.type === type_1.default.setNativeDialogHandler)
            this.activeDialogHandler = command.dialogHandler;
        else if (command.type === type_1.default.switchToIframe)
            this.activeIframeSelector = command.selector;
        else if (command.type === type_1.default.switchToMainWindow)
            this.activeIframeSelector = null;
        else if (command.type === type_1.default.setTestSpeed)
            this.speed = command.speed;
        else if (command.type === type_1.default.setPageLoadTimeout)
            this.pageLoadTimeout = command.duration;
        else if (command.type === type_1.default.debug)
            this.debugging = true;
        else if (command.type === type_1.default.disableDebug) {
            this.debugLogger.hideBreakpoint(this.session.id);
            this.debugging = false;
        }
    }
    async _adjustScreenshotCommand(command) {
        const browserId = this.browserConnection.id;
        const { hasChromelessScreenshots } = await this.browserConnection.provider.hasCustomActionForBrowser(browserId);
        if (!hasChromelessScreenshots)
            command.generateScreenshotMark();
    }
    async _adjustCommandOptionsAndEnvironment(command, callsite) {
        var _a;
        if (((_a = command.options) === null || _a === void 0 ? void 0 : _a.confidential) !== void 0)
            return;
        if (command.type === type_1.default.typeText) {
            const result = await this._internalExecuteCommand(command.selector, callsite);
            if (!result)
                return;
            const node = this.replicator.decode(result);
            command.options.confidential = (0, is_password_input_1.default)(node);
        }
        else if (command.type === type_1.default.pressKey) {
            const result = await this._internalExecuteCommand(new serviceCommands.GetActiveElementCommand());
            if (!result)
                return;
            const node = this.replicator.decode(result);
            command.options.confidential = (0, is_password_input_1.default)(node);
        }
        else if (command instanceof observation_1.ExecuteClientFunctionCommandBase && !!this.compilerService && !this._clientEnvironmentPrepared) {
            this._clientEnvironmentPrepared = true;
            await this._internalExecuteCommand(new serviceCommands.PrepareClientEnvironmentInDebugMode(command.esmRuntime));
        }
    }
    async _setBreakpointIfNecessary(command, callsite) {
        if (!this.disableDebugBreakpoints && this.debugging && (0, utils_2.canSetDebuggerBreakpointBeforeCommand)(command))
            await this._enqueueSetBreakpointCommand(callsite);
    }
    async executeCommand(command, callsite) {
        return command instanceof base_js_1.ActionCommandBase
            ? this._executeActionCommand(command, callsite)
            : this._internalExecuteCommand(command, callsite);
    }
    async _executeActionCommand(command, callsite) {
        const actionArgs = { apiActionName: command.methodName, command };
        let errorAdapter = null;
        let error = null;
        let result = null;
        const start = new Date().getTime();
        try {
            await this._adjustCommandOptionsAndEnvironment(command, callsite);
        }
        catch (err) {
            error = err;
        }
        await this.emitActionEvent('action-start', actionArgs);
        try {
            if (!error)
                result = await this._internalExecuteCommand(command, callsite);
        }
        catch (err) {
            if (this.phase === phase_2.default.pendingFinalization && err instanceof test_run_1.ExternalAssertionLibraryError)
                (0, add_rendered_warning_1.default)(this.warningLog, { message: warning_message_1.default.unawaitedMethodWithAssertion, actionId: command.actionId }, callsite);
            else
                error = err;
        }
        const duration = new Date().getTime() - start;
        if (error) {
            // NOTE: check if error is TestCafeErrorList is specific for the `useRole` action
            // if error is TestCafeErrorList we do not need to create an adapter,
            // since error is already was processed in role initializer
            if (!(error instanceof error_list_1.default)) {
                await this._makeScreenshotOnFail(command.actionId);
                errorAdapter = this._createErrorAdapter((0, process_test_fn_error_1.default)(error));
            }
            else
                errorAdapter = error.adapter;
        }
        Object.assign(actionArgs, {
            result,
            duration,
            err: errorAdapter,
        });
        await this.emitActionEvent('action-done', actionArgs);
        if (error)
            throw error;
        return result;
    }
    async _internalExecuteCommand(command, callsite) {
        this.debugLog.command(command);
        if (this.pendingPageError && (0, utils_2.isCommandRejectableByPageError)(command))
            return this._rejectCommandWithPageError(callsite);
        if ((0, utils_2.isExecutableOnClientCommand)(command))
            this.addingDriverTasksCount++;
        this._adjustConfigurationWithCommand(command);
        await this._setBreakpointIfNecessary(command, callsite);
        if ((0, utils_2.isScreenshotCommand)(command)) {
            if (this.opts.disableScreenshots) {
                this.warningLog.addWarning({ message: warning_message_1.default.screenshotsDisabled, actionId: command.actionId });
                return null;
            }
            await this._adjustScreenshotCommand(command);
        }
        if ((0, utils_2.isBrowserManipulationCommand)(command)) {
            this.browserManipulationQueue.push(command);
            if ((0, utils_2.isResizeWindowCommand)(command) && this.opts.videoPath)
                this.warningLog.addWarning({ message: warning_message_1.default.videoBrowserResizing, actionId: command.actionId }, this.test.name);
        }
        if (command.type === type_1.default.wait)
            return (0, delay_1.default)(command.timeout);
        if (command.type === type_1.default.setPageLoadTimeout)
            return null;
        if (command.type === type_1.default.debug) {
            // NOTE: In regular mode, it's possible to debug tests only using TestCafe UI ('Resume' and 'Next step' buttons).
            // So, we should warn on trying to debug in headless mode.
            // In compiler service mode, we can debug even in headless mode using any debugging tools. So, in this case, the warning is excessive.
            const canDebug = !!this.compilerService || !this.browserConnection.isHeadlessBrowser();
            if (canDebug)
                return await this._enqueueSetBreakpointCommand(callsite, void 0);
            this.debugging = false;
            this.warningLog.addWarning({ message: warning_message_1.default.debugInHeadlessError, actionId: command.actionId });
            return null;
        }
        if (command.type === type_1.default.useRole) {
            let fn = () => this._useRole(command.role, callsite);
            fn = this.decoratePreventEmitActionEvents(fn, { prevent: true });
            fn = this.decorateDisableDebugBreakpoints(fn, { disable: true });
            return await fn();
        }
        if (command.type === type_1.default.assertion)
            return this._executeAssertion(command, callsite);
        if (command.type === type_1.default.executeExpression)
            return await this._executeJsExpression(command);
        if (command.type === type_1.default.executeAsyncExpression)
            return this._executeAsyncJsExpression(command, callsite);
        if (command.type === type_1.default.getBrowserConsoleMessages)
            return this._enqueueBrowserConsoleMessagesCommand(command, callsite);
        if (command.type === type_1.default.switchToPreviousWindow)
            command.windowId = this.browserConnection.previousActiveWindowId;
        if (command.type === type_1.default.switchToWindowByPredicate)
            return this._switchToWindowByPredicate(command);
        if (command.type === type_1.default.getCookies)
            return this._enqueueGetCookies(command);
        if (command.type === type_1.default.setCookies)
            return this._enqueueSetCookies(command);
        if (command.type === type_1.default.deleteCookies)
            return this._enqueueDeleteCookies(command);
        if (command.type === type_1.default.addRequestHooks)
            return Promise.all(command.hooks.map(hook => this._addRequestHook(hook)));
        if (command.type === type_1.default.removeRequestHooks)
            return Promise.all(command.hooks.map(hook => this._removeRequestHook(hook)));
        return this._enqueueCommand(command, callsite);
    }
    _rejectCommandWithPageError(callsite) {
        const err = this.pendingPageError;
        // @ts-ignore
        err.callsite = callsite;
        this.pendingPageError = null;
        return Promise.reject(err);
    }
    _sendCloseChildWindowOnFileDownloadingCommand() {
        return new actionCommands.CloseChildWindowOnFileDownloading();
    }
    async _makeScreenshotOnFail(failedActionId) {
        const { screenshots } = this.opts;
        if (!this.errScreenshotPath && (screenshots === null || screenshots === void 0 ? void 0 : screenshots.takeOnFails))
            this.errScreenshotPath = await this._internalExecuteCommand(new browserManipulationCommands.TakeScreenshotOnFailCommand({ failedActionId }));
    }
    _decorateWithFlag(fn, flagName, value) {
        return async () => {
            // @ts-ignore
            this[flagName] = value;
            try {
                return await fn();
            }
            finally {
                // @ts-ignore
                this[flagName] = !value;
            }
        };
    }
    decoratePreventEmitActionEvents(fn, { prevent }) {
        return this._decorateWithFlag(fn, 'preventEmitActionEvents', prevent);
    }
    decorateDisableDebugBreakpoints(fn, { disable }) {
        return this._decorateWithFlag(fn, 'disableDebugBreakpoints', disable);
    }
    // Role management
    async getStateSnapshot() {
        const state = this.session.getStateSnapshot();
        state.storages = await this._internalExecuteCommand(new serviceCommands.BackupStoragesCommand());
        return state;
    }
    async _cleanUpCtxs() {
        if (this.compilerService) {
            await this.compilerService.setCtx({
                testRunId: this.id,
                value: Object.create(null),
            });
            await this.compilerService.setFixtureCtx({
                testRunId: this.id,
                value: Object.create(null),
            });
        }
        else {
            this.ctx = Object.create(null);
            this.fixtureCtx = Object.create(null);
            this.testRunCtx = Object.create(null);
        }
    }
    async switchToCleanRun(url) {
        await this._cleanUpCtxs();
        this.consoleMessages = new browser_console_messages_1.default();
        this.session.useStateSnapshot(testcafe_hammerhead_1.StateSnapshot.empty());
        if (this.speed !== this.opts.speed) {
            const setSpeedCommand = new actionCommands.SetTestSpeedCommand({ speed: this.opts.speed });
            await this._internalExecuteCommand(setSpeedCommand);
        }
        if (this.pageLoadTimeout !== this.opts.pageLoadTimeout) {
            const setPageLoadTimeoutCommand = new actionCommands.SetPageLoadTimeoutCommand({ duration: this.opts.pageLoadTimeout });
            await this._internalExecuteCommand(setPageLoadTimeoutCommand);
        }
        await this.navigateToUrl(url, true);
        if (this.activeDialogHandler) {
            const removeDialogHandlerCommand = new actionCommands.SetNativeDialogHandlerCommand({ dialogHandler: { fn: null } });
            await this._internalExecuteCommand(removeDialogHandlerCommand);
        }
    }
    async navigateToUrl(url, forceReload, stateSnapshot) {
        const navigateCommand = new actionCommands.NavigateToCommand({ url, forceReload, stateSnapshot });
        await this._internalExecuteCommand(navigateCommand);
    }
    async _getStateSnapshotFromRole(role) {
        const prevPhase = this.phase;
        if (role.phase === phase_1.default.initialized && role.initErr instanceof error_list_1.default && role.initErr.hasErrors)
            role.initErr.adapter = this._createErrorAdapter(role.initErr.items[0]);
        this.phase = phase_2.default.inRoleInitializer;
        if (role.phase === phase_1.default.uninitialized)
            await role.initialize(this);
        else if (role.phase === phase_1.default.pendingInitialization)
            await (0, promisify_event_1.default)(role, 'initialized');
        if (role.initErr)
            throw role.initErr;
        this.phase = prevPhase;
        return role.stateSnapshot;
    }
    async _useRole(role, callsite) {
        if (this.phase === phase_2.default.inRoleInitializer)
            throw new test_run_1.RoleSwitchInRoleInitializerError(callsite);
        const bookmark = new TestRunBookmark(this, role);
        await bookmark.init();
        if (this.currentRoleId)
            this.usedRoleStates[this.currentRoleId] = await this.getStateSnapshot();
        const stateSnapshot = this.usedRoleStates[role.id] || await this._getStateSnapshotFromRole(role);
        this.session.useStateSnapshot(stateSnapshot);
        this.currentRoleId = role.id;
        await bookmark.restore(callsite, stateSnapshot);
    }
    async getCurrentUrl() {
        const builder = new ClientFunctionBuilder(() => {
            return window.location.href; // eslint-disable-line no-undef
        }, { boundTestRun: this });
        const getLocation = builder.getFunction();
        return await getLocation();
    }
    async _switchToWindowByPredicate(command) {
        const currentWindows = await this._internalExecuteCommand(new actions_1.GetCurrentWindowsCommand({}, this));
        const windows = await (0, async_filter_1.default)(currentWindows, async (wnd) => {
            try {
                const predicateData = {
                    url: new url_1.URL(wnd.url),
                    title: wnd.title,
                };
                if (this.compilerService) {
                    const compilerServicePredicateData = Object.assign(predicateData, {
                        testRunId: this.id,
                        commandId: command.id,
                    });
                    return this.compilerService.checkWindow(compilerServicePredicateData);
                }
                return command.checkWindow(predicateData);
            }
            catch (e) {
                throw new test_run_1.SwitchToWindowPredicateError(e.message);
            }
        });
        if (!windows.length)
            throw new test_run_1.WindowNotFoundError();
        if (windows.length > 1)
            this.warningLog.addWarning({ message: warning_message_1.default.multipleWindowsFoundByPredicate, actionId: command.actionId });
        await this._internalExecuteCommand(new actions_1.SwitchToWindowCommand({ windowId: windows[0].id }, this));
    }
    _disconnect(err) {
        this.disconnected = true;
        if (this.currentDriverTask)
            this._rejectCurrentDriverTask(err);
        this.emit('disconnected', err);
        test_run_tracker_1.default.removeActiveTestRun(this.session.id);
    }
    _handleFileDownloadingInNewWindowRequest() {
        if (this.attachmentDownloadingHandled) {
            this.attachmentDownloadingHandled = false;
            return this._sendCloseChildWindowOnFileDownloadingCommand();
        }
        return null;
    }
    async emitActionEvent(eventName, args) {
        // @ts-ignore
        if (!this.preventEmitActionEvents)
            await this.emit(eventName, args);
    }
    static isMultipleWindowsAllowed(testRun) {
        const { disableMultipleWindows, test } = testRun;
        return !disableMultipleWindows && !test.isLegacy && !!testRun.activeWindowId;
    }
    async initialize() {
        await this._cookieProvider.initialize();
        await this._initRequestHooks();
        if (!this.compilerService)
            return;
        await this.compilerService.initializeTestRunData({
            testRunId: this.id,
            testId: this.test.id,
            browser: this.browser,
            activeWindowId: this.activeWindowId,
            messageBus: this._messageBus,
        });
    }
    get activeWindowId() {
        return this.browserConnection.activeWindowId;
    }
    // NOTE: this function is time-critical and must return ASAP to avoid client disconnection
    async [client_messages_1.default.ready](msg) {
        if (msg.status.isObservingFileDownloadingInNewWindow)
            return this._handleFileDownloadingInNewWindowRequest();
        this.debugLog.driverMessage(msg);
        if (this.disconnected)
            return Promise.reject(new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.testRunRequestInDisconnectedBrowser, this.browserConnection.browserInfo.alias));
        this.emit('connected');
        this._clearPendingRequest();
        // NOTE: the driver sends the status for the second time if it didn't get a response at the
        // first try. This is possible when the page was unloaded after the driver sent the status.
        if (msg.status.id === this.lastDriverStatusId)
            return this.lastDriverStatusResponse;
        this.lastDriverStatusId = msg.status.id;
        this.lastDriverStatusResponse = this._handleDriverRequest(msg.status);
        if (this.lastDriverStatusResponse || msg.status.isPendingWindowSwitching)
            return this.lastDriverStatusResponse;
        // NOTE: we send an empty response after the MAX_RESPONSE_DELAY timeout is exceeded to keep connection
        // with the client and prevent the response timeout exception on the client side
        const responseTimeout = setTimeout(() => this._resolvePendingRequest(null), MAX_RESPONSE_DELAY);
        return new Promise((resolve, reject) => {
            this.pendingRequest = { resolve, reject, responseTimeout };
        });
    }
    async [client_messages_1.default.readyForBrowserManipulation](msg) {
        this.debugLog.driverMessage(msg);
        let result = null;
        let error = null;
        try {
            result = await this.browserManipulationQueue.executePendingManipulation(msg, this._messageBus);
        }
        catch (err) {
            error = err;
        }
        return { result, error };
    }
    async [client_messages_1.default.waitForFileDownload](msg) {
        this.debugLog.driverMessage(msg);
        return new Promise(resolve => {
            if (this.fileDownloadingHandled) {
                this.fileDownloadingHandled = false;
                resolve(true);
            }
            else
                this.resolveWaitForFileDownloadingPromise = resolve;
        });
    }
}
exports.default = TestRun;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvdGVzdC1ydW4vaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLG1DQUlnQjtBQUVoQixtQ0FBZ0M7QUFDaEMsMkRBQXNEO0FBQ3RELHNFQUE2QztBQUM3Qyx3REFBZ0M7QUFDaEMsdUZBQTZEO0FBQzdELDREQUEwQztBQUMxQyxpR0FBb0Y7QUFDcEYsc0VBQXFEO0FBQ3JELCtDQUFpRDtBQUVqRCxrREFVNkI7QUFFN0Isd0VBQWdEO0FBQ2hELDJEQUEyQztBQUMzQywyREFBbUM7QUFDbkMsbUZBQXlEO0FBQ3pELG9FQUE0QztBQUM1QywrRUFBcUQ7QUFDckQsMERBQXVDO0FBQ3ZDLDBFQUF5RDtBQUN6RCwwRkFBZ0U7QUFDaEUsK0VBQXNEO0FBQ3RELHVGQUErRDtBQUUvRCw2REFXNkI7QUFFN0IsbUVBQXFEO0FBQ3JELDBEQUF3RTtBQUN4RSwrRUFBd0U7QUFDeEUsNENBQStFO0FBRS9FLDRDQVEwQjtBQUUxQixnREFXNEI7QUFFNUIsMkNBQWtFO0FBQ2xFLDRGQUFpRTtBQUNqRSwrRkFBNEU7QUFDNUUsK0RBQXlGO0FBS3pGLDhFQUFxRDtBQUVyRCw4RkFBb0U7QUFDcEUsOEZBQW9FO0FBTXBFLGdEQUFvRTtBQUtwRSx1R0FBNkU7QUFNN0Usb0RBQW1DO0FBRW5DLHdEQUlnQztBQUVoQyxtSEFBa0o7QUFDbEosMkZBQWlFO0FBQ2pFLGlHQUF1RTtBQUN2RSx1RUFBOEM7QUFDOUMsc0VBQXVEO0FBQ3ZELHlFQUFnRDtBQUdoRCwrRkFBb0U7QUFDcEUsNkJBQTBCO0FBRTFCLDBEQUFtRTtBQUNuRSwrQ0FBMEQ7QUFHMUQsTUFBTSxXQUFXLEdBQW1CLE9BQU8sQ0FBQyxhQUFhLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUNwRSxNQUFNLHFCQUFxQixHQUFTLFdBQVcsQ0FBQyw2Q0FBNkMsQ0FBQyxDQUFD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QUNuQyxJQUFJLENBQUMsY0FBYyxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSxlQUFlLEVBQUUsQ0FBQztRQUMvRCxDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFTyxLQUFLLENBQUMsQ0FBQyx5QkFBZSxDQUFDLDJCQUEyQixDQUFDLENBQUUsR0FBa0I7UUFDM0UsSUFBSSxDQUFDLFFBQVEsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLENBQUM7UUFFakMsSUFBSSxNQUFNLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksS0FBSyxHQUFJLElBQUksQ0FBQztRQUVsQixJQUFJO1lBQ0EsTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLDBCQUEwQixDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsV0FBVyxDQUFDLENBQUM7U0FDbEc7UUFDRCxPQUFPLEdBQVEsRUFBRTtZQUNiLEtBQUssR0FBRyxHQUFHLENBQUM7U0FDZjtRQUVELE9BQU8sRUFBRSxNQUFNLEVBQUUsS0FBSyxFQUFFLENBQUM7SUFDN0IsQ0FBQztJQUVPLEtBQUssQ0FBQyxDQUFDLHlCQUFlLENBQUMsbUJBQW1CLENBQUMsQ0FBRSxHQUFrQjtRQUNuRSxJQUFJLENBQUMsUUFBUSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUVqQyxPQUFPLElBQUksT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFO1lBQ3pCLElBQUksSUFBSSxDQUFDLHNCQUFzQixFQUFFO2dCQUM3QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsS0FBSyxDQUFDO2dCQUNwQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDakI7O2dCQUVHLElBQUksQ0FBQyxvQ0FBb0MsR0FBRyxPQUFPLENBQUM7UUFDNUQsQ0FBQyxDQUFDLENBQUM7SUFDUCxDQUFDO0NBQ0o7QUF4MkNELDBCQXcyQ0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICAgIHB1bGwsXG4gICAgcmVtb3ZlLFxuICAgIGNoYWluLFxufSBmcm9tICdsb2Rhc2gnO1xuXG5pbXBvcnQgeyBuYW5vaWQgfSBmcm9tICduYW5vaWQnO1xuaW1wb3J0IHsgcmVhZFN5bmMgYXMgcmVhZCB9IGZyb20gJ3JlYWQtZmlsZS1yZWxhdGl2ZSc7XG5pbXBvcnQgcHJvbWlzaWZ5RXZlbnQgZnJvbSAncHJvbWlzaWZ5LWV2ZW50JztcbmltcG9ydCBNdXN0YWNoZSBmcm9tICdtdXN0YWNoZSc7XG5pbXBvcnQgQXN5bmNFdmVudEVtaXR0ZXIgZnJvbSAnLi4vdXRpbHMvYXN5bmMtZXZlbnQtZW1pdHRlcic7XG5pbXBvcnQgVGVzdFJ1bkRlYnVnTG9nIGZyb20gJy4vZGVidWctbG9nJztcbmltcG9ydCBUZXN0UnVuRXJyb3JGb3JtYXR0YWJsZUFkYXB0ZXIgZnJvbSAnLi4vZXJyb3JzL3Rlc3QtcnVuL2Zvcm1hdHRhYmxlLWFkYXB0ZXInO1xuaW1wb3J0IFRlc3RDYWZlRXJyb3JMaXN0IGZyb20gJy4uL2Vycm9ycy9lcnJvci1saXN0JztcbmltcG9ydCB7IEdlbmVyYWxFcnJvciB9IGZyb20gJy4uL2Vycm9ycy9ydW50aW1lJztcblxuaW1wb3J0IHtcbiAgICBSZXF1ZXN0SG9va1VuaGFuZGxlZEVycm9yLFxuICAgIFBhZ2VMb2FkRXJyb3IsXG4gICAgUm9sZVN3aXRjaEluUm9sZUluaXRpYWxpemVyRXJyb3IsXG4gICAgU3dpdGNoVG9XaW5kb3dQcmVkaWNhdGVFcnJvcixcbiAgICBXaW5kb3dOb3RGb3VuZEVycm9yLFxuICAgIFJlcXVlc3RIb29rQmFzZUVycm9yLFxuICAgIFRlc3RUaW1lb3V0RXJyb3IsXG4gICAgRXh0ZXJuYWxBc3NlcnRpb25MaWJyYXJ5RXJyb3IsXG4gICAgUnVuVGltZW91dEVycm9yLFxufSBmcm9tICcuLi9lcnJvcnMvdGVzdC1ydW4vJztcblxuaW1wb3J0IENMSUVOVF9NRVNTQUdFUyBmcm9tICcuL2NsaWVudC1tZXNzYWdlcyc7XG5pbXBvcnQgQ09NTUFORF9UWVBFIGZyb20gJy4vY29tbWFuZHMvdHlwZSc7XG5pbXBvcnQgZGVsYXkgZnJvbSAnLi4vdXRpbHMvZGVsYXknO1xuaW1wb3J0IGlzUGFzc3dvcmRJbnB1dCBmcm9tICcuLi91dGlscy9pcy1wYXNzd29yZC1pbnB1dCc7XG5pbXBvcnQgdGVzdFJ1bk1hcmtlciBmcm9tICcuL21hcmtlci1zeW1ib2wnO1xuaW1wb3J0IHRlc3RSdW5UcmFja2VyIGZyb20gJy4uL2FwaS90ZXN0LXJ1bi10cmFja2VyJztcbmltcG9ydCBST0xFX1BIQVNFIGZyb20gJy4uL3JvbGUvcGhhc2UnO1xuaW1wb3J0IFJlcG9ydGVyUGx1Z2luSG9zdCBmcm9tICcuLi9yZXBvcnRlci9wbHVnaW4taG9zdCc7XG5pbXBvcnQgQnJvd3NlckNvbnNvbGVNZXNzYWdlcyBmcm9tICcuL2Jyb3dzZXItY29uc29sZS1tZXNzYWdlcyc7XG5pbXBvcnQgV2FybmluZ0xvZyBmcm9tICcuLi9ub3RpZmljYXRpb25zL3dhcm5pbmctbG9nJztcbmltcG9ydCBXQVJOSU5HX01FU1NBR0UgZnJvbSAnLi4vbm90aWZpY2F0aW9ucy93YXJuaW5nLW1lc3NhZ2UnO1xuXG5pbXBvcnQge1xuICAgIFN0YXRlU25hcHNob3QsXG4gICAgU1BFQ0lBTF9FUlJPUl9QQUdFLFxuICAgIFJlcXVlc3RGaWx0ZXJSdWxlLFxuICAgIEluamVjdGFibGVSZXNvdXJjZXMsXG4gICAgUmVxdWVzdEV2ZW50LFxuICAgIENvbmZpZ3VyZVJlc3BvbnNlRXZlbnQsXG4gICAgUmVzcG9uc2VFdmVudCxcbiAgICBSZXF1ZXN0SG9va01ldGhvZEVycm9yLFxuICAgIFN0b3JhZ2VzU25hcHNob3QsXG4gICAgUmVxdWVzdEhvb2tFdmVudFByb3ZpZGVyLFxufSBmcm9tICd0ZXN0Y2FmZS1oYW1tZXJoZWFkJztcblxuaW1wb3J0ICogYXMgSU5KRUNUQUJMRVMgZnJvbSAnLi4vYXNzZXRzL2luamVjdGFibGVzJztcbmltcG9ydCB7IGZpbmRQcm9ibGVtYXRpY1NjcmlwdHMgfSBmcm9tICcuLi9jdXN0b20tY2xpZW50LXNjcmlwdHMvdXRpbHMnO1xuaW1wb3J0IGdldEN1c3RvbUNsaWVudFNjcmlwdFVybCBmcm9tICcuLi9jdXN0b20tY2xpZW50LXNjcmlwdHMvZ2V0LXVybCc7XG5pbXBvcnQgeyBnZXRQbHVyYWxTdWZmaXgsIGdldENvbmNhdGVuYXRlZFZhbHVlc1N0cmluZyB9IGZyb20gJy4uL3V0aWxzL3N0cmluZyc7XG5cbmltcG9ydCB7XG4gICAgaXNDb21tYW5kUmVqZWN0YWJsZUJ5UGFnZUVycm9yLFxuICAgIGlzQnJvd3Nlck1hbmlwdWxhdGlvbkNvbW1hbmQsXG4gICAgaXNTY3JlZW5zaG90Q29tbWFuZCxcbiAgICBpc1NlcnZpY2VDb21tYW5kLFxuICAgIGNhblNldERlYnVnZ2VyQnJlYWtwb2ludEJlZm9yZUNvbW1hbmQsXG4gICAgaXNFeGVjdXRhYmxlT25DbGllbnRDb21tYW5kLFxuICAgIGlzUmVzaXplV2luZG93Q29tbWFuZCxcbn0gZnJvbSAnLi9jb21tYW5kcy91dGlscyc7XG5cbmltcG9ydCB7XG4gICAgRXhlY3V0ZUFzeW5jRXhwcmVzc2lvbkNvbW1hbmQsXG4gICAgRXhlY3V0ZUV4cHJlc3Npb25Db21tYW5kLFxuICAgIEdldEN1cnJlbnRXaW5kb3dzQ29tbWFuZCxcbiAgICBTd2l0Y2hUb1dpbmRvd0J5UHJlZGljYXRlQ29tbWFuZCxcbiAgICBTd2l0Y2hUb1dpbmRvd0NvbW1hbmQsXG4gICAgR2V0Q29va2llc0NvbW1hbmQsXG4gICAgU2V0Q29va2llc0NvbW1hbmQsXG4gICAgRGVsZXRlQ29va2llc0NvbW1hbmQsXG4gICAgQWRkUmVxdWVzdEhvb2tzQ29tbWFuZCxcbiAgICBSZW1vdmVSZXF1ZXN0SG9va3NDb21tYW5kLFxufSBmcm9tICcuL2NvbW1hbmRzL2FjdGlvbnMnO1xuXG5pbXBvcnQgeyBSVU5USU1FX0VSUk9SUywgVEVTVF9SVU5fRVJST1JTIH0gZnJvbSAnLi4vZXJyb3JzL3R5cGVzJztcbmltcG9ydCBwcm9jZXNzVGVzdEZuRXJyb3IgZnJvbSAnLi4vZXJyb3JzL3Byb2Nlc3MtdGVzdC1mbi1lcnJvcic7XG5pbXBvcnQgUmVxdWVzdEhvb2tNZXRob2ROYW1lcyBmcm9tICcuLi9hcGkvcmVxdWVzdC1ob29rcy9ob29rLW1ldGhvZC1uYW1lcyc7XG5pbXBvcnQgeyBjcmVhdGVSZXBsaWNhdG9yLCBTZWxlY3Rvck5vZGVUcmFuc2Zvcm0gfSBmcm9tICcuLi9jbGllbnQtZnVuY3Rpb25zL3JlcGxpY2F0b3InO1xuaW1wb3J0IFRlc3QgZnJvbSAnLi4vYXBpL3N0cnVjdHVyZS90ZXN0JztcbmltcG9ydCBDYXB0dXJlciBmcm9tICcuLi9zY3JlZW5zaG90cy9jYXB0dXJlcic7XG5pbXBvcnQgeyBEaWN0aW9uYXJ5IH0gZnJvbSAnLi4vY29uZmlndXJhdGlvbi9pbnRlcmZhY2VzJztcbmltcG9ydCBDb21waWxlclNlcnZpY2UgZnJvbSAnLi4vc2VydmljZXMvY29tcGlsZXIvaG9zdCc7XG5pbXBvcnQgU2Vzc2lvbkNvbnRyb2xsZXIgZnJvbSAnLi9zZXNzaW9uLWNvbnRyb2xsZXInO1xuaW1wb3J0IFRlc3RDb250cm9sbGVyIGZyb20gJy4uL2FwaS90ZXN0LWNvbnRyb2xsZXInO1xuaW1wb3J0IEJyb3dzZXJNYW5pcHVsYXRpb25RdWV1ZSBmcm9tICcuL2Jyb3dzZXItbWFuaXB1bGF0aW9uLXF1ZXVlJztcbmltcG9ydCBPYnNlcnZlZENhbGxzaXRlc1N0b3JhZ2UgZnJvbSAnLi9vYnNlcnZlZC1jYWxsc2l0ZXMtc3RvcmFnZSc7XG5pbXBvcnQgQ2xpZW50U2NyaXB0IGZyb20gJy4uL2N1c3RvbS1jbGllbnQtc2NyaXB0cy9jbGllbnQtc2NyaXB0JztcbmltcG9ydCBCcm93c2VyQ29ubmVjdGlvbiBmcm9tICcuLi9icm93c2VyL2Nvbm5lY3Rpb24nO1xuaW1wb3J0IHsgUXVhcmFudGluZSB9IGZyb20gJy4uL3V0aWxzL2dldC1vcHRpb25zL3F1YXJhbnRpbmUnO1xuaW1wb3J0IFJlcXVlc3RIb29rIGZyb20gJy4uL2FwaS9yZXF1ZXN0LWhvb2tzL2hvb2snO1xuaW1wb3J0IERyaXZlclN0YXR1cyBmcm9tICcuLi9jbGllbnQvZHJpdmVyL3N0YXR1cyc7XG5pbXBvcnQgeyBDb21tYW5kQmFzZSwgQWN0aW9uQ29tbWFuZEJhc2UgfSBmcm9tICcuL2NvbW1hbmRzL2Jhc2UuanMnO1xuaW1wb3J0IFJvbGUgZnJvbSAnLi4vcm9sZS9yb2xlJztcbmltcG9ydCB7IFRlc3RSdW5FcnJvckJhc2UgfSBmcm9tICcuLi9zaGFyZWQvZXJyb3JzJztcbmltcG9ydCB7IENhbGxzaXRlUmVjb3JkIH0gZnJvbSAnY2FsbHNpdGUtcmVjb3JkJztcbmltcG9ydCBFdmVudEVtaXR0ZXIgZnJvbSAnZXZlbnRzJztcbmltcG9ydCBnZXRBc3NlcnRpb25UaW1lb3V0IGZyb20gJy4uL3V0aWxzL2dldC1vcHRpb25zL2dldC1hc3NlcnRpb24tdGltZW91dCc7XG5pbXBvcnQgeyBBc3NlcnRpb25Db21tYW5kIH0gZnJvbSAnLi9jb21tYW5kcy9hc3NlcnRpb24nO1xuaW1wb3J0IHsgVGFrZVNjcmVlbnNob3RCYXNlQ29tbWFuZCB9IGZyb20gJy4vY29tbWFuZHMvYnJvd3Nlci1tYW5pcHVsYXRpb24nO1xuLy9AdHMtaWdub3JlXG5pbXBvcnQgeyBUZXN0UnVuIGFzIExlZ2FjeVRlc3RSdW4gfSBmcm9tICd0ZXN0Y2FmZS1sZWdhY3ktYXBpJztcbmltcG9ydCB7IEF1dGhDcmVkZW50aWFscyB9IGZyb20gJy4uL2FwaS9zdHJ1Y3R1cmUvaW50ZXJmYWNlcyc7XG5pbXBvcnQgVGVzdFJ1blBoYXNlIGZyb20gJy4vcGhhc2UnO1xuXG5pbXBvcnQge1xuICAgIEV4ZWN1dGVDbGllbnRGdW5jdGlvbkNvbW1hbmQsXG4gICAgRXhlY3V0ZUNsaWVudEZ1bmN0aW9uQ29tbWFuZEJhc2UsXG4gICAgRXhlY3V0ZVNlbGVjdG9yQ29tbWFuZCxcbn0gZnJvbSAnLi9jb21tYW5kcy9vYnNlcnZhdGlvbic7XG5cbmltcG9ydCB7IFJFX0VYRUNVVEFCTEVfUFJPTUlTRV9NQVJLRVJfREVTQ1JJUFRJT04gfSBmcm9tICcuLi9zZXJ2aWNlcy9zZXJpYWxpemF0aW9uL3JlcGxpY2F0b3IvdHJhbnNmb3Jtcy9yZS1leGVjdXRhYmxlLXByb21pc2UtdHJhbnNmb3JtL21hcmtlcic7XG5pbXBvcnQgUmVFeGVjdXRhYmxlUHJvbWlzZSBmcm9tICcuLi91dGlscy9yZS1leGVjdXRhYmxlLXByb21pc2UnO1xuaW1wb3J0IGFkZFJlbmRlcmVkV2FybmluZyBmcm9tICcuLi9ub3RpZmljYXRpb25zL2FkZC1yZW5kZXJlZC13YXJuaW5nJztcbmltcG9ydCBnZXRCcm93c2VyIGZyb20gJy4uL3V0aWxzL2dldC1icm93c2VyJztcbmltcG9ydCBBc3NlcnRpb25FeGVjdXRvciBmcm9tICcuLi9hc3NlcnRpb25zL2V4ZWN1dG9yJztcbmltcG9ydCBhc3luY0ZpbHRlciBmcm9tICcuLi91dGlscy9hc3luYy1maWx0ZXInO1xuaW1wb3J0IEZpeHR1cmUgZnJvbSAnLi4vYXBpL3N0cnVjdHVyZS9maXh0dXJlJztcbmltcG9ydCBNZXNzYWdlQnVzIGZyb20gJy4uL3V0aWxzL21lc3NhZ2UtYnVzJztcbmltcG9ydCBleGVjdXRlRm5XaXRoVGltZW91dCBmcm9tICcuLi91dGlscy9leGVjdXRlLWZuLXdpdGgtdGltZW91dCc7XG5pbXBvcnQgeyBVUkwgfSBmcm9tICd1cmwnO1xuaW1wb3J0IHsgQ29va2llT3B0aW9ucyB9IGZyb20gJy4vY29tbWFuZHMvb3B0aW9ucyc7XG5pbXBvcnQgeyBwcmVwYXJlU2tpcEpzRXJyb3JzT3B0aW9ucyB9IGZyb20gJy4uL2FwaS9za2lwLWpzLWVycm9ycyc7XG5pbXBvcnQgeyBDb29raWVQcm92aWRlckZhY3RvcnkgfSBmcm9tICcuL2Nvb2tpZXMvZmFjdG9yeSc7XG5pbXBvcnQgeyBDb29raWVQcm92aWRlciB9IGZyb20gJy4vY29va2llcy9iYXNlJztcblxuY29uc3QgbGF6eVJlcXVpcmUgICAgICAgICAgICAgICAgID0gcmVxdWlyZSgnaW1wb3J0LWxhenknKShyZXF1aXJlKTtcbmNvbnN0IENsaWVudEZ1bmN0aW9uQnVpbGRlciAgICAgICA9IGxhenlSZXF1aXJlKCcuLi9jbGllbnQtZnVuY3Rpb25zL2NsaWVudC1mdW5jdGlvbi1idWlsZGVyJyk7XG5jb25zdCBUZXN0UnVuQm9va21hcmsgICAgICAgICAgICAgPSBsYXp5UmVxdWlyZSgnLi9ib29rbWFyaycpO1xuY29uc3QgYWN0aW9uQ29tbWFuZHMgICAgICAgICAgICAgID0gbGF6eVJlcXVpcmUoJy4vY29tbWFuZHMvYWN0aW9ucycpO1xuY29uc3QgYnJvd3Nlck1hbmlwdWxhdGlvbkNvbW1hbmRzID0gbGF6eVJlcXVpcmUoJy4vY29tbWFuZHMvYnJvd3Nlci1tYW5pcHVsYXRpb24nKTtcbmNvbnN0IHNlcnZpY2VDb21tYW5kcyAgICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL2NvbW1hbmRzL3NlcnZpY2UnKTtcbmNvbnN0IG9ic2VydmF0aW9uQ29tbWFuZHMgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL2NvbW1hbmRzL29ic2VydmF0aW9uJyk7XG5cbmNvbnN0IHsgZXhlY3V0ZUpzRXhwcmVzc2lvbiwgZXhlY3V0ZUFzeW5jSnNFeHByZXNzaW9uIH0gPSBsYXp5UmVxdWlyZSgnLi9leGVjdXRlLWpzLWV4cHJlc3Npb24nKTtcblxuY29uc3QgVEVTVF9SVU5fVEVNUExBVEUgICAgICAgICAgICAgICA9IHJlYWQoJy4uL2NsaWVudC90ZXN0LXJ1bi9pbmRleC5qcy5tdXN0YWNoZScpIGFzIHN0cmluZztcbmNvbnN0IElGUkFNRV9URVNUX1JVTl9URU1QTEFURSAgICAgICAgPSByZWFkKCcuLi9jbGllbnQvdGVzdC1ydW4vaWZyYW1lLmpzLm11c3RhY2hlJykgYXMgc3RyaW5nO1xuY29uc3QgVEVTVF9ET05FX0NPTkZJUk1BVElPTl9SRVNQT05TRSA9ICd0ZXN0LWRvbmUtY29uZmlybWF0aW9uJztcbmNvbnN0IE1BWF9SRVNQT05TRV9ERUxBWSAgICAgICAgICAgICAgPSAzMDAwO1xuY29uc3QgQ0hJTERfV0lORE9XX1JFQURZX1RJTUVPVVQgICAgICA9IDMwICogMTAwMDtcblxuY29uc3QgQUxMX0RSSVZFUl9UQVNLU19BRERFRF9UT19RVUVVRV9FVkVOVCA9ICdhbGwtZHJpdmVyLXRhc2tzLWFkZGVkLXRvLXF1ZXVlJztcblxuY29uc3QgQ09NUElMRVJfU0VSVklDRV9FVkVOVFMgPSBbXG4gICAgJ3NldE1vY2snLFxuICAgICdzZXRDb25maWd1cmVSZXNwb25zZUV2ZW50T3B0aW9ucycsXG4gICAgJ3NldEhlYWRlck9uQ29uZmlndXJlUmVzcG9uc2VFdmVudCcsXG4gICAgJ3JlbW92ZUhlYWRlck9uQ29uZmlndXJlUmVzcG9uc2VFdmVudCcsXG5dO1xuXG5cbmludGVyZmFjZSBUZXN0UnVuSW5pdCB7XG4gICAgdGVzdDogVGVzdDtcbiAgICBicm93c2VyQ29ubmVjdGlvbjogQnJvd3NlckNvbm5lY3Rpb247XG4gICAgc2NyZWVuc2hvdENhcHR1cmVyOiBDYXB0dXJlcjtcbiAgICBnbG9iYWxXYXJuaW5nTG9nOiBXYXJuaW5nTG9nO1xuICAgIG9wdHM6IERpY3Rpb25hcnk8T3B0aW9uVmFsdWU+O1xuICAgIGNvbXBpbGVyU2VydmljZT86IENvbXBpbGVyU2VydmljZTtcbiAgICBtZXNzYWdlQnVzPzogTWVzc2FnZUJ1cztcbiAgICBzdGFydFJ1bkV4ZWN1dGlvblRpbWU/OiBEYXRlO1xufVxuXG5pbnRlcmZhY2UgRHJpdmVyVGFzayB7XG4gICAgY29tbWFuZDogQ29tbWFuZEJhc2U7XG4gICAgcmVzb2x2ZTogRnVuY3Rpb247XG4gICAgcmVqZWN0OiBGdW5jdGlvbjtcbiAgICBjYWxsc2l0ZTogQ2FsbHNpdGVSZWNvcmQ7XG59XG5cbmludGVyZmFjZSBEcml2ZXJNZXNzYWdlIHtcbiAgICBzdGF0dXM6IERyaXZlclN0YXR1cztcbn1cblxuaW50ZXJmYWNlIERyaXZlcldhcm5pbmcge1xuICAgIHR5cGU6IGtleW9mIHR5cGVvZiBXQVJOSU5HX01FU1NBR0U7XG4gICAgYXJnczogc3RyaW5nW107XG59XG5cbmludGVyZmFjZSBSZXF1ZXN0VGltZW91dCB7XG4gICAgcGFnZT86IG51bWJlcjtcbiAgICBhamF4PzogbnVtYmVyO1xufVxuXG5pbnRlcmZhY2UgRXhlY3V0aW9uVGltZW91dCB7XG4gICAgdGltZW91dDogbnVtYmVyO1xuICAgIHJlamVjdFdpdGg6IFRlc3RUaW1lb3V0RXJyb3IgfCBSdW5UaW1lb3V0RXJyb3I7XG59XG5cbmludGVyZmFjZSBQZW5kaW5nUmVxdWVzdCB7XG4gICAgcmVzcG9uc2VUaW1lb3V0OiBOb2RlSlMuVGltZW91dDtcbiAgICByZXNvbHZlOiBGdW5jdGlvbjtcbiAgICByZWplY3Q6IEZ1bmN0aW9uO1xufVxuXG5pbnRlcmZhY2UgQnJvd3Nlck1hbmlwdWxhdGlvblJlc3VsdCB7XG4gICAgcmVzdWx0OiB1bmtub3duO1xuICAgIGVycm9yOiBFcnJvcjtcbn1cblxuaW50ZXJmYWNlIE9wZW5lZFdpbmRvd0luZm9ybWF0aW9uIHtcbiAgICBpZDogc3RyaW5nO1xuICAgIHVybDogc3RyaW5nO1xuICAgIHRpdGxlOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRlc3RSdW4gZXh0ZW5kcyBBc3luY0V2ZW50RW1pdHRlciB7XG4gICAgcHJpdmF0ZSBbdGVzdFJ1bk1hcmtlcl06IGJvb2xlYW47XG4gICAgcHVibGljIHJlYWRvbmx5IHdhcm5pbmdMb2c6IFdhcm5pbmdMb2c7XG4gICAgcHJpdmF0ZSByZWFkb25seSBvcHRzOiBEaWN0aW9uYXJ5PE9wdGlvblZhbHVlPjtcbiAgICBwdWJsaWMgcmVhZG9ubHkgdGVzdDogVGVzdDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgYnJvd3NlckNvbm5lY3Rpb246IEJyb3dzZXJDb25uZWN0aW9uO1xuICAgIHB1YmxpYyB1bnN0YWJsZTogYm9vbGVhbjtcbiAgICBwdWJsaWMgcGhhc2U6IFRlc3RSdW5QaGFzZTtcbiAgICBwcml2YXRlIGRyaXZlclRhc2tRdWV1ZTogRHJpdmVyVGFza1tdO1xuICAgIHByaXZhdGUgdGVzdERvbmVDb21tYW5kUXVldWVkOiBib29sZWFuO1xuICAgIHB1YmxpYyBhY3RpdmVEaWFsb2dIYW5kbGVyOiBFeGVjdXRlQ2xpZW50RnVuY3Rpb25Db21tYW5kIHwgbnVsbDtcbiAgICBwdWJsaWMgYWN0aXZlSWZyYW1lU2VsZWN0b3I6IEV4ZWN1dGVTZWxlY3RvckNvbW1hbmQgfCBudWxsO1xuICAgIHB1YmxpYyBzcGVlZDogbnVtYmVyO1xuICAgIHB1YmxpYyBwYWdlTG9hZFRpbWVvdXQ6IG51bWJlcjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHRlc3RFeGVjdXRpb25UaW1lb3V0OiBFeGVjdXRpb25UaW1lb3V0IHwgbnVsbDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHJ1bkV4ZWN1dGlvblRpbWVvdXQ6IEV4ZWN1dGlvblRpbWVvdXQgfCBudWxsO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGlzYWJsZVBhZ2VSZWxvYWRzOiBib29sZWFuO1xuICAgIHByaXZhdGUgZGlzYWJsZVBhZ2VDYWNoaW5nOiBib29sZWFuO1xuICAgIHByaXZhdGUgZGlzYWJsZU11bHRpcGxlV2luZG93czogYm9vbGVhbjtcbiAgICBwcml2YXRlIHJlcXVlc3RUaW1lb3V0OiBSZXF1ZXN0VGltZW91dDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2Vzc2lvbjogU2Vzc2lvbkNvbnRyb2xsZXI7XG4gICAgcHVibGljIGNvbnNvbGVNZXNzYWdlczogQnJvd3NlckNvbnNvbGVNZXNzYWdlcztcbiAgICBwcml2YXRlIHBlbmRpbmdSZXF1ZXN0OiBQZW5kaW5nUmVxdWVzdCB8IG51bGw7XG4gICAgcHJpdmF0ZSBwZW5kaW5nUGFnZUVycm9yOiBQYWdlTG9hZEVycm9yIHwgRXJyb3IgfCBudWxsO1xuICAgIHB1YmxpYyBjb250cm9sbGVyOiBUZXN0Q29udHJvbGxlciB8IG51bGw7XG4gICAgcHVibGljIGN0eDogb2JqZWN0O1xuICAgIHB1YmxpYyBmaXh0dXJlQ3R4OiBvYmplY3QgfCBudWxsO1xuICAgIHB1YmxpYyB0ZXN0UnVuQ3R4OiBvYmplY3QgfCBudWxsO1xuICAgIHByaXZhdGUgY3VycmVudFJvbGVJZDogc3RyaW5nIHwgbnVsbDtcbiAgICBwcml2YXRlIHJlYWRvbmx5IHVzZWRSb2xlU3RhdGVzOiBSZWNvcmQ8c3RyaW5nLCBhbnk+O1xuICAgIHB1YmxpYyBlcnJzOiBUZXN0UnVuRXJyb3JGb3JtYXR0YWJsZUFkYXB0ZXJbXTtcbiAgICBwcml2YXRlIGxhc3REcml2ZXJTdGF0dXNJZDogc3RyaW5nIHwgbnVsbDtcbiAgICBwcml2YXRlIGxhc3REcml2ZXJTdGF0dXNSZXNwb25zZTogQ29tbWFuZEJhc2UgfCBudWxsIHwgc3RyaW5nO1xuICAgIHByaXZhdGUgZmlsZURvd25sb2FkaW5nSGFuZGxlZDogYm9vbGVhbjtcbiAgICBwcml2YXRlIGF0dGFjaG1lbnREb3dubG9hZGluZ0hhbmRsZWQ6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSByZXNvbHZlV2FpdEZvckZpbGVEb3dubG9hZGluZ1Byb21pc2U6IEZ1bmN0aW9uIHwgbnVsbDtcbiAgICBwcml2YXRlIGFkZGluZ0RyaXZlclRhc2tzQ291bnQ6IG51bWJlcjtcbiAgICBwdWJsaWMgZGVidWdnaW5nOiBib29sZWFuO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGVidWdPbkZhaWw6IGJvb2xlYW47XG4gICAgcHJpdmF0ZSByZWFkb25seSBkaXNhYmxlRGVidWdCcmVha3BvaW50czogYm9vbGVhbjtcbiAgICBwcml2YXRlIHJlYWRvbmx5IGRlYnVnUmVwb3J0ZXJQbHVnaW5Ib3N0OiBSZXBvcnRlclBsdWdpbkhvc3Q7XG4gICAgcHJpdmF0ZSByZWFkb25seSBicm93c2VyTWFuaXB1bGF0aW9uUXVldWU6IEJyb3dzZXJNYW5pcHVsYXRpb25RdWV1ZTtcbiAgICBwcml2YXRlIGRlYnVnTG9nOiBUZXN0UnVuRGVidWdMb2c7XG4gICAgcHVibGljIHF1YXJhbnRpbmU6IFF1YXJhbnRpbmUgfCBudWxsO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgZGVidWdMb2dnZXI6IGFueTtcbiAgICBwdWJsaWMgb2JzZXJ2ZWRDYWxsc2l0ZXM6IE9ic2VydmVkQ2FsbHNpdGVzU3RvcmFnZTtcbiAgICBwdWJsaWMgcmVhZG9ubHkgY29tcGlsZXJTZXJ2aWNlPzogQ29tcGlsZXJTZXJ2aWNlO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgcmVwbGljYXRvcjogYW55O1xuICAgIHByaXZhdGUgZGlzY29ubmVjdGVkOiBib29sZWFuO1xuICAgIHByaXZhdGUgZXJyU2NyZWVuc2hvdFBhdGg6IHN0cmluZyB8IG51bGw7XG4gICAgcHJpdmF0ZSBhc3luY0pzRXhwcmVzc2lvbkNhbGxzaXRlczogTWFwPHN0cmluZywgQ2FsbHNpdGVSZWNvcmQ+O1xuICAgIHB1YmxpYyByZWFkb25seSBicm93c2VyOiBCcm93c2VyO1xuICAgIHByaXZhdGUgcmVhZG9ubHkgX21lc3NhZ2VCdXM/OiBNZXNzYWdlQnVzO1xuICAgIHByaXZhdGUgX2NsaWVudEVudmlyb25tZW50UHJlcGFyZWQgPSBmYWxzZTtcbiAgICBwcml2YXRlIF9jb29raWVQcm92aWRlcjogQ29va2llUHJvdmlkZXI7XG4gICAgcHVibGljIHJlYWRvbmx5IHN0YXJ0UnVuRXhlY3V0aW9uVGltZT86IERhdGU7XG4gICAgcHJpdmF0ZSByZWFkb25seSBfcmVxdWVzdEhvb2tFdmVudFByb3ZpZGVyOiBSZXF1ZXN0SG9va0V2ZW50UHJvdmlkZXI7XG5cbiAgICBwdWJsaWMgY29uc3RydWN0b3IgKHsgdGVzdCwgYnJvd3NlckNvbm5lY3Rpb24sIHNjcmVlbnNob3RDYXB0dXJlciwgZ2xvYmFsV2FybmluZ0xvZywgb3B0cywgY29tcGlsZXJTZXJ2aWNlLCBtZXNzYWdlQnVzLCBzdGFydFJ1bkV4ZWN1dGlvblRpbWUgfTogVGVzdFJ1bkluaXQpIHtcbiAgICAgICAgc3VwZXIoKTtcblxuICAgICAgICB0aGlzW3Rlc3RSdW5NYXJrZXJdICAgID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5fbWVzc2FnZUJ1cyAgICAgICA9IG1lc3NhZ2VCdXM7XG4gICAgICAgIHRoaXMud2FybmluZ0xvZyAgICAgICAgPSBuZXcgV2FybmluZ0xvZyhnbG9iYWxXYXJuaW5nTG9nLCBXYXJuaW5nTG9nLmNyZWF0ZUFkZFdhcm5pbmdDYWxsYmFjayhtZXNzYWdlQnVzLCB0aGlzKSk7XG4gICAgICAgIHRoaXMub3B0cyAgICAgICAgICAgICAgPSBvcHRzO1xuICAgICAgICB0aGlzLnRlc3QgICAgICAgICAgICAgID0gdGVzdDtcbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbiA9IGJyb3dzZXJDb25uZWN0aW9uO1xuICAgICAgICB0aGlzLnVuc3RhYmxlICAgICAgICAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMuYnJvd3NlciAgICAgICAgICAgPSBnZXRCcm93c2VyKGJyb3dzZXJDb25uZWN0aW9uKTtcblxuICAgICAgICB0aGlzLnBoYXNlID0gVGVzdFJ1blBoYXNlLmluaXRpYWw7XG5cbiAgICAgICAgdGhpcy5kcml2ZXJUYXNrUXVldWUgICAgICAgPSBbXTtcbiAgICAgICAgdGhpcy50ZXN0RG9uZUNvbW1hbmRRdWV1ZWQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLmFjdGl2ZURpYWxvZ0hhbmRsZXIgID0gbnVsbDtcbiAgICAgICAgdGhpcy5hY3RpdmVJZnJhbWVTZWxlY3RvciA9IG51bGw7XG4gICAgICAgIHRoaXMuc3BlZWQgICAgICAgICAgICAgICAgPSB0aGlzLm9wdHMuc3BlZWQgYXMgbnVtYmVyO1xuICAgICAgICB0aGlzLnBhZ2VMb2FkVGltZW91dCAgICAgID0gdGhpcy5fZ2V0UGFnZUxvYWRUaW1lb3V0KHRlc3QsIG9wdHMpO1xuICAgICAgICB0aGlzLnRlc3RFeGVjdXRpb25UaW1lb3V0ID0gdGhpcy5fZ2V0VGVzdEV4ZWN1dGlvblRpbWVvdXQob3B0cyk7XG5cbiAgICAgICAgdGhpcy5kaXNhYmxlUGFnZVJlbG9hZHMgICA9IHRlc3QuZGlzYWJsZVBhZ2VSZWxvYWRzIHx8IG9wdHMuZGlzYWJsZVBhZ2VSZWxvYWRzIGFzIGJvb2xlYW4gJiYgdGVzdC5kaXNhYmxlUGFnZVJlbG9hZHMgIT09IGZhbHNlO1xuICAgICAgICB0aGlzLmRpc2FibGVQYWdlQ2FjaGluZyAgID0gdGVzdC5kaXNhYmxlUGFnZUNhY2hpbmcgfHwgb3B0cy5kaXNhYmxlUGFnZUNhY2hpbmcgYXMgYm9vbGVhbjtcblxuICAgICAgICB0aGlzLmRpc2FibGVNdWx0aXBsZVdpbmRvd3MgPSBvcHRzLmRpc2FibGVNdWx0aXBsZVdpbmRvd3MgYXMgYm9vbGVhbjtcblxuICAgICAgICB0aGlzLnJlcXVlc3RUaW1lb3V0ID0gdGhpcy5fZ2V0UmVxdWVzdFRpbWVvdXQodGVzdCwgb3B0cyk7XG5cbiAgICAgICAgdGhpcy5zZXNzaW9uID0gU2Vzc2lvbkNvbnRyb2xsZXIuZ2V0U2Vzc2lvbih0aGlzKTtcblxuICAgICAgICB0aGlzLmNvbnNvbGVNZXNzYWdlcyA9IG5ldyBCcm93c2VyQ29uc29sZU1lc3NhZ2VzKCk7XG5cbiAgICAgICAgdGhpcy5wZW5kaW5nUmVxdWVzdCAgID0gbnVsbDtcbiAgICAgICAgdGhpcy5wZW5kaW5nUGFnZUVycm9yID0gbnVsbDtcblxuICAgICAgICB0aGlzLmNvbnRyb2xsZXIgPSBudWxsO1xuICAgICAgICB0aGlzLmN0eCAgICAgICAgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB0aGlzLmZpeHR1cmVDdHggPSBudWxsO1xuICAgICAgICB0aGlzLnRlc3RSdW5DdHggPSBudWxsO1xuXG4gICAgICAgIHRoaXMuY3VycmVudFJvbGVJZCAgPSBudWxsO1xuICAgICAgICB0aGlzLnVzZWRSb2xlU3RhdGVzID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcblxuICAgICAgICB0aGlzLmVycnMgPSBbXTtcblxuICAgICAgICB0aGlzLmxhc3REcml2ZXJTdGF0dXNJZCAgICAgICA9IG51bGw7XG4gICAgICAgIHRoaXMubGFzdERyaXZlclN0YXR1c1Jlc3BvbnNlID0gbnVsbDtcblxuICAgICAgICB0aGlzLmZpbGVEb3dubG9hZGluZ0hhbmRsZWQgICAgICAgICAgICAgICA9IGZhbHNlO1xuICAgICAgICB0aGlzLnJlc29sdmVXYWl0Rm9yRmlsZURvd25sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5hdHRhY2htZW50RG93bmxvYWRpbmdIYW5kbGVkID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50ID0gMDtcblxuICAgICAgICB0aGlzLmRlYnVnZ2luZyAgICAgICAgICAgICAgID0gdGhpcy5vcHRzLmRlYnVnTW9kZSBhcyBib29sZWFuO1xuICAgICAgICB0aGlzLmRlYnVnT25GYWlsICAgICAgICAgICAgID0gdGhpcy5vcHRzLmRlYnVnT25GYWlsIGFzIGJvb2xlYW47XG4gICAgICAgIHRoaXMuZGlzYWJsZURlYnVnQnJlYWtwb2ludHMgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5kZWJ1Z1JlcG9ydGVyUGx1Z2luSG9zdCA9IG5ldyBSZXBvcnRlclBsdWdpbkhvc3QoeyBub0NvbG9yczogZmFsc2UgfSk7XG5cbiAgICAgICAgdGhpcy5icm93c2VyTWFuaXB1bGF0aW9uUXVldWUgPSBuZXcgQnJvd3Nlck1hbmlwdWxhdGlvblF1ZXVlKGJyb3dzZXJDb25uZWN0aW9uLCBzY3JlZW5zaG90Q2FwdHVyZXIsIHRoaXMud2FybmluZ0xvZyk7XG5cbiAgICAgICAgdGhpcy5kZWJ1Z0xvZyA9IG5ldyBUZXN0UnVuRGVidWdMb2codGhpcy5icm93c2VyQ29ubmVjdGlvbi51c2VyQWdlbnQpO1xuXG4gICAgICAgIHRoaXMucXVhcmFudGluZSAgPSBudWxsO1xuXG4gICAgICAgIHRoaXMuZGVidWdMb2dnZXIgPSB0aGlzLm9wdHMuZGVidWdMb2dnZXI7XG5cbiAgICAgICAgdGhpcy5vYnNlcnZlZENhbGxzaXRlcyAgICAgICAgICA9IG5ldyBPYnNlcnZlZENhbGxzaXRlc1N0b3JhZ2UoKTtcbiAgICAgICAgdGhpcy5jb21waWxlclNlcnZpY2UgICAgICAgICAgICA9IGNvbXBpbGVyU2VydmljZTtcbiAgICAgICAgdGhpcy5hc3luY0pzRXhwcmVzc2lvbkNhbGxzaXRlcyA9IG5ldyBNYXA8c3RyaW5nLCBDYWxsc2l0ZVJlY29yZD4oKTtcblxuICAgICAgICB0aGlzLnJlcGxpY2F0b3IgPSBjcmVhdGVSZXBsaWNhdG9yKFsgbmV3IFNlbGVjdG9yTm9kZVRyYW5zZm9ybSgpIF0pO1xuXG4gICAgICAgIHRoaXMuZGlzY29ubmVjdGVkICAgICAgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5lcnJTY3JlZW5zaG90UGF0aCA9IG51bGw7XG5cbiAgICAgICAgdGhpcy5zdGFydFJ1bkV4ZWN1dGlvblRpbWUgICAgID0gc3RhcnRSdW5FeGVjdXRpb25UaW1lO1xuICAgICAgICB0aGlzLnJ1bkV4ZWN1dGlvblRpbWVvdXQgICAgICAgPSB0aGlzLl9nZXRSdW5FeGVjdXRpb25UaW1lb3V0KG9wdHMpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0SG9va0V2ZW50UHJvdmlkZXIgPSB0aGlzLl9nZXRSZXF1ZXN0SG9va0V2ZW50UHJvdmlkZXIoKTtcblxuICAgICAgICB0aGlzLl9jb29raWVQcm92aWRlciA9IENvb2tpZVByb3ZpZGVyRmFjdG9yeS5jcmVhdGUodGhpcywgdGhpcy5vcHRzLnByb3h5bGVzcyBhcyBib29sZWFuKTtcblxuICAgICAgICB0aGlzLl9hZGRJbmplY3RhYmxlcygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFJlcXVlc3RIb29rRXZlbnRQcm92aWRlciAoKTogUmVxdWVzdEhvb2tFdmVudFByb3ZpZGVyIHtcbiAgICAgICAgaWYgKCF0aGlzLm9wdHMucHJveHlsZXNzKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5yZXF1ZXN0SG9va0V2ZW50UHJvdmlkZXI7XG5cbiAgICAgICAgY29uc3QgcnVudGltZUluZm8gPSB0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnByb3ZpZGVyLnBsdWdpbi5vcGVuZWRCcm93c2Vyc1t0aGlzLmJyb3dzZXJDb25uZWN0aW9uLmlkXTtcblxuICAgICAgICByZXR1cm4gcnVudGltZUluZm8ucHJveHlsZXNzLnJlcXVlc3RQaXBlbGluZS5yZXF1ZXN0SG9va0V2ZW50UHJvdmlkZXI7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0UGFnZUxvYWRUaW1lb3V0ICh0ZXN0OiBUZXN0LCBvcHRzOiBEaWN0aW9uYXJ5PE9wdGlvblZhbHVlPik6IG51bWJlciB7XG4gICAgICAgIGlmICh0ZXN0LnRpbWVvdXRzPy5wYWdlTG9hZFRpbWVvdXQgIT09IHZvaWQgMClcbiAgICAgICAgICAgIHJldHVybiB0ZXN0LnRpbWVvdXRzLnBhZ2VMb2FkVGltZW91dDtcblxuICAgICAgICByZXR1cm4gb3B0cy5wYWdlTG9hZFRpbWVvdXQgYXMgbnVtYmVyO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldFJlcXVlc3RUaW1lb3V0ICh0ZXN0OiBUZXN0LCBvcHRzOiBEaWN0aW9uYXJ5PE9wdGlvblZhbHVlPik6IFJlcXVlc3RUaW1lb3V0IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHBhZ2U6IHRlc3QudGltZW91dHM/LnBhZ2VSZXF1ZXN0VGltZW91dCB8fCBvcHRzLnBhZ2VSZXF1ZXN0VGltZW91dCBhcyBudW1iZXIsXG4gICAgICAgICAgICBhamF4OiB0ZXN0LnRpbWVvdXRzPy5hamF4UmVxdWVzdFRpbWVvdXQgfHwgb3B0cy5hamF4UmVxdWVzdFRpbWVvdXQgYXMgbnVtYmVyLFxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgX2dldEV4ZWN1dGlvblRpbWVvdXQgKHRpbWVvdXQ6IG51bWJlciwgZXJyb3I6IFRlc3RUaW1lb3V0RXJyb3IgfCBSdW5UaW1lb3V0RXJyb3IpOiBFeGVjdXRpb25UaW1lb3V0IHtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRpbWVvdXQsXG4gICAgICAgICAgICByZWplY3RXaXRoOiBlcnJvcixcbiAgICAgICAgfTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRUZXN0RXhlY3V0aW9uVGltZW91dCAob3B0czogRGljdGlvbmFyeTxPcHRpb25WYWx1ZT4pOiBFeGVjdXRpb25UaW1lb3V0IHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IHRlc3RFeGVjdXRpb25UaW1lb3V0ID0gb3B0cy50ZXN0RXhlY3V0aW9uVGltZW91dCBhcyBudW1iZXIgfHwgMDtcblxuICAgICAgICBpZiAoIXRlc3RFeGVjdXRpb25UaW1lb3V0KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEV4ZWN1dGlvblRpbWVvdXQodGVzdEV4ZWN1dGlvblRpbWVvdXQsIG5ldyBUZXN0VGltZW91dEVycm9yKHRlc3RFeGVjdXRpb25UaW1lb3V0KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZ2V0UnVuRXhlY3V0aW9uVGltZW91dCAob3B0czogRGljdGlvbmFyeTxPcHRpb25WYWx1ZT4pOiBFeGVjdXRpb25UaW1lb3V0IHwgbnVsbCB7XG4gICAgICAgIGNvbnN0IHJ1bkV4ZWN1dGlvblRpbWVvdXQgPSBvcHRzLnJ1bkV4ZWN1dGlvblRpbWVvdXQgYXMgbnVtYmVyIHx8IDA7XG5cbiAgICAgICAgaWYgKCFydW5FeGVjdXRpb25UaW1lb3V0KVxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2dldEV4ZWN1dGlvblRpbWVvdXQocnVuRXhlY3V0aW9uVGltZW91dCwgbmV3IFJ1blRpbWVvdXRFcnJvcihydW5FeGVjdXRpb25UaW1lb3V0KSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCByZXN0UnVuRXhlY3V0aW9uVGltZW91dCAoKTogRXhlY3V0aW9uVGltZW91dCB8IG51bGwge1xuICAgICAgICBpZiAoIXRoaXMuc3RhcnRSdW5FeGVjdXRpb25UaW1lIHx8ICF0aGlzLnJ1bkV4ZWN1dGlvblRpbWVvdXQpXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcblxuICAgICAgICBjb25zdCBjdXJyZW50VGltZW91dCA9IE1hdGgubWF4KHRoaXMucnVuRXhlY3V0aW9uVGltZW91dC50aW1lb3V0IC0gKERhdGUubm93KCkgLSB0aGlzLnN0YXJ0UnVuRXhlY3V0aW9uVGltZS5nZXRUaW1lKCkpLCAwKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fZ2V0RXhlY3V0aW9uVGltZW91dChjdXJyZW50VGltZW91dCwgdGhpcy5ydW5FeGVjdXRpb25UaW1lb3V0LnJlamVjdFdpdGgpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgZXhlY3V0aW9uVGltZW91dCAoKTogRXhlY3V0aW9uVGltZW91dCB8IG51bGwge1xuICAgICAgICByZXR1cm4gdGhpcy5yZXN0UnVuRXhlY3V0aW9uVGltZW91dCAmJiAoIXRoaXMudGVzdEV4ZWN1dGlvblRpbWVvdXQgfHwgdGhpcy5yZXN0UnVuRXhlY3V0aW9uVGltZW91dC50aW1lb3V0IDwgdGhpcy50ZXN0RXhlY3V0aW9uVGltZW91dC50aW1lb3V0KVxuICAgICAgICAgICAgPyB0aGlzLnJlc3RSdW5FeGVjdXRpb25UaW1lb3V0XG4gICAgICAgICAgICA6IHRoaXMudGVzdEV4ZWN1dGlvblRpbWVvdXQgfHwgbnVsbDtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9hZGRDbGllbnRTY3JpcHRDb250ZW50V2FybmluZ3NJZk5lY2Vzc2FyeSAoKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IHsgZW1wdHksIGR1cGxpY2F0ZWRDb250ZW50IH0gPSBmaW5kUHJvYmxlbWF0aWNTY3JpcHRzKHRoaXMudGVzdC5jbGllbnRTY3JpcHRzIGFzIENsaWVudFNjcmlwdFtdKTtcblxuICAgICAgICBpZiAoZW1wdHkubGVuZ3RoKVxuICAgICAgICAgICAgdGhpcy53YXJuaW5nTG9nLmFkZFdhcm5pbmcoV0FSTklOR19NRVNTQUdFLmNsaWVudFNjcmlwdHNXaXRoRW1wdHlDb250ZW50KTtcblxuICAgICAgICBpZiAoZHVwbGljYXRlZENvbnRlbnQubGVuZ3RoKSB7XG4gICAgICAgICAgICBjb25zdCBzdWZmaXggICAgICAgICAgICAgICAgICAgICAgICAgICAgPSBnZXRQbHVyYWxTdWZmaXgoZHVwbGljYXRlZENvbnRlbnQpO1xuICAgICAgICAgICAgY29uc3QgZHVwbGljYXRlZENvbnRlbnRDbGllbnRTY3JpcHRzU3RyID0gZ2V0Q29uY2F0ZW5hdGVkVmFsdWVzU3RyaW5nKGR1cGxpY2F0ZWRDb250ZW50LCAnXFxuJyk7XG5cbiAgICAgICAgICAgIHRoaXMud2FybmluZ0xvZy5hZGRXYXJuaW5nKFdBUk5JTkdfTUVTU0FHRS5jbGllbnRTY3JpcHRzV2l0aER1cGxpY2F0ZWRDb250ZW50LCBzdWZmaXgsIGR1cGxpY2F0ZWRDb250ZW50Q2xpZW50U2NyaXB0c1N0cik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBwcml2YXRlIF9hZGRJbmplY3RhYmxlcyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuX2FkZENsaWVudFNjcmlwdENvbnRlbnRXYXJuaW5nc0lmTmVjZXNzYXJ5KCk7XG4gICAgICAgIHRoaXMuaW5qZWN0YWJsZS5zY3JpcHRzLnB1c2goLi4uSU5KRUNUQUJMRVMuU0NSSVBUUyk7XG4gICAgICAgIHRoaXMuaW5qZWN0YWJsZS51c2VyU2NyaXB0cy5wdXNoKC4uLnRoaXMudGVzdC5jbGllbnRTY3JpcHRzLm1hcChzY3JpcHQgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB1cmw6ICBnZXRDdXN0b21DbGllbnRTY3JpcHRVcmwoc2NyaXB0IGFzIENsaWVudFNjcmlwdCksXG4gICAgICAgICAgICAgICAgcGFnZTogc2NyaXB0LnBhZ2UgYXMgUmVxdWVzdEZpbHRlclJ1bGUsXG4gICAgICAgICAgICB9O1xuICAgICAgICB9KSk7XG4gICAgICAgIHRoaXMuaW5qZWN0YWJsZS5zdHlsZXMucHVzaChJTkpFQ1RBQkxFUy5URVNUQ0FGRV9VSV9TVFlMRVMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgaWQgKCk6IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLnNlc3Npb24uaWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBpbmplY3RhYmxlICgpOiBJbmplY3RhYmxlUmVzb3VyY2VzIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuc2Vzc2lvbi5pbmplY3RhYmxlO1xuICAgIH1cblxuICAgIHB1YmxpYyBhZGRRdWFyYW50aW5lSW5mbyAocXVhcmFudGluZTogUXVhcmFudGluZSk6IHZvaWQge1xuICAgICAgICB0aGlzLnF1YXJhbnRpbmUgPSBxdWFyYW50aW5lO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2FkZFJlcXVlc3RIb29rIChob29rOiBSZXF1ZXN0SG9vayk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy50ZXN0LnJlcXVlc3RIb29rcy5pbmNsdWRlcyhob29rKSlcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLnRlc3QucmVxdWVzdEhvb2tzLnB1c2goaG9vayk7XG4gICAgICAgIGF3YWl0IHRoaXMuX2luaXRSZXF1ZXN0SG9vayhob29rKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9yZW1vdmVSZXF1ZXN0SG9vayAoaG9vazogUmVxdWVzdEhvb2spOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKCF0aGlzLnRlc3QucmVxdWVzdEhvb2tzLmluY2x1ZGVzKGhvb2spKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHB1bGwodGhpcy50ZXN0LnJlcXVlc3RIb29rcywgaG9vayk7XG4gICAgICAgIGF3YWl0IHRoaXMuX2Rpc3Bvc2VSZXF1ZXN0SG9vayhob29rKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9pbml0UmVxdWVzdEhvb2sgKGhvb2s6IFJlcXVlc3RIb29rKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGhvb2suX3dhcm5pbmdMb2cgPSB0aGlzLndhcm5pbmdMb2c7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwoaG9vay5fcmVxdWVzdEZpbHRlclJ1bGVzLm1hcChydWxlID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9yZXF1ZXN0SG9va0V2ZW50UHJvdmlkZXIuYWRkUmVxdWVzdEV2ZW50TGlzdGVuZXJzKHJ1bGUsIHtcbiAgICAgICAgICAgICAgICBvblJlcXVlc3Q6ICAgICAgICAgICBob29rLm9uUmVxdWVzdC5iaW5kKGhvb2spLFxuICAgICAgICAgICAgICAgIG9uQ29uZmlndXJlUmVzcG9uc2U6IGhvb2suX29uQ29uZmlndXJlUmVzcG9uc2UuYmluZChob29rKSxcbiAgICAgICAgICAgICAgICBvblJlc3BvbnNlOiAgICAgICAgICBob29rLm9uUmVzcG9uc2UuYmluZChob29rKSxcbiAgICAgICAgICAgIH0sIChlcnI6IFJlcXVlc3RIb29rTWV0aG9kRXJyb3IpID0+IHRoaXMuX29uUmVxdWVzdEhvb2tNZXRob2RFcnJvcihlcnIsIGhvb2suX2NsYXNzTmFtZSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfaW5pdFJlcXVlc3RIb29rRm9yQ29tcGlsZXJTZXJ2aWNlIChob29rSWQ6IHN0cmluZywgaG9va0NsYXNzTmFtZTogc3RyaW5nLCBydWxlczogUmVxdWVzdEZpbHRlclJ1bGVbXSk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB0ZXN0SWQgPSB0aGlzLnRlc3QuaWQ7XG5cbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocnVsZXMubWFwKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlcXVlc3RIb29rRXZlbnRQcm92aWRlci5hZGRSZXF1ZXN0RXZlbnRMaXN0ZW5lcnMocnVsZSwge1xuICAgICAgICAgICAgICAgIG9uUmVxdWVzdDogICAgICAgICAgIChldmVudDogUmVxdWVzdEV2ZW50KSA9PiB0aGlzLmNvbXBpbGVyU2VydmljZT8ub25SZXF1ZXN0SG9va0V2ZW50KHsgdGVzdElkLCBob29rSWQsIG5hbWU6IFJlcXVlc3RIb29rTWV0aG9kTmFtZXMub25SZXF1ZXN0LCBldmVudERhdGE6IGV2ZW50IH0pLFxuICAgICAgICAgICAgICAgIG9uQ29uZmlndXJlUmVzcG9uc2U6IChldmVudDogQ29uZmlndXJlUmVzcG9uc2VFdmVudCkgPT4gdGhpcy5jb21waWxlclNlcnZpY2U/Lm9uUmVxdWVzdEhvb2tFdmVudCh7IHRlc3RJZCwgaG9va0lkLCBuYW1lOiBSZXF1ZXN0SG9va01ldGhvZE5hbWVzLl9vbkNvbmZpZ3VyZVJlc3BvbnNlLCBldmVudERhdGE6IGV2ZW50IH0pLFxuICAgICAgICAgICAgICAgIG9uUmVzcG9uc2U6ICAgICAgICAgIChldmVudDogUmVzcG9uc2VFdmVudCkgPT4gdGhpcy5jb21waWxlclNlcnZpY2U/Lm9uUmVxdWVzdEhvb2tFdmVudCh7IHRlc3RJZCwgaG9va0lkLCBuYW1lOiBSZXF1ZXN0SG9va01ldGhvZE5hbWVzLm9uUmVzcG9uc2UsIGV2ZW50RGF0YTogZXZlbnQgfSksXG4gICAgICAgICAgICB9LCBlcnIgPT4gdGhpcy5fb25SZXF1ZXN0SG9va01ldGhvZEVycm9yKGVyciwgaG9va0NsYXNzTmFtZSkpO1xuICAgICAgICB9KSk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfb25SZXF1ZXN0SG9va01ldGhvZEVycm9yIChldmVudDogUmVxdWVzdEhvb2tNZXRob2RFcnJvciwgaG9va0NsYXNzTmFtZTogc3RyaW5nKTogdm9pZCB7XG4gICAgICAgIGxldCBlcnI6IEVycm9yIHwgVGVzdFJ1bkVycm9yQmFzZSAgICAgICAgICAgID0gZXZlbnQuZXJyb3I7XG4gICAgICAgIGNvbnN0IGlzUmVxdWVzdEhvb2tOb3RJbXBsZW1lbnRlZE1ldGhvZEVycm9yID0gKGVyciBhcyB1bmtub3duIGFzIFRlc3RSdW5FcnJvckJhc2UpPy5jb2RlID09PSBURVNUX1JVTl9FUlJPUlMucmVxdWVzdEhvb2tOb3RJbXBsZW1lbnRlZEVycm9yO1xuXG4gICAgICAgIGlmICghaXNSZXF1ZXN0SG9va05vdEltcGxlbWVudGVkTWV0aG9kRXJyb3IpXG4gICAgICAgICAgICBlcnIgPSBuZXcgUmVxdWVzdEhvb2tVbmhhbmRsZWRFcnJvcihlcnIsIGhvb2tDbGFzc05hbWUsIGV2ZW50Lm1ldGhvZE5hbWUpO1xuXG4gICAgICAgIHRoaXMuYWRkRXJyb3IoZXJyKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9kaXNwb3NlUmVxdWVzdEhvb2sgKGhvb2s6IFJlcXVlc3RIb29rKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGhvb2suX3dhcm5pbmdMb2cgPSBudWxsO1xuXG4gICAgICAgIGF3YWl0IFByb21pc2UuYWxsKGhvb2suX3JlcXVlc3RGaWx0ZXJSdWxlcy5tYXAocnVsZSA9PiB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fcmVxdWVzdEhvb2tFdmVudFByb3ZpZGVyLnJlbW92ZVJlcXVlc3RFdmVudExpc3RlbmVycyhydWxlKTtcbiAgICAgICAgfSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2RldGFjaFJlcXVlc3RFdmVudExpc3RlbmVycyAocnVsZXM6IFJlcXVlc3RGaWx0ZXJSdWxlW10pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocnVsZXMubWFwKHJ1bGUgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlcXVlc3RIb29rRXZlbnRQcm92aWRlci5yZW1vdmVSZXF1ZXN0RXZlbnRMaXN0ZW5lcnMocnVsZSk7XG4gICAgICAgIH0pKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9zdWJzY3JpYmVPbkNvbXBpbGVyU2VydmljZUV2ZW50cyAoKTogdm9pZCB7XG4gICAgICAgIENPTVBJTEVSX1NFUlZJQ0VfRVZFTlRTLmZvckVhY2goZXZlbnROYW1lID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmNvbXBpbGVyU2VydmljZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29tcGlsZXJTZXJ2aWNlLm9uKGV2ZW50TmFtZSwgYXN5bmMgYXJncyA9PiB7XG4gICAgICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5zZXNzaW9uW2V2ZW50TmFtZV0oLi4uYXJncyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbXBpbGVyU2VydmljZSkge1xuICAgICAgICAgICAgdGhpcy5jb21waWxlclNlcnZpY2Uub24oJ2FkZFJlcXVlc3RFdmVudExpc3RlbmVycycsIGFzeW5jICh7IGhvb2tJZCwgaG9va0NsYXNzTmFtZSwgcnVsZXMgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2luaXRSZXF1ZXN0SG9va0ZvckNvbXBpbGVyU2VydmljZShob29rSWQsIGhvb2tDbGFzc05hbWUsIHJ1bGVzKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmNvbXBpbGVyU2VydmljZS5vbigncmVtb3ZlUmVxdWVzdEV2ZW50TGlzdGVuZXJzJywgYXN5bmMgKHsgcnVsZXMgfSkgPT4ge1xuICAgICAgICAgICAgICAgIGF3YWl0IHRoaXMuX2RldGFjaFJlcXVlc3RFdmVudExpc3RlbmVycyhydWxlcyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2luaXRSZXF1ZXN0SG9va3MgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5jb21waWxlclNlcnZpY2UpIHtcbiAgICAgICAgICAgIHRoaXMuX3N1YnNjcmliZU9uQ29tcGlsZXJTZXJ2aWNlRXZlbnRzKCk7XG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnRlc3QucmVxdWVzdEhvb2tzLm1hcChob29rID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5faW5pdFJlcXVlc3RIb29rRm9yQ29tcGlsZXJTZXJ2aWNlKGhvb2suaWQsIGhvb2suX2NsYXNzTmFtZSwgaG9vay5fcmVxdWVzdEZpbHRlclJ1bGVzKTtcbiAgICAgICAgICAgIH0pKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlXG4gICAgICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnRlc3QucmVxdWVzdEhvb2tzLm1hcChob29rID0+IHRoaXMuX2luaXRSZXF1ZXN0SG9vayhob29rKSkpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3ByZXBhcmVTa2lwSnNFcnJvcnNPcHRpb24gKCk6IGJvb2xlYW4gfCBFeGVjdXRlQ2xpZW50RnVuY3Rpb25Db21tYW5kIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMudGVzdC5za2lwSnNFcnJvcnNPcHRpb25zICE9PSB2b2lkIDBcbiAgICAgICAgICAgID8gdGhpcy50ZXN0LnNraXBKc0Vycm9yc09wdGlvbnNcbiAgICAgICAgICAgIDogdGhpcy5vcHRzLnNraXBKc0Vycm9ycyBhcyBTa2lwSnNFcnJvcnNPcHRpb25zT2JqZWN0IHwgYm9vbGVhbiB8fCBmYWxzZTtcblxuICAgICAgICByZXR1cm4gcHJlcGFyZVNraXBKc0Vycm9yc09wdGlvbnMob3B0aW9ucyk7XG4gICAgfVxuXG4gICAgLy8gSGFtbWVyaGVhZCBwYXlsb2FkXG4gICAgcHVibGljIGFzeW5jIGdldFBheWxvYWRTY3JpcHQgKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIHRoaXMuZmlsZURvd25sb2FkaW5nSGFuZGxlZCAgICAgICAgICAgICAgID0gZmFsc2U7XG4gICAgICAgIHRoaXMucmVzb2x2ZVdhaXRGb3JGaWxlRG93bmxvYWRpbmdQcm9taXNlID0gbnVsbDtcblxuICAgICAgICBjb25zdCBza2lwSnNFcnJvcnMgPSB0aGlzLl9wcmVwYXJlU2tpcEpzRXJyb3JzT3B0aW9uKCk7XG5cbiAgICAgICAgcmV0dXJuIE11c3RhY2hlLnJlbmRlcihURVNUX1JVTl9URU1QTEFURSwge1xuICAgICAgICAgICAgdGVzdFJ1bklkOiAgICAgICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5zZXNzaW9uLmlkKSxcbiAgICAgICAgICAgIGJyb3dzZXJJZDogICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uaWQpLFxuICAgICAgICAgICAgYnJvd3NlckhlYXJ0YmVhdFJlbGF0aXZlVXJsOiAgICAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5icm93c2VyQ29ubmVjdGlvbi5oZWFydGJlYXRSZWxhdGl2ZVVybCksXG4gICAgICAgICAgICBicm93c2VyU3RhdHVzUmVsYXRpdmVVcmw6ICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnN0YXR1c1JlbGF0aXZlVXJsKSxcbiAgICAgICAgICAgIGJyb3dzZXJTdGF0dXNEb25lUmVsYXRpdmVVcmw6ICAgICAgIEpTT04uc3RyaW5naWZ5KHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uc3RhdHVzRG9uZVJlbGF0aXZlVXJsKSxcbiAgICAgICAgICAgIGJyb3dzZXJJZGxlUmVsYXRpdmVVcmw6ICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uaWRsZVJlbGF0aXZlVXJsKSxcbiAgICAgICAgICAgIGJyb3dzZXJBY3RpdmVXaW5kb3dJZFVybDogICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uYWN0aXZlV2luZG93SWRVcmwpLFxuICAgICAgICAgICAgYnJvd3NlckNsb3NlV2luZG93VXJsOiAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5icm93c2VyQ29ubmVjdGlvbi5jbG9zZVdpbmRvd1VybCksXG4gICAgICAgICAgICBicm93c2VyT3BlbkZpbGVQcm90b2NvbFJlbGF0aXZlVXJsOiBKU09OLnN0cmluZ2lmeSh0aGlzLmJyb3dzZXJDb25uZWN0aW9uLm9wZW5GaWxlUHJvdG9jb2xSZWxhdGl2ZVVybCksXG4gICAgICAgICAgICB1c2VyQWdlbnQ6ICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnVzZXJBZ2VudCksXG4gICAgICAgICAgICB0ZXN0TmFtZTogICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLnRlc3QubmFtZSksXG4gICAgICAgICAgICBmaXh0dXJlTmFtZTogICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSgodGhpcy50ZXN0LmZpeHR1cmUgYXMgRml4dHVyZSkubmFtZSksXG4gICAgICAgICAgICBzZWxlY3RvclRpbWVvdXQ6ICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdHMuc2VsZWN0b3JUaW1lb3V0LFxuICAgICAgICAgICAgcGFnZUxvYWRUaW1lb3V0OiAgICAgICAgICAgICAgICAgICAgdGhpcy5wYWdlTG9hZFRpbWVvdXQsXG4gICAgICAgICAgICBjaGlsZFdpbmRvd1JlYWR5VGltZW91dDogICAgICAgICAgICBDSElMRF9XSU5ET1dfUkVBRFlfVElNRU9VVCxcbiAgICAgICAgICAgIHNraXBKc0Vycm9yczogICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHNraXBKc0Vycm9ycyksXG4gICAgICAgICAgICByZXRyeVRlc3RQYWdlczogICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdHMucmV0cnlUZXN0UGFnZXMsXG4gICAgICAgICAgICBzcGVlZDogICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNwZWVkLFxuICAgICAgICAgICAgZGlhbG9nSGFuZGxlcjogICAgICAgICAgICAgICAgICAgICAgSlNPTi5zdHJpbmdpZnkodGhpcy5hY3RpdmVEaWFsb2dIYW5kbGVyKSxcbiAgICAgICAgICAgIGNhblVzZURlZmF1bHRXaW5kb3dBY3Rpb25zOiAgICAgICAgIEpTT04uc3RyaW5naWZ5KGF3YWl0IHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uY2FuVXNlRGVmYXVsdFdpbmRvd0FjdGlvbnMoKSksXG4gICAgICAgICAgICBwcm94eWxlc3M6ICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLm9wdHMucHJveHlsZXNzKSxcbiAgICAgICAgICAgIGRvbWFpbjogICAgICAgICAgICAgICAgICAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHRoaXMuYnJvd3NlckNvbm5lY3Rpb24uYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LnByb3h5LnNlcnZlcjFJbmZvLmRvbWFpbiksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBnZXRJZnJhbWVQYXlsb2FkU2NyaXB0ICgpOiBQcm9taXNlPHN0cmluZz4ge1xuICAgICAgICByZXR1cm4gTXVzdGFjaGUucmVuZGVyKElGUkFNRV9URVNUX1JVTl9URU1QTEFURSwge1xuICAgICAgICAgICAgdGVzdFJ1bklkOiAgICAgICBKU09OLnN0cmluZ2lmeSh0aGlzLnNlc3Npb24uaWQpLFxuICAgICAgICAgICAgc2VsZWN0b3JUaW1lb3V0OiB0aGlzLm9wdHMuc2VsZWN0b3JUaW1lb3V0LFxuICAgICAgICAgICAgcGFnZUxvYWRUaW1lb3V0OiB0aGlzLnBhZ2VMb2FkVGltZW91dCxcbiAgICAgICAgICAgIHJldHJ5VGVzdFBhZ2VzOiAgISF0aGlzLm9wdHMucmV0cnlUZXN0UGFnZXMsXG4gICAgICAgICAgICBzcGVlZDogICAgICAgICAgIHRoaXMuc3BlZWQsXG4gICAgICAgICAgICBkaWFsb2dIYW5kbGVyOiAgIEpTT04uc3RyaW5naWZ5KHRoaXMuYWN0aXZlRGlhbG9nSGFuZGxlciksXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIC8vIEhhbW1lcmhlYWQgaGFuZGxlcnNcbiAgICBwdWJsaWMgZ2V0QXV0aENyZWRlbnRpYWxzICgpOiBudWxsIHwgQXV0aENyZWRlbnRpYWxzIHtcbiAgICAgICAgcmV0dXJuIHRoaXMudGVzdC5hdXRoQ3JlZGVudGlhbHM7XG4gICAgfVxuXG4gICAgcHVibGljIGhhbmRsZUZpbGVEb3dubG9hZCAoKTogdm9pZCB7XG4gICAgICAgIGlmICh0aGlzLnJlc29sdmVXYWl0Rm9yRmlsZURvd25sb2FkaW5nUHJvbWlzZSkge1xuICAgICAgICAgICAgdGhpcy5yZXNvbHZlV2FpdEZvckZpbGVEb3dubG9hZGluZ1Byb21pc2UodHJ1ZSk7XG4gICAgICAgICAgICB0aGlzLnJlc29sdmVXYWl0Rm9yRmlsZURvd25sb2FkaW5nUHJvbWlzZSA9IG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgdGhpcy5maWxlRG93bmxvYWRpbmdIYW5kbGVkID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBwdWJsaWMgaGFuZGxlQXR0YWNobWVudCAoZGF0YTogeyBpc09wZW5lZEluTmV3V2luZG93OiBib29sZWFuIH0pOiB2b2lkIHtcbiAgICAgICAgaWYgKGRhdGEuaXNPcGVuZWRJbk5ld1dpbmRvdylcbiAgICAgICAgICAgIHRoaXMuYXR0YWNobWVudERvd25sb2FkaW5nSGFuZGxlZCA9IHRydWU7XG4gICAgfVxuXG4gICAgcHVibGljIGhhbmRsZVBhZ2VFcnJvciAoY3R4OiBhbnksIGVycjogRXJyb3IpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5wZW5kaW5nUGFnZUVycm9yID0gbmV3IFBhZ2VMb2FkRXJyb3IoZXJyLCBjdHgucmVxT3B0cy51cmwpO1xuXG4gICAgICAgIGN0eC5yZWRpcmVjdChjdHgudG9Qcm94eVVybChTUEVDSUFMX0VSUk9SX1BBR0UpKTtcbiAgICB9XG5cbiAgICAvLyBUZXN0IGZ1bmN0aW9uIGV4ZWN1dGlvblxuICAgIHByaXZhdGUgYXN5bmMgX2V4ZWN1dGVUZXN0Rm4gKHBoYXNlOiBUZXN0UnVuUGhhc2UsIGZuOiBGdW5jdGlvbiwgdGltZW91dDogRXhlY3V0aW9uVGltZW91dCB8IG51bGwpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgdGhpcy5waGFzZSA9IHBoYXNlO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBhd2FpdCBleGVjdXRlRm5XaXRoVGltZW91dChmbiwgdGltZW91dCwgdGhpcyk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycjogYW55KSB7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9tYWtlU2NyZWVuc2hvdE9uRmFpbCgpO1xuXG4gICAgICAgICAgICB0aGlzLmFkZEVycm9yKGVycik7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmaW5hbGx5IHtcbiAgICAgICAgICAgIHRoaXMuZXJyU2NyZWVuc2hvdFBhdGggPSBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuICF0aGlzLl9hZGRQZW5kaW5nUGFnZUVycm9ySWZBbnkoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ydW5CZWZvcmVIb29rICgpOiBQcm9taXNlPGJvb2xlYW4+IHtcbiAgICAgICAgaWYgKHRoaXMudGVzdC5nbG9iYWxCZWZvcmVGbilcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2V4ZWN1dGVUZXN0Rm4oVGVzdFJ1blBoYXNlLmluVGVzdEJlZm9yZUhvb2ssIHRoaXMudGVzdC5nbG9iYWxCZWZvcmVGbiwgdGhpcy5leGVjdXRpb25UaW1lb3V0KTtcblxuICAgICAgICBpZiAodGhpcy50ZXN0LmJlZm9yZUZuKVxuICAgICAgICAgICAgcmV0dXJuIGF3YWl0IHRoaXMuX2V4ZWN1dGVUZXN0Rm4oVGVzdFJ1blBoYXNlLmluVGVzdEJlZm9yZUhvb2ssIHRoaXMudGVzdC5iZWZvcmVGbiwgdGhpcy5leGVjdXRpb25UaW1lb3V0KTtcblxuICAgICAgICBpZiAodGhpcy50ZXN0LmZpeHR1cmU/LmJlZm9yZUVhY2hGbilcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9leGVjdXRlVGVzdEZuKFRlc3RSdW5QaGFzZS5pbkZpeHR1cmVCZWZvcmVFYWNoSG9vaywgdGhpcy50ZXN0LmZpeHR1cmU/LmJlZm9yZUVhY2hGbiwgdGhpcy5leGVjdXRpb25UaW1lb3V0KTtcblxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9ydW5BZnRlckhvb2sgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy50ZXN0LmFmdGVyRm4pXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9leGVjdXRlVGVzdEZuKFRlc3RSdW5QaGFzZS5pblRlc3RBZnRlckhvb2ssIHRoaXMudGVzdC5hZnRlckZuLCB0aGlzLmV4ZWN1dGlvblRpbWVvdXQpO1xuICAgICAgICBlbHNlIGlmICh0aGlzLnRlc3QuZml4dHVyZT8uYWZ0ZXJFYWNoRm4pXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9leGVjdXRlVGVzdEZuKFRlc3RSdW5QaGFzZS5pbkZpeHR1cmVBZnRlckVhY2hIb29rLCB0aGlzLnRlc3QuZml4dHVyZT8uYWZ0ZXJFYWNoRm4sIHRoaXMuZXhlY3V0aW9uVGltZW91dCk7XG5cbiAgICAgICAgaWYgKHRoaXMudGVzdC5nbG9iYWxBZnRlckZuKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fZXhlY3V0ZVRlc3RGbihUZXN0UnVuUGhhc2UuaW5UZXN0QWZ0ZXJIb29rLCB0aGlzLnRlc3QuZ2xvYmFsQWZ0ZXJGbiwgdGhpcy5leGVjdXRpb25UaW1lb3V0KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9maW5hbGl6ZVRlc3RSdW4gKGlkOiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuY29tcGlsZXJTZXJ2aWNlKSB7XG4gICAgICAgICAgICBjb25zdCB3YXJuaW5ncyA9IGF3YWl0IHRoaXMuY29tcGlsZXJTZXJ2aWNlLmdldFdhcm5pbmdNZXNzYWdlcyh7IHRlc3RSdW5JZDogaWQgfSk7XG5cbiAgICAgICAgICAgIHdhcm5pbmdzLmZvckVhY2god2FybmluZyA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXJuaW5nTG9nLmFkZFdhcm5pbmcod2FybmluZyk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlclNlcnZpY2UucmVtb3ZlVGVzdFJ1bkZyb21TdGF0ZSh7IHRlc3RSdW5JZDogaWQgfSk7XG4gICAgICAgIH1cblxuICAgICAgICB0ZXN0UnVuVHJhY2tlci5yZW1vdmVBY3RpdmVUZXN0UnVuKGlkKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgc3RhcnQgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICB0ZXN0UnVuVHJhY2tlci5hZGRBY3RpdmVUZXN0UnVuKHRoaXMpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuZW1pdCgnc3RhcnQnKTtcblxuICAgICAgICBjb25zdCBvbkRpc2Nvbm5lY3RlZCA9IChlcnI6IEVycm9yKTogdm9pZCA9PiB0aGlzLl9kaXNjb25uZWN0KGVycik7XG5cbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbi5vbmNlKCdkaXNjb25uZWN0ZWQnLCBvbkRpc2Nvbm5lY3RlZCk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5vbmNlKCdjb25uZWN0ZWQnKTtcblxuICAgICAgICBhd2FpdCB0aGlzLmVtaXQoJ3JlYWR5Jyk7XG5cbiAgICAgICAgaWYgKGF3YWl0IHRoaXMuX3J1bkJlZm9yZUhvb2soKSkge1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5fZXhlY3V0ZVRlc3RGbihUZXN0UnVuUGhhc2UuaW5UZXN0LCB0aGlzLnRlc3QuZm4gYXMgRnVuY3Rpb24sIHRoaXMuZXhlY3V0aW9uVGltZW91dCk7XG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9ydW5BZnRlckhvb2soKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLmRpc2Nvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICB0aGlzLnBoYXNlID0gVGVzdFJ1blBoYXNlLnBlbmRpbmdGaW5hbGl6YXRpb247XG5cbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbi5yZW1vdmVMaXN0ZW5lcignZGlzY29ubmVjdGVkJywgb25EaXNjb25uZWN0ZWQpO1xuXG4gICAgICAgIGlmICh0aGlzLmVycnMubGVuZ3RoICYmIHRoaXMuZGVidWdPbkZhaWwpIHtcbiAgICAgICAgICAgIGNvbnN0IGVyclN0ciA9IHRoaXMuZGVidWdSZXBvcnRlclBsdWdpbkhvc3QuZm9ybWF0RXJyb3IodGhpcy5lcnJzWzBdKTtcblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fZW5xdWV1ZVNldEJyZWFrcG9pbnRDb21tYW5kKHZvaWQgMCwgZXJyU3RyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGF3YWl0IHRoaXMuZW1pdCgnYmVmb3JlLWRvbmUnKTtcblxuICAgICAgICBhd2FpdCB0aGlzLl9pbnRlcm5hbEV4ZWN1dGVDb21tYW5kKG5ldyBzZXJ2aWNlQ29tbWFuZHMuVGVzdERvbmVDb21tYW5kKCkpO1xuXG4gICAgICAgIHRoaXMuX2FkZFBlbmRpbmdQYWdlRXJyb3JJZkFueSgpO1xuICAgICAgICB0aGlzLl9yZXF1ZXN0SG9va0V2ZW50UHJvdmlkZXIuY2xlYXJSZXF1ZXN0RXZlbnRMaXN0ZW5lcnMoKTtcbiAgICAgICAgdGhpcy5ub3JtYWxpemVSZXF1ZXN0SG9va0Vycm9ycygpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX2ZpbmFsaXplVGVzdFJ1bih0aGlzLnNlc3Npb24uaWQpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuZW1pdCgnZG9uZScpO1xuICAgIH1cblxuICAgIC8vIEVycm9yc1xuICAgIHByaXZhdGUgX2FkZFBlbmRpbmdQYWdlRXJyb3JJZkFueSAoKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLnBlbmRpbmdQYWdlRXJyb3IpIHtcbiAgICAgICAgICAgIHRoaXMuYWRkRXJyb3IodGhpcy5wZW5kaW5nUGFnZUVycm9yKTtcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ1BhZ2VFcnJvciA9IG51bGw7XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Vuc3VyZUVycm9ySWQgKGVycjogRXJyb3IpOiB2b2lkIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBlcnIuaWQgPSBlcnIuaWQgfHwgbmFub2lkKDcpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2NyZWF0ZUVycm9yQWRhcHRlciAoZXJyOiBFcnJvcik6IFRlc3RSdW5FcnJvckZvcm1hdHRhYmxlQWRhcHRlciB7XG4gICAgICAgIHRoaXMuX2Vuc3VyZUVycm9ySWQoZXJyKTtcblxuICAgICAgICByZXR1cm4gbmV3IFRlc3RSdW5FcnJvckZvcm1hdHRhYmxlQWRhcHRlcihlcnIsIHtcbiAgICAgICAgICAgIHVzZXJBZ2VudDogICAgICB0aGlzLmJyb3dzZXJDb25uZWN0aW9uLnVzZXJBZ2VudCxcbiAgICAgICAgICAgIHNjcmVlbnNob3RQYXRoOiB0aGlzLmVyclNjcmVlbnNob3RQYXRoIHx8ICcnLFxuICAgICAgICAgICAgdGVzdFJ1bklkOiAgICAgIHRoaXMuaWQsXG4gICAgICAgICAgICB0ZXN0UnVuUGhhc2U6ICAgdGhpcy5waGFzZSxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFkZEVycm9yIChlcnI6IEVycm9yIHwgVGVzdENhZmVFcnJvckxpc3QgfCBUZXN0UnVuRXJyb3JCYXNlKTogdm9pZCB7XG4gICAgICAgIGNvbnN0IGVyckxpc3QgPSAoZXJyIGluc3RhbmNlb2YgVGVzdENhZmVFcnJvckxpc3QgPyBlcnIuaXRlbXMgOiBbZXJyXSkgYXMgRXJyb3JbXTtcblxuICAgICAgICBlcnJMaXN0LmZvckVhY2goaXRlbSA9PiB7XG4gICAgICAgICAgICBjb25zdCBhZGFwdGVyID0gdGhpcy5fY3JlYXRlRXJyb3JBZGFwdGVyKGl0ZW0pO1xuXG4gICAgICAgICAgICB0aGlzLmVycnMucHVzaChhZGFwdGVyKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIG5vcm1hbGl6ZVJlcXVlc3RIb29rRXJyb3JzICgpOiB2b2lkIHtcbiAgICAgICAgY29uc3QgcmVxdWVzdEhvb2tFcnJvcnMgPSByZW1vdmUodGhpcy5lcnJzLCBlID0+XG4gICAgICAgICAgICAoZSBhcyB1bmtub3duIGFzIFRlc3RSdW5FcnJvckJhc2UpLmNvZGUgPT09IFRFU1RfUlVOX0VSUk9SUy5yZXF1ZXN0SG9va05vdEltcGxlbWVudGVkRXJyb3IgfHxcbiAgICAgICAgICAgIChlIGFzIHVua25vd24gYXMgVGVzdFJ1bkVycm9yQmFzZSkuY29kZSA9PT0gVEVTVF9SVU5fRVJST1JTLnJlcXVlc3RIb29rVW5oYW5kbGVkRXJyb3IpO1xuXG4gICAgICAgIGlmICghcmVxdWVzdEhvb2tFcnJvcnMubGVuZ3RoKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHVuaXFSZXF1ZXN0SG9va0Vycm9ycyA9IGNoYWluKHJlcXVlc3RIb29rRXJyb3JzKVxuICAgICAgICAgICAgLnVuaXFCeShlID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBlcnIgPSBlIGFzIHVua25vd24gYXMgUmVxdWVzdEhvb2tCYXNlRXJyb3I7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZXJyLmhvb2tDbGFzc05hbWUgKyBlcnIubWV0aG9kTmFtZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuc29ydEJ5KFsnaG9va0NsYXNzTmFtZScsICdtZXRob2ROYW1lJ10pXG4gICAgICAgICAgICAudmFsdWUoKTtcblxuICAgICAgICB0aGlzLmVycnMgPSB0aGlzLmVycnMuY29uY2F0KHVuaXFSZXF1ZXN0SG9va0Vycm9ycyk7XG4gICAgfVxuXG4gICAgLy8gVGFzayBxdWV1ZVxuICAgIHByaXZhdGUgX2VucXVldWVDb21tYW5kIChjb21tYW5kOiBDb21tYW5kQmFzZSwgY2FsbHNpdGU6IENhbGxzaXRlUmVjb3JkKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgICAgIGlmICh0aGlzLnBlbmRpbmdSZXF1ZXN0KVxuICAgICAgICAgICAgdGhpcy5fcmVzb2x2ZVBlbmRpbmdSZXF1ZXN0KGNvbW1hbmQpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShhc3luYyAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tYXN5bmMtcHJvbWlzZS1leGVjdXRvclxuICAgICAgICAgICAgdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50LS07XG4gICAgICAgICAgICB0aGlzLmRyaXZlclRhc2tRdWV1ZS5wdXNoKHsgY29tbWFuZCwgcmVzb2x2ZSwgcmVqZWN0LCBjYWxsc2l0ZSB9KTtcblxuICAgICAgICAgICAgaWYgKCF0aGlzLmFkZGluZ0RyaXZlclRhc2tzQ291bnQpXG4gICAgICAgICAgICAgICAgYXdhaXQgdGhpcy5lbWl0KEFMTF9EUklWRVJfVEFTS1NfQURERURfVE9fUVVFVUVfRVZFTlQsIHRoaXMuZHJpdmVyVGFza1F1ZXVlLmxlbmd0aCk7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHB1YmxpYyBnZXQgZHJpdmVyVGFza1F1ZXVlTGVuZ3RoICgpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgICAgICByZXR1cm4gdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50ID8gcHJvbWlzaWZ5RXZlbnQodGhpcyBhcyB1bmtub3duIGFzIEV2ZW50RW1pdHRlciwgQUxMX0RSSVZFUl9UQVNLU19BRERFRF9UT19RVUVVRV9FVkVOVCkgOiBQcm9taXNlLnJlc29sdmUodGhpcy5kcml2ZXJUYXNrUXVldWUubGVuZ3RoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgX2VucXVldWVCcm93c2VyQ29uc29sZU1lc3NhZ2VzQ29tbWFuZCAoY29tbWFuZDogQ29tbWFuZEJhc2UsIGNhbGxzaXRlOiBDYWxsc2l0ZVJlY29yZCk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9lbnF1ZXVlQ29tbWFuZChjb21tYW5kLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgY29uc3QgY29uc29sZU1lc3NhZ2VDb3B5ID0gdGhpcy5jb25zb2xlTWVzc2FnZXMuZ2V0Q29weSgpO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgcmV0dXJuIGNvbnNvbGVNZXNzYWdlQ29weVtTdHJpbmcodGhpcy5hY3RpdmVXaW5kb3dJZCldO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBfZW5xdWV1ZUdldENvb2tpZXMgKGNvbW1hbmQ6IEdldENvb2tpZXNDb21tYW5kKTogUHJvbWlzZTxQYXJ0aWFsPENvb2tpZU9wdGlvbnM+W10+IHtcbiAgICAgICAgY29uc3QgeyBjb29raWVzLCB1cmxzIH0gPSBjb21tYW5kO1xuXG4gICAgICAgIHJldHVybiB0aGlzLl9jb29raWVQcm92aWRlci5nZXRDb29raWVzKGNvb2tpZXMsIHVybHMpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBfZW5xdWV1ZVNldENvb2tpZXMgKGNvbW1hbmQ6IFNldENvb2tpZXNDb21tYW5kKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IGNvb2tpZXMgPSBjb21tYW5kLmNvb2tpZXM7XG4gICAgICAgIGNvbnN0IHVybCAgICAgPSBjb21tYW5kLnVybCB8fCBhd2FpdCB0aGlzLmdldEN1cnJlbnRVcmwoKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fY29va2llUHJvdmlkZXIuc2V0Q29va2llcyhjb29raWVzLCB1cmwpO1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBfZW5xdWV1ZURlbGV0ZUNvb2tpZXMgKGNvbW1hbmQ6IERlbGV0ZUNvb2tpZXNDb21tYW5kKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGNvbnN0IHsgY29va2llcywgdXJscyB9ID0gY29tbWFuZDtcblxuICAgICAgICByZXR1cm4gdGhpcy5fY29va2llUHJvdmlkZXIuZGVsZXRlQ29va2llcyhjb29raWVzLCB1cmxzKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9lbnF1ZXVlU2V0QnJlYWtwb2ludENvbW1hbmQgKGNhbGxzaXRlOiBDYWxsc2l0ZVJlY29yZCB8IHVuZGVmaW5lZCwgZXJyb3I/OiBzdHJpbmcpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMuZGVidWdMb2dnZXIpXG4gICAgICAgICAgICB0aGlzLmRlYnVnTG9nZ2VyLnNob3dCcmVha3BvaW50KHRoaXMuc2Vzc2lvbi5pZCwgdGhpcy5icm93c2VyQ29ubmVjdGlvbi51c2VyQWdlbnQsIGNhbGxzaXRlLCBlcnJvcik7XG5cbiAgICAgICAgdGhpcy5kZWJ1Z2dpbmcgPSBhd2FpdCB0aGlzLl9pbnRlcm5hbEV4ZWN1dGVDb21tYW5kKG5ldyBzZXJ2aWNlQ29tbWFuZHMuU2V0QnJlYWtwb2ludENvbW1hbmQoISFlcnJvciwgISF0aGlzLmNvbXBpbGVyU2VydmljZSksIGNhbGxzaXRlKSBhcyBib29sZWFuO1xuICAgIH1cblxuICAgIHByaXZhdGUgX3JlbW92ZUFsbE5vblNlcnZpY2VUYXNrcyAoKTogdm9pZCB7XG4gICAgICAgIHRoaXMuZHJpdmVyVGFza1F1ZXVlID0gdGhpcy5kcml2ZXJUYXNrUXVldWUuZmlsdGVyKGRyaXZlclRhc2sgPT4gaXNTZXJ2aWNlQ29tbWFuZChkcml2ZXJUYXNrLmNvbW1hbmQpKTtcblxuICAgICAgICB0aGlzLmJyb3dzZXJNYW5pcHVsYXRpb25RdWV1ZS5yZW1vdmVBbGxOb25TZXJ2aWNlTWFuaXB1bGF0aW9ucygpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2hhbmRsZURlYnVnU3RhdGUgKGRyaXZlclN0YXR1czogRHJpdmVyU3RhdHVzKTogdm9pZCB7XG4gICAgICAgIGlmIChkcml2ZXJTdGF0dXMuZGVidWcpXG4gICAgICAgICAgICB0aGlzLmVtaXQoZHJpdmVyU3RhdHVzLmRlYnVnKTtcbiAgICB9XG5cbiAgICAvLyBDdXJyZW50IGRyaXZlciB0YXNrXG4gICAgcHVibGljIGdldCBjdXJyZW50RHJpdmVyVGFzayAoKTogRHJpdmVyVGFzayB7XG4gICAgICAgIHJldHVybiB0aGlzLmRyaXZlclRhc2tRdWV1ZVswXTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZXNvbHZlQ3VycmVudERyaXZlclRhc2sgKHJlc3VsdD86IHVua25vd24pOiB2b2lkIHtcbiAgICAgICAgdGhpcy5jdXJyZW50RHJpdmVyVGFzay5yZXNvbHZlKHJlc3VsdCk7XG4gICAgICAgIHRoaXMuZHJpdmVyVGFza1F1ZXVlLnNoaWZ0KCk7XG5cbiAgICAgICAgaWYgKHRoaXMudGVzdERvbmVDb21tYW5kUXVldWVkKVxuICAgICAgICAgICAgdGhpcy5fcmVtb3ZlQWxsTm9uU2VydmljZVRhc2tzKCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfcmVqZWN0Q3VycmVudERyaXZlclRhc2sgKGVycjogRXJyb3IpOiB2b2lkIHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBlcnIuY2FsbHNpdGUgPSBlcnIuY2FsbHNpdGUgfHwgdGhpcy5jdXJyZW50RHJpdmVyVGFzay5jYWxsc2l0ZTtcblxuICAgICAgICB0aGlzLmN1cnJlbnREcml2ZXJUYXNrLnJlamVjdChlcnIpO1xuICAgICAgICB0aGlzLl9yZW1vdmVBbGxOb25TZXJ2aWNlVGFza3MoKTtcbiAgICB9XG5cbiAgICAvLyBQZW5kaW5nIHJlcXVlc3RcbiAgICBwcml2YXRlIF9jbGVhclBlbmRpbmdSZXF1ZXN0ICgpOiB2b2lkIHtcbiAgICAgICAgaWYgKHRoaXMucGVuZGluZ1JlcXVlc3QpIHtcbiAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnBlbmRpbmdSZXF1ZXN0LnJlc3BvbnNlVGltZW91dCk7XG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0ID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHByaXZhdGUgX3Jlc29sdmVQZW5kaW5nUmVxdWVzdCAoY29tbWFuZDogQ29tbWFuZEJhc2UgfCBudWxsKTogdm9pZCB7XG4gICAgICAgIHRoaXMubGFzdERyaXZlclN0YXR1c1Jlc3BvbnNlID0gY29tbWFuZDtcblxuICAgICAgICBpZiAodGhpcy5wZW5kaW5nUmVxdWVzdClcbiAgICAgICAgICAgIHRoaXMucGVuZGluZ1JlcXVlc3QucmVzb2x2ZShjb21tYW5kKTtcblxuICAgICAgICB0aGlzLl9jbGVhclBlbmRpbmdSZXF1ZXN0KCk7XG4gICAgfVxuXG4gICAgLy8gSGFuZGxlIGRyaXZlciByZXF1ZXN0XG4gICAgcHJpdmF0ZSBfc2hvdWxkUmVzb2x2ZUN1cnJlbnREcml2ZXJUYXNrIChkcml2ZXJTdGF0dXM6IERyaXZlclN0YXR1cyk6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCBjdXJyZW50Q29tbWFuZCA9IHRoaXMuY3VycmVudERyaXZlclRhc2suY29tbWFuZDtcblxuICAgICAgICBjb25zdCBpc0V4ZWN1dGluZ09ic2VydmF0aW9uQ29tbWFuZCA9IGN1cnJlbnRDb21tYW5kIGluc3RhbmNlb2Ygb2JzZXJ2YXRpb25Db21tYW5kcy5FeGVjdXRlU2VsZWN0b3JDb21tYW5kIHx8XG4gICAgICAgICAgICBjdXJyZW50Q29tbWFuZCBpbnN0YW5jZW9mIEV4ZWN1dGVDbGllbnRGdW5jdGlvbkNvbW1hbmQ7XG5cbiAgICAgICAgY29uc3QgaXNEZWJ1Z0FjdGl2ZSA9IGN1cnJlbnRDb21tYW5kIGluc3RhbmNlb2Ygc2VydmljZUNvbW1hbmRzLlNldEJyZWFrcG9pbnRDb21tYW5kO1xuXG4gICAgICAgIGNvbnN0IHNob3VsZEV4ZWN1dGVDdXJyZW50Q29tbWFuZCA9XG4gICAgICAgICAgICBkcml2ZXJTdGF0dXMuaXNGaXJzdFJlcXVlc3RBZnRlcldpbmRvd1N3aXRjaGluZyAmJiAoaXNFeGVjdXRpbmdPYnNlcnZhdGlvbkNvbW1hbmQgfHwgaXNEZWJ1Z0FjdGl2ZSk7XG5cbiAgICAgICAgcmV0dXJuICFzaG91bGRFeGVjdXRlQ3VycmVudENvbW1hbmQ7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfZnVsZmlsbEN1cnJlbnREcml2ZXJUYXNrIChkcml2ZXJTdGF0dXM6IERyaXZlclN0YXR1cyk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuY3VycmVudERyaXZlclRhc2spXG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgaWYgKGRyaXZlclN0YXR1cy53YXJuaW5ncz8ubGVuZ3RoKSB7XG4gICAgICAgICAgICBkcml2ZXJTdGF0dXMud2FybmluZ3MuZm9yRWFjaCgod2FybmluZzogRHJpdmVyV2FybmluZykgPT4ge1xuICAgICAgICAgICAgICAgIHRoaXMud2FybmluZ0xvZy5hZGRXYXJuaW5nKFdBUk5JTkdfTUVTU0FHRVt3YXJuaW5nLnR5cGVdLCAuLi53YXJuaW5nLmFyZ3MpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZHJpdmVyU3RhdHVzLmV4ZWN1dGlvbkVycm9yKVxuICAgICAgICAgICAgdGhpcy5fcmVqZWN0Q3VycmVudERyaXZlclRhc2soZHJpdmVyU3RhdHVzLmV4ZWN1dGlvbkVycm9yKTtcbiAgICAgICAgZWxzZSBpZiAodGhpcy5fc2hvdWxkUmVzb2x2ZUN1cnJlbnREcml2ZXJUYXNrKGRyaXZlclN0YXR1cykpXG4gICAgICAgICAgICB0aGlzLl9yZXNvbHZlQ3VycmVudERyaXZlclRhc2soZHJpdmVyU3RhdHVzLnJlc3VsdCk7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfaGFuZGxlUGFnZUVycm9yU3RhdHVzIChwYWdlRXJyb3I6IEVycm9yKTogYm9vbGVhbiB7XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnREcml2ZXJUYXNrICYmIGlzQ29tbWFuZFJlamVjdGFibGVCeVBhZ2VFcnJvcih0aGlzLmN1cnJlbnREcml2ZXJUYXNrLmNvbW1hbmQpKSB7XG4gICAgICAgICAgICB0aGlzLl9yZWplY3RDdXJyZW50RHJpdmVyVGFzayhwYWdlRXJyb3IpO1xuICAgICAgICAgICAgdGhpcy5wZW5kaW5nUGFnZUVycm9yID0gbnVsbDtcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBlbmRpbmdQYWdlRXJyb3IgPSB0aGlzLnBlbmRpbmdQYWdlRXJyb3IgfHwgcGFnZUVycm9yO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9oYW5kbGVEcml2ZXJSZXF1ZXN0IChkcml2ZXJTdGF0dXM6IERyaXZlclN0YXR1cyk6IENvbW1hbmRCYXNlIHwgbnVsbCB8IHN0cmluZyB7XG4gICAgICAgIGNvbnN0IGlzVGVzdERvbmUgICAgICAgICAgICAgICAgID0gdGhpcy5jdXJyZW50RHJpdmVyVGFzayAmJiB0aGlzLmN1cnJlbnREcml2ZXJUYXNrLmNvbW1hbmQudHlwZSA9PT1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDT01NQU5EX1RZUEUudGVzdERvbmU7XG4gICAgICAgIGNvbnN0IHBhZ2VFcnJvciAgICAgICAgICAgICAgICAgID0gdGhpcy5wZW5kaW5nUGFnZUVycm9yIHx8IGRyaXZlclN0YXR1cy5wYWdlRXJyb3I7XG4gICAgICAgIGNvbnN0IGN1cnJlbnRUYXNrUmVqZWN0ZWRCeUVycm9yID0gcGFnZUVycm9yICYmIHRoaXMuX2hhbmRsZVBhZ2VFcnJvclN0YXR1cyhwYWdlRXJyb3IpO1xuXG4gICAgICAgIHRoaXMuY29uc29sZU1lc3NhZ2VzLmNvbmNhdChkcml2ZXJTdGF0dXMuY29uc29sZU1lc3NhZ2VzKTtcblxuICAgICAgICB0aGlzLl9oYW5kbGVEZWJ1Z1N0YXRlKGRyaXZlclN0YXR1cyk7XG5cbiAgICAgICAgaWYgKCFjdXJyZW50VGFza1JlamVjdGVkQnlFcnJvciAmJiBkcml2ZXJTdGF0dXMuaXNDb21tYW5kUmVzdWx0KSB7XG4gICAgICAgICAgICBpZiAoaXNUZXN0RG9uZSkge1xuICAgICAgICAgICAgICAgIHRoaXMuX3Jlc29sdmVDdXJyZW50RHJpdmVyVGFzaygpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIFRFU1RfRE9ORV9DT05GSVJNQVRJT05fUkVTUE9OU0U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMuX2Z1bGZpbGxDdXJyZW50RHJpdmVyVGFzayhkcml2ZXJTdGF0dXMpO1xuXG4gICAgICAgICAgICBpZiAoZHJpdmVyU3RhdHVzLmlzUGVuZGluZ1dpbmRvd1N3aXRjaGluZylcbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0aGlzLl9nZXRDdXJyZW50RHJpdmVyVGFza0NvbW1hbmQoKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9nZXRDdXJyZW50RHJpdmVyVGFza0NvbW1hbmQgKCk6IENvbW1hbmRCYXNlIHwgbnVsbCB7XG4gICAgICAgIGlmICghdGhpcy5jdXJyZW50RHJpdmVyVGFzaylcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIGNvbnN0IGNvbW1hbmQgPSB0aGlzLmN1cnJlbnREcml2ZXJUYXNrLmNvbW1hbmQ7XG5cbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLm5hdmlnYXRlVG8gJiYgKGNvbW1hbmQgYXMgYW55KS5zdGF0ZVNuYXBzaG90KVxuICAgICAgICAgICAgdGhpcy5zZXNzaW9uLnVzZVN0YXRlU25hcHNob3QoSlNPTi5wYXJzZSgoY29tbWFuZCBhcyBhbnkpLnN0YXRlU25hcHNob3QpKTtcblxuICAgICAgICByZXR1cm4gY29tbWFuZDtcbiAgICB9XG5cbiAgICAvLyBFeGVjdXRlIGNvbW1hbmRcbiAgICBwcml2YXRlIGFzeW5jIF9leGVjdXRlSnNFeHByZXNzaW9uIChjb21tYW5kOiBFeGVjdXRlRXhwcmVzc2lvbkNvbW1hbmQpOiBQcm9taXNlPHVua25vd24+IHtcbiAgICAgICAgY29uc3QgcmVzdWx0VmFyaWFibGVOYW1lID0gY29tbWFuZC5yZXN1bHRWYXJpYWJsZU5hbWU7XG4gICAgICAgIGxldCBleHByZXNzaW9uICAgICAgICAgICA9IGNvbW1hbmQuZXhwcmVzc2lvbjtcblxuICAgICAgICBpZiAocmVzdWx0VmFyaWFibGVOYW1lKVxuICAgICAgICAgICAgZXhwcmVzc2lvbiA9IGAke3Jlc3VsdFZhcmlhYmxlTmFtZX0gPSAke2V4cHJlc3Npb259LCAke3Jlc3VsdFZhcmlhYmxlTmFtZX1gO1xuXG4gICAgICAgIGlmICh0aGlzLmNvbXBpbGVyU2VydmljZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuY29tcGlsZXJTZXJ2aWNlLmV4ZWN1dGVKc0V4cHJlc3Npb24oe1xuICAgICAgICAgICAgICAgIGV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgdGVzdFJ1bklkOiB0aGlzLmlkLFxuICAgICAgICAgICAgICAgIG9wdGlvbnM6ICAgeyBza2lwVmlzaWJpbGl0eUNoZWNrOiBmYWxzZSB9LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gZXhlY3V0ZUpzRXhwcmVzc2lvbihleHByZXNzaW9uLCB0aGlzLCB7IHNraXBWaXNpYmlsaXR5Q2hlY2s6IGZhbHNlIH0pO1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgX2V4ZWN1dGVBc3luY0pzRXhwcmVzc2lvbiAoY29tbWFuZDogRXhlY3V0ZUFzeW5jRXhwcmVzc2lvbkNvbW1hbmQsIGNhbGxzaXRlPzogc3RyaW5nKTogUHJvbWlzZTx1bmtub3duPiB7XG4gICAgICAgIGlmICh0aGlzLmNvbXBpbGVyU2VydmljZSkge1xuICAgICAgICAgICAgdGhpcy5hc3luY0pzRXhwcmVzc2lvbkNhbGxzaXRlcy5jbGVhcigpO1xuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb21waWxlclNlcnZpY2UuZXhlY3V0ZUFzeW5jSnNFeHByZXNzaW9uKHtcbiAgICAgICAgICAgICAgICBleHByZXNzaW9uOiBjb21tYW5kLmV4cHJlc3Npb24sXG4gICAgICAgICAgICAgICAgdGVzdFJ1bklkOiAgdGhpcy5pZCxcbiAgICAgICAgICAgICAgICBjYWxsc2l0ZSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGV4ZWN1dGVBc3luY0pzRXhwcmVzc2lvbihjb21tYW5kLmV4cHJlc3Npb24sIHRoaXMsIGNhbGxzaXRlKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWRpcmVjdFJlRXhlY3V0YWJsZVByb21pc2VFeGVjdXRpb25Ub0NvbXBpbGVyU2VydmljZSAoY29tbWFuZDogQXNzZXJ0aW9uQ29tbWFuZCk6IHZvaWQge1xuICAgICAgICBpZiAoIXRoaXMuY29tcGlsZXJTZXJ2aWNlKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGNvbW1hbmQuYWN0dWFsID0gUmVFeGVjdXRhYmxlUHJvbWlzZS5mcm9tRm4oYXN5bmMgKCkgPT4ge1xuICAgICAgICAgICAgcmV0dXJuIHNlbGYuY29tcGlsZXJTZXJ2aWNlPy5nZXRBc3NlcnRpb25BY3R1YWxWYWx1ZSh7XG4gICAgICAgICAgICAgICAgdGVzdFJ1bklkOiBzZWxmLmlkLFxuICAgICAgICAgICAgICAgIGNvbW1hbmRJZDogY29tbWFuZC5pZCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWRpcmVjdEFzc2VydGlvbkZuRXhlY3V0aW9uVG9Db21waWxlclNlcnZpY2UgKGV4ZWN1dG9yOiBBc3NlcnRpb25FeGVjdXRvcik6IHZvaWQge1xuICAgICAgICBleGVjdXRvci5mbiA9ICgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyU2VydmljZT8uZXhlY3V0ZUFzc2VydGlvbkZuKHtcbiAgICAgICAgICAgICAgICB0ZXN0UnVuSWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICAgICAgY29tbWFuZElkOiBleGVjdXRvci5jb21tYW5kLmlkLFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfZXhlY3V0ZUFzc2VydGlvbiAoY29tbWFuZDogQXNzZXJ0aW9uQ29tbWFuZCwgY2FsbHNpdGU6IENhbGxzaXRlUmVjb3JkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmIChjb21tYW5kLmFjdHVhbCA9PT0gU3ltYm9sLmZvcihSRV9FWEVDVVRBQkxFX1BST01JU0VfTUFSS0VSX0RFU0NSSVBUSU9OKSlcbiAgICAgICAgICAgIHRoaXMuX3JlZGlyZWN0UmVFeGVjdXRhYmxlUHJvbWlzZUV4ZWN1dGlvblRvQ29tcGlsZXJTZXJ2aWNlKGNvbW1hbmQpO1xuXG4gICAgICAgIGNvbnN0IGFzc2VydGlvblRpbWVvdXQgPSBnZXRBc3NlcnRpb25UaW1lb3V0KGNvbW1hbmQsIHRoaXMub3B0cyk7XG4gICAgICAgIGNvbnN0IGV4ZWN1dG9yICAgICAgICAgPSBuZXcgQXNzZXJ0aW9uRXhlY3V0b3IoY29tbWFuZCwgYXNzZXJ0aW9uVGltZW91dCwgY2FsbHNpdGUpO1xuXG4gICAgICAgIGV4ZWN1dG9yLm9uY2UoJ3N0YXJ0LWFzc2VydGlvbi1yZXRyaWVzJywgKHRpbWVvdXQ6IG51bWJlcikgPT4gdGhpcy5faW50ZXJuYWxFeGVjdXRlQ29tbWFuZChuZXcgc2VydmljZUNvbW1hbmRzLlNob3dBc3NlcnRpb25SZXRyaWVzU3RhdHVzQ29tbWFuZCh0aW1lb3V0KSkpO1xuICAgICAgICBleGVjdXRvci5vbmNlKCdlbmQtYXNzZXJ0aW9uLXJldHJpZXMnLCAoc3VjY2VzczogYm9vbGVhbikgPT4gdGhpcy5faW50ZXJuYWxFeGVjdXRlQ29tbWFuZChuZXcgc2VydmljZUNvbW1hbmRzLkhpZGVBc3NlcnRpb25SZXRyaWVzU3RhdHVzQ29tbWFuZChzdWNjZXNzKSkpO1xuICAgICAgICBleGVjdXRvci5vbmNlKCdub24tc2VyaWFsaXphYmxlLWFjdHVhbC12YWx1ZScsIHRoaXMuX3JlZGlyZWN0QXNzZXJ0aW9uRm5FeGVjdXRpb25Ub0NvbXBpbGVyU2VydmljZSk7XG5cbiAgICAgICAgY29uc3QgZXhlY3V0ZUZuID0gdGhpcy5kZWNvcmF0ZVByZXZlbnRFbWl0QWN0aW9uRXZlbnRzKCgpID0+IGV4ZWN1dG9yLnJ1bigpLCB7IHByZXZlbnQ6IHRydWUgfSk7XG5cbiAgICAgICAgcmV0dXJuIGF3YWl0IGV4ZWN1dGVGbigpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2FkanVzdENvbmZpZ3VyYXRpb25XaXRoQ29tbWFuZCAoY29tbWFuZDogQ29tbWFuZEJhc2UpOiB2b2lkIHtcbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnRlc3REb25lKSB7XG4gICAgICAgICAgICB0aGlzLnRlc3REb25lQ29tbWFuZFF1ZXVlZCA9IHRydWU7XG4gICAgICAgICAgICBpZiAodGhpcy5kZWJ1Z0xvZ2dlcilcbiAgICAgICAgICAgICAgICB0aGlzLmRlYnVnTG9nZ2VyLmhpZGVCcmVha3BvaW50KHRoaXMuc2Vzc2lvbi5pZCk7XG4gICAgICAgIH1cblxuICAgICAgICBlbHNlIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5zZXROYXRpdmVEaWFsb2dIYW5kbGVyKVxuICAgICAgICAgICAgdGhpcy5hY3RpdmVEaWFsb2dIYW5kbGVyID0gKGNvbW1hbmQgYXMgYW55KS5kaWFsb2dIYW5kbGVyO1xuXG4gICAgICAgIGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnN3aXRjaFRvSWZyYW1lKVxuICAgICAgICAgICAgdGhpcy5hY3RpdmVJZnJhbWVTZWxlY3RvciA9IChjb21tYW5kIGFzIGFueSkuc2VsZWN0b3I7XG5cbiAgICAgICAgZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuc3dpdGNoVG9NYWluV2luZG93KVxuICAgICAgICAgICAgdGhpcy5hY3RpdmVJZnJhbWVTZWxlY3RvciA9IG51bGw7XG5cbiAgICAgICAgZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuc2V0VGVzdFNwZWVkKVxuICAgICAgICAgICAgdGhpcy5zcGVlZCA9IChjb21tYW5kIGFzIGFueSkuc3BlZWQ7XG5cbiAgICAgICAgZWxzZSBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuc2V0UGFnZUxvYWRUaW1lb3V0KVxuICAgICAgICAgICAgdGhpcy5wYWdlTG9hZFRpbWVvdXQgPSAoY29tbWFuZCBhcyBhbnkpLmR1cmF0aW9uO1xuXG4gICAgICAgIGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLmRlYnVnKVxuICAgICAgICAgICAgdGhpcy5kZWJ1Z2dpbmcgPSB0cnVlO1xuXG4gICAgICAgIGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLmRpc2FibGVEZWJ1Zykge1xuICAgICAgICAgICAgdGhpcy5kZWJ1Z0xvZ2dlci5oaWRlQnJlYWtwb2ludCh0aGlzLnNlc3Npb24uaWQpO1xuXG4gICAgICAgICAgICB0aGlzLmRlYnVnZ2luZyA9IGZhbHNlO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9hZGp1c3RTY3JlZW5zaG90Q29tbWFuZCAoY29tbWFuZDogVGFrZVNjcmVlbnNob3RCYXNlQ29tbWFuZCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBicm93c2VySWQgICAgICAgICAgICAgICAgICAgID0gdGhpcy5icm93c2VyQ29ubmVjdGlvbi5pZDtcbiAgICAgICAgY29uc3QgeyBoYXNDaHJvbWVsZXNzU2NyZWVuc2hvdHMgfSA9IGF3YWl0IHRoaXMuYnJvd3NlckNvbm5lY3Rpb24ucHJvdmlkZXIuaGFzQ3VzdG9tQWN0aW9uRm9yQnJvd3Nlcihicm93c2VySWQpO1xuXG4gICAgICAgIGlmICghaGFzQ2hyb21lbGVzc1NjcmVlbnNob3RzKVxuICAgICAgICAgICAgY29tbWFuZC5nZW5lcmF0ZVNjcmVlbnNob3RNYXJrKCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIF9hZGp1c3RDb21tYW5kT3B0aW9uc0FuZEVudmlyb25tZW50IChjb21tYW5kOiBDb21tYW5kQmFzZSwgY2FsbHNpdGU6IENhbGxzaXRlUmVjb3JkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICgoY29tbWFuZCBhcyBhbnkpLm9wdGlvbnM/LmNvbmZpZGVudGlhbCAhPT0gdm9pZCAwKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS50eXBlVGV4dCkge1xuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgdGhpcy5faW50ZXJuYWxFeGVjdXRlQ29tbWFuZCgoY29tbWFuZCBhcyBhbnkpLnNlbGVjdG9yLCBjYWxsc2l0ZSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzdWx0KVxuICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMucmVwbGljYXRvci5kZWNvZGUocmVzdWx0KTtcblxuICAgICAgICAgICAgKGNvbW1hbmQgYXMgYW55KS5vcHRpb25zLmNvbmZpZGVudGlhbCA9IGlzUGFzc3dvcmRJbnB1dChub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGVsc2UgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnByZXNzS2V5KSB7XG4gICAgICAgICAgICBjb25zdCByZXN1bHQgPSBhd2FpdCB0aGlzLl9pbnRlcm5hbEV4ZWN1dGVDb21tYW5kKG5ldyBzZXJ2aWNlQ29tbWFuZHMuR2V0QWN0aXZlRWxlbWVudENvbW1hbmQoKSk7XG5cbiAgICAgICAgICAgIGlmICghcmVzdWx0KVxuICAgICAgICAgICAgICAgIHJldHVybjtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IHRoaXMucmVwbGljYXRvci5kZWNvZGUocmVzdWx0KTtcblxuICAgICAgICAgICAgKGNvbW1hbmQgYXMgYW55KS5vcHRpb25zLmNvbmZpZGVudGlhbCA9IGlzUGFzc3dvcmRJbnB1dChub2RlKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChjb21tYW5kIGluc3RhbmNlb2YgRXhlY3V0ZUNsaWVudEZ1bmN0aW9uQ29tbWFuZEJhc2UgJiYgISF0aGlzLmNvbXBpbGVyU2VydmljZSAmJiAhdGhpcy5fY2xpZW50RW52aXJvbm1lbnRQcmVwYXJlZCkge1xuICAgICAgICAgICAgdGhpcy5fY2xpZW50RW52aXJvbm1lbnRQcmVwYXJlZCA9IHRydWU7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2ludGVybmFsRXhlY3V0ZUNvbW1hbmQobmV3IHNlcnZpY2VDb21tYW5kcy5QcmVwYXJlQ2xpZW50RW52aXJvbm1lbnRJbkRlYnVnTW9kZShjb21tYW5kLmVzbVJ1bnRpbWUpKTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIF9zZXRCcmVha3BvaW50SWZOZWNlc3NhcnkgKGNvbW1hbmQ6IENvbW1hbmRCYXNlLCBjYWxsc2l0ZT86IENhbGxzaXRlUmVjb3JkKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGlmICghdGhpcy5kaXNhYmxlRGVidWdCcmVha3BvaW50cyAmJiB0aGlzLmRlYnVnZ2luZyAmJiBjYW5TZXREZWJ1Z2dlckJyZWFrcG9pbnRCZWZvcmVDb21tYW5kKGNvbW1hbmQpKVxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fZW5xdWV1ZVNldEJyZWFrcG9pbnRDb21tYW5kKGNhbGxzaXRlKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgZXhlY3V0ZUNvbW1hbmQgKGNvbW1hbmQ6IENvbW1hbmRCYXNlIHwgQWN0aW9uQ29tbWFuZEJhc2UsIGNhbGxzaXRlPzogc3RyaW5nIHwgQ2FsbHNpdGVSZWNvcmQpOiBQcm9taXNlPHVua25vd24+IHtcbiAgICAgICAgcmV0dXJuIGNvbW1hbmQgaW5zdGFuY2VvZiBBY3Rpb25Db21tYW5kQmFzZVxuICAgICAgICAgICAgPyB0aGlzLl9leGVjdXRlQWN0aW9uQ29tbWFuZChjb21tYW5kLCBjYWxsc2l0ZSBhcyBDYWxsc2l0ZVJlY29yZClcbiAgICAgICAgICAgIDogdGhpcy5faW50ZXJuYWxFeGVjdXRlQ29tbWFuZChjb21tYW5kLCBjYWxsc2l0ZSk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIF9leGVjdXRlQWN0aW9uQ29tbWFuZCAoY29tbWFuZDogQWN0aW9uQ29tbWFuZEJhc2UsIGNhbGxzaXRlOiBDYWxsc2l0ZVJlY29yZCk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBjb25zdCBhY3Rpb25BcmdzID0geyBhcGlBY3Rpb25OYW1lOiBjb21tYW5kLm1ldGhvZE5hbWUsIGNvbW1hbmQgfTtcblxuICAgICAgICBsZXQgZXJyb3JBZGFwdGVyID0gbnVsbDtcbiAgICAgICAgbGV0IGVycm9yICAgICAgICA9IG51bGw7XG4gICAgICAgIGxldCByZXN1bHQgICAgICAgPSBudWxsO1xuXG4gICAgICAgIGNvbnN0IHN0YXJ0ID0gbmV3IERhdGUoKS5nZXRUaW1lKCk7XG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2FkanVzdENvbW1hbmRPcHRpb25zQW5kRW52aXJvbm1lbnQoY29tbWFuZCwgY2FsbHNpdGUpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoIChlcnIpIHtcbiAgICAgICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5lbWl0QWN0aW9uRXZlbnQoJ2FjdGlvbi1zdGFydCcsIGFjdGlvbkFyZ3MpO1xuXG5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIGlmICghZXJyb3IpXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5faW50ZXJuYWxFeGVjdXRlQ29tbWFuZChjb21tYW5kLCBjYWxsc2l0ZSk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgaWYgKHRoaXMucGhhc2UgPT09IFRlc3RSdW5QaGFzZS5wZW5kaW5nRmluYWxpemF0aW9uICYmIGVyciBpbnN0YW5jZW9mIEV4dGVybmFsQXNzZXJ0aW9uTGlicmFyeUVycm9yKVxuICAgICAgICAgICAgICAgIGFkZFJlbmRlcmVkV2FybmluZyh0aGlzLndhcm5pbmdMb2csIHsgbWVzc2FnZTogV0FSTklOR19NRVNTQUdFLnVuYXdhaXRlZE1ldGhvZFdpdGhBc3NlcnRpb24sIGFjdGlvbklkOiBjb21tYW5kLmFjdGlvbklkIH0sIGNhbGxzaXRlKTtcbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBlcnJvciA9IGVycjtcbiAgICAgICAgfVxuXG4gICAgICAgIGNvbnN0IGR1cmF0aW9uID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBzdGFydDtcblxuICAgICAgICBpZiAoZXJyb3IpIHtcbiAgICAgICAgICAgIC8vIE5PVEU6IGNoZWNrIGlmIGVycm9yIGlzIFRlc3RDYWZlRXJyb3JMaXN0IGlzIHNwZWNpZmljIGZvciB0aGUgYHVzZVJvbGVgIGFjdGlvblxuICAgICAgICAgICAgLy8gaWYgZXJyb3IgaXMgVGVzdENhZmVFcnJvckxpc3Qgd2UgZG8gbm90IG5lZWQgdG8gY3JlYXRlIGFuIGFkYXB0ZXIsXG4gICAgICAgICAgICAvLyBzaW5jZSBlcnJvciBpcyBhbHJlYWR5IHdhcyBwcm9jZXNzZWQgaW4gcm9sZSBpbml0aWFsaXplclxuICAgICAgICAgICAgaWYgKCEoZXJyb3IgaW5zdGFuY2VvZiBUZXN0Q2FmZUVycm9yTGlzdCkpIHtcbiAgICAgICAgICAgICAgICBhd2FpdCB0aGlzLl9tYWtlU2NyZWVuc2hvdE9uRmFpbChjb21tYW5kLmFjdGlvbklkKTtcblxuICAgICAgICAgICAgICAgIGVycm9yQWRhcHRlciA9IHRoaXMuX2NyZWF0ZUVycm9yQWRhcHRlcihwcm9jZXNzVGVzdEZuRXJyb3IoZXJyb3IpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2VcbiAgICAgICAgICAgICAgICBlcnJvckFkYXB0ZXIgPSBlcnJvci5hZGFwdGVyO1xuICAgICAgICB9XG5cbiAgICAgICAgT2JqZWN0LmFzc2lnbihhY3Rpb25BcmdzLCB7XG4gICAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgICBkdXJhdGlvbixcbiAgICAgICAgICAgIGVycjogZXJyb3JBZGFwdGVyLFxuICAgICAgICB9KTtcblxuICAgICAgICBhd2FpdCB0aGlzLmVtaXRBY3Rpb25FdmVudCgnYWN0aW9uLWRvbmUnLCBhY3Rpb25BcmdzKTtcblxuICAgICAgICBpZiAoZXJyb3IpXG4gICAgICAgICAgICB0aHJvdyBlcnJvcjtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cblxuICAgIHB1YmxpYyBhc3luYyBfaW50ZXJuYWxFeGVjdXRlQ29tbWFuZCAoY29tbWFuZDogQ29tbWFuZEJhc2UsIGNhbGxzaXRlPzogQ2FsbHNpdGVSZWNvcmQgfCBzdHJpbmcpOiBQcm9taXNlPHVua25vd24+IHtcbiAgICAgICAgdGhpcy5kZWJ1Z0xvZy5jb21tYW5kKGNvbW1hbmQpO1xuXG4gICAgICAgIGlmICh0aGlzLnBlbmRpbmdQYWdlRXJyb3IgJiYgaXNDb21tYW5kUmVqZWN0YWJsZUJ5UGFnZUVycm9yKGNvbW1hbmQpKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3JlamVjdENvbW1hbmRXaXRoUGFnZUVycm9yKGNhbGxzaXRlIGFzIENhbGxzaXRlUmVjb3JkKTtcblxuICAgICAgICBpZiAoaXNFeGVjdXRhYmxlT25DbGllbnRDb21tYW5kKGNvbW1hbmQpKVxuICAgICAgICAgICAgdGhpcy5hZGRpbmdEcml2ZXJUYXNrc0NvdW50Kys7XG5cbiAgICAgICAgdGhpcy5fYWRqdXN0Q29uZmlndXJhdGlvbldpdGhDb21tYW5kKGNvbW1hbmQpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX3NldEJyZWFrcG9pbnRJZk5lY2Vzc2FyeShjb21tYW5kLCBjYWxsc2l0ZSBhcyBDYWxsc2l0ZVJlY29yZCk7XG5cbiAgICAgICAgaWYgKGlzU2NyZWVuc2hvdENvbW1hbmQoY29tbWFuZCkpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLm9wdHMuZGlzYWJsZVNjcmVlbnNob3RzKSB7XG4gICAgICAgICAgICAgICAgdGhpcy53YXJuaW5nTG9nLmFkZFdhcm5pbmcoeyBtZXNzYWdlOiBXQVJOSU5HX01FU1NBR0Uuc2NyZWVuc2hvdHNEaXNhYmxlZCwgYWN0aW9uSWQ6IGNvbW1hbmQuYWN0aW9uSWQgfSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgYXdhaXQgdGhpcy5fYWRqdXN0U2NyZWVuc2hvdENvbW1hbmQoY29tbWFuZCBhcyBUYWtlU2NyZWVuc2hvdEJhc2VDb21tYW5kKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChpc0Jyb3dzZXJNYW5pcHVsYXRpb25Db21tYW5kKGNvbW1hbmQpKSB7XG4gICAgICAgICAgICB0aGlzLmJyb3dzZXJNYW5pcHVsYXRpb25RdWV1ZS5wdXNoKGNvbW1hbmQpO1xuXG4gICAgICAgICAgICBpZiAoaXNSZXNpemVXaW5kb3dDb21tYW5kKGNvbW1hbmQpICYmIHRoaXMub3B0cy52aWRlb1BhdGgpXG4gICAgICAgICAgICAgICAgdGhpcy53YXJuaW5nTG9nLmFkZFdhcm5pbmcoeyBtZXNzYWdlOiBXQVJOSU5HX01FU1NBR0UudmlkZW9Ccm93c2VyUmVzaXppbmcsIGFjdGlvbklkOiBjb21tYW5kLmFjdGlvbklkIH0sIHRoaXMudGVzdC5uYW1lKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS53YWl0KVxuICAgICAgICAgICAgcmV0dXJuIGRlbGF5KChjb21tYW5kIGFzIGFueSkudGltZW91dCk7XG5cbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLnNldFBhZ2VMb2FkVGltZW91dClcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5kZWJ1Zykge1xuICAgICAgICAgICAgLy8gTk9URTogSW4gcmVndWxhciBtb2RlLCBpdCdzIHBvc3NpYmxlIHRvIGRlYnVnIHRlc3RzIG9ubHkgdXNpbmcgVGVzdENhZmUgVUkgKCdSZXN1bWUnIGFuZCAnTmV4dCBzdGVwJyBidXR0b25zKS5cbiAgICAgICAgICAgIC8vIFNvLCB3ZSBzaG91bGQgd2FybiBvbiB0cnlpbmcgdG8gZGVidWcgaW4gaGVhZGxlc3MgbW9kZS5cbiAgICAgICAgICAgIC8vIEluIGNvbXBpbGVyIHNlcnZpY2UgbW9kZSwgd2UgY2FuIGRlYnVnIGV2ZW4gaW4gaGVhZGxlc3MgbW9kZSB1c2luZyBhbnkgZGVidWdnaW5nIHRvb2xzLiBTbywgaW4gdGhpcyBjYXNlLCB0aGUgd2FybmluZyBpcyBleGNlc3NpdmUuXG4gICAgICAgICAgICBjb25zdCBjYW5EZWJ1ZyA9ICEhdGhpcy5jb21waWxlclNlcnZpY2UgfHwgIXRoaXMuYnJvd3NlckNvbm5lY3Rpb24uaXNIZWFkbGVzc0Jyb3dzZXIoKTtcblxuICAgICAgICAgICAgaWYgKGNhbkRlYnVnKVxuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9lbnF1ZXVlU2V0QnJlYWtwb2ludENvbW1hbmQoY2FsbHNpdGUgYXMgQ2FsbHNpdGVSZWNvcmQsIHZvaWQgMCk7XG5cbiAgICAgICAgICAgIHRoaXMuZGVidWdnaW5nID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHRoaXMud2FybmluZ0xvZy5hZGRXYXJuaW5nKHsgbWVzc2FnZTogV0FSTklOR19NRVNTQUdFLmRlYnVnSW5IZWFkbGVzc0Vycm9yLCBhY3Rpb25JZDogY29tbWFuZC5hY3Rpb25JZCB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUudXNlUm9sZSkge1xuICAgICAgICAgICAgbGV0IGZuID0gKCk6IFByb21pc2U8dm9pZD4gPT4gdGhpcy5fdXNlUm9sZSgoY29tbWFuZCBhcyBhbnkpLnJvbGUsIGNhbGxzaXRlIGFzIENhbGxzaXRlUmVjb3JkKTtcblxuICAgICAgICAgICAgZm4gPSB0aGlzLmRlY29yYXRlUHJldmVudEVtaXRBY3Rpb25FdmVudHMoZm4sIHsgcHJldmVudDogdHJ1ZSB9KTtcbiAgICAgICAgICAgIGZuID0gdGhpcy5kZWNvcmF0ZURpc2FibGVEZWJ1Z0JyZWFrcG9pbnRzKGZuLCB7IGRpc2FibGU6IHRydWUgfSk7XG5cbiAgICAgICAgICAgIHJldHVybiBhd2FpdCBmbigpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNvbW1hbmQudHlwZSA9PT0gQ09NTUFORF9UWVBFLmFzc2VydGlvbilcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9leGVjdXRlQXNzZXJ0aW9uKGNvbW1hbmQgYXMgQXNzZXJ0aW9uQ29tbWFuZCwgY2FsbHNpdGUgYXMgQ2FsbHNpdGVSZWNvcmQpO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5leGVjdXRlRXhwcmVzc2lvbilcbiAgICAgICAgICAgIHJldHVybiBhd2FpdCB0aGlzLl9leGVjdXRlSnNFeHByZXNzaW9uKGNvbW1hbmQgYXMgRXhlY3V0ZUV4cHJlc3Npb25Db21tYW5kKTtcblxuICAgICAgICBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuZXhlY3V0ZUFzeW5jRXhwcmVzc2lvbilcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9leGVjdXRlQXN5bmNKc0V4cHJlc3Npb24oY29tbWFuZCBhcyBFeGVjdXRlQXN5bmNFeHByZXNzaW9uQ29tbWFuZCwgY2FsbHNpdGUgYXMgc3RyaW5nKTtcblxuICAgICAgICBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuZ2V0QnJvd3NlckNvbnNvbGVNZXNzYWdlcylcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9lbnF1ZXVlQnJvd3NlckNvbnNvbGVNZXNzYWdlc0NvbW1hbmQoY29tbWFuZCwgY2FsbHNpdGUgYXMgQ2FsbHNpdGVSZWNvcmQpO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5zd2l0Y2hUb1ByZXZpb3VzV2luZG93KVxuICAgICAgICAgICAgKGNvbW1hbmQgYXMgYW55KS53aW5kb3dJZCA9IHRoaXMuYnJvd3NlckNvbm5lY3Rpb24ucHJldmlvdXNBY3RpdmVXaW5kb3dJZDtcblxuICAgICAgICBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUuc3dpdGNoVG9XaW5kb3dCeVByZWRpY2F0ZSlcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zd2l0Y2hUb1dpbmRvd0J5UHJlZGljYXRlKGNvbW1hbmQgYXMgU3dpdGNoVG9XaW5kb3dCeVByZWRpY2F0ZUNvbW1hbmQpO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5nZXRDb29raWVzKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVHZXRDb29raWVzKGNvbW1hbmQgYXMgR2V0Q29va2llc0NvbW1hbmQpO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5zZXRDb29raWVzKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVTZXRDb29raWVzKGNvbW1hbmQgYXMgU2V0Q29va2llc0NvbW1hbmQpO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5kZWxldGVDb29raWVzKVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVEZWxldGVDb29raWVzKGNvbW1hbmQgYXMgRGVsZXRlQ29va2llc0NvbW1hbmQpO1xuXG4gICAgICAgIGlmIChjb21tYW5kLnR5cGUgPT09IENPTU1BTkRfVFlQRS5hZGRSZXF1ZXN0SG9va3MpXG4gICAgICAgICAgICByZXR1cm4gUHJvbWlzZS5hbGwoKGNvbW1hbmQgYXMgQWRkUmVxdWVzdEhvb2tzQ29tbWFuZCkuaG9va3MubWFwKGhvb2sgPT4gdGhpcy5fYWRkUmVxdWVzdEhvb2soaG9vaykpKTtcblxuICAgICAgICBpZiAoY29tbWFuZC50eXBlID09PSBDT01NQU5EX1RZUEUucmVtb3ZlUmVxdWVzdEhvb2tzKVxuICAgICAgICAgICAgcmV0dXJuIFByb21pc2UuYWxsKChjb21tYW5kIGFzIFJlbW92ZVJlcXVlc3RIb29rc0NvbW1hbmQpLmhvb2tzLm1hcChob29rID0+IHRoaXMuX3JlbW92ZVJlcXVlc3RIb29rKGhvb2spKSk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuX2VucXVldWVDb21tYW5kKGNvbW1hbmQsIGNhbGxzaXRlIGFzIENhbGxzaXRlUmVjb3JkKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIF9yZWplY3RDb21tYW5kV2l0aFBhZ2VFcnJvciAoY2FsbHNpdGU/OiBDYWxsc2l0ZVJlY29yZCk6IFByb21pc2U8RXJyb3I+IHtcbiAgICAgICAgY29uc3QgZXJyID0gdGhpcy5wZW5kaW5nUGFnZUVycm9yO1xuXG4gICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgZXJyLmNhbGxzaXRlICAgICAgICAgID0gY2FsbHNpdGU7XG4gICAgICAgIHRoaXMucGVuZGluZ1BhZ2VFcnJvciA9IG51bGw7XG5cbiAgICAgICAgcmV0dXJuIFByb21pc2UucmVqZWN0KGVycik7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBfc2VuZENsb3NlQ2hpbGRXaW5kb3dPbkZpbGVEb3dubG9hZGluZ0NvbW1hbmQgKCk6IENvbW1hbmRCYXNlIHtcbiAgICAgICAgcmV0dXJuIG5ldyBhY3Rpb25Db21tYW5kcy5DbG9zZUNoaWxkV2luZG93T25GaWxlRG93bmxvYWRpbmcoKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgYXN5bmMgX21ha2VTY3JlZW5zaG90T25GYWlsIChmYWlsZWRBY3Rpb25JZD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCB7IHNjcmVlbnNob3RzIH0gPSB0aGlzLm9wdHM7XG5cbiAgICAgICAgaWYgKCF0aGlzLmVyclNjcmVlbnNob3RQYXRoICYmIChzY3JlZW5zaG90cyBhcyBTY3JlZW5zaG90T3B0aW9uVmFsdWUpPy50YWtlT25GYWlscylcbiAgICAgICAgICAgIHRoaXMuZXJyU2NyZWVuc2hvdFBhdGggPSBhd2FpdCB0aGlzLl9pbnRlcm5hbEV4ZWN1dGVDb21tYW5kKG5ldyBicm93c2VyTWFuaXB1bGF0aW9uQ29tbWFuZHMuVGFrZVNjcmVlbnNob3RPbkZhaWxDb21tYW5kKHsgZmFpbGVkQWN0aW9uSWQgfSkpIGFzIHN0cmluZztcbiAgICB9XG5cbiAgICBwcml2YXRlIF9kZWNvcmF0ZVdpdGhGbGFnIChmbjogRnVuY3Rpb24sIGZsYWdOYW1lOiBzdHJpbmcsIHZhbHVlOiBib29sZWFuKTogKCkgPT4gUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiBhc3luYyAoKSA9PiB7XG4gICAgICAgICAgICAvLyBAdHMtaWdub3JlXG4gICAgICAgICAgICB0aGlzW2ZsYWdOYW1lXSA9IHZhbHVlO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBhd2FpdCBmbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZmluYWxseSB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIHRoaXNbZmxhZ05hbWVdID0gIXZhbHVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHB1YmxpYyBkZWNvcmF0ZVByZXZlbnRFbWl0QWN0aW9uRXZlbnRzIChmbjogRnVuY3Rpb24sIHsgcHJldmVudCB9OiB7IHByZXZlbnQ6IGJvb2xlYW4gfSk6ICgpID0+IFByb21pc2U8dm9pZD4ge1xuICAgICAgICByZXR1cm4gdGhpcy5fZGVjb3JhdGVXaXRoRmxhZyhmbiwgJ3ByZXZlbnRFbWl0QWN0aW9uRXZlbnRzJywgcHJldmVudCk7XG4gICAgfVxuXG4gICAgcHVibGljIGRlY29yYXRlRGlzYWJsZURlYnVnQnJlYWtwb2ludHMgKGZuOiBGdW5jdGlvbiwgeyBkaXNhYmxlIH06IHsgZGlzYWJsZTogYm9vbGVhbiB9KTogKCkgPT4gUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIHJldHVybiB0aGlzLl9kZWNvcmF0ZVdpdGhGbGFnKGZuLCAnZGlzYWJsZURlYnVnQnJlYWtwb2ludHMnLCBkaXNhYmxlKTtcbiAgICB9XG5cbiAgICAvLyBSb2xlIG1hbmFnZW1lbnRcbiAgICBwdWJsaWMgYXN5bmMgZ2V0U3RhdGVTbmFwc2hvdCAoKTogUHJvbWlzZTxTdGF0ZVNuYXBzaG90PiB7XG4gICAgICAgIGNvbnN0IHN0YXRlID0gdGhpcy5zZXNzaW9uLmdldFN0YXRlU25hcHNob3QoKTtcblxuICAgICAgICBzdGF0ZS5zdG9yYWdlcyA9IGF3YWl0IHRoaXMuX2ludGVybmFsRXhlY3V0ZUNvbW1hbmQobmV3IHNlcnZpY2VDb21tYW5kcy5CYWNrdXBTdG9yYWdlc0NvbW1hbmQoKSkgYXMgU3RvcmFnZXNTbmFwc2hvdDtcblxuICAgICAgICByZXR1cm4gc3RhdGU7XG4gICAgfVxuXG4gICAgcHJpdmF0ZSBhc3luYyBfY2xlYW5VcEN0eHMgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBpZiAodGhpcy5jb21waWxlclNlcnZpY2UpIHtcbiAgICAgICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXJTZXJ2aWNlLnNldEN0eCh7XG4gICAgICAgICAgICAgICAgdGVzdFJ1bklkOiB0aGlzLmlkLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAgICAgT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYXdhaXQgdGhpcy5jb21waWxlclNlcnZpY2Uuc2V0Rml4dHVyZUN0eCh7XG4gICAgICAgICAgICAgICAgdGVzdFJ1bklkOiB0aGlzLmlkLFxuICAgICAgICAgICAgICAgIHZhbHVlOiAgICAgT2JqZWN0LmNyZWF0ZShudWxsKSxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5jdHggICAgICAgID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICAgICAgICAgIHRoaXMuZml4dHVyZUN0eCA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgICAgICAgICB0aGlzLnRlc3RSdW5DdHggPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIHN3aXRjaFRvQ2xlYW5SdW4gKHVybDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2NsZWFuVXBDdHhzKCk7XG5cbiAgICAgICAgdGhpcy5jb25zb2xlTWVzc2FnZXMgPSBuZXcgQnJvd3NlckNvbnNvbGVNZXNzYWdlcygpO1xuXG4gICAgICAgIHRoaXMuc2Vzc2lvbi51c2VTdGF0ZVNuYXBzaG90KFN0YXRlU25hcHNob3QuZW1wdHkoKSk7XG5cbiAgICAgICAgaWYgKHRoaXMuc3BlZWQgIT09IHRoaXMub3B0cy5zcGVlZCkge1xuICAgICAgICAgICAgY29uc3Qgc2V0U3BlZWRDb21tYW5kID0gbmV3IGFjdGlvbkNvbW1hbmRzLlNldFRlc3RTcGVlZENvbW1hbmQoeyBzcGVlZDogdGhpcy5vcHRzLnNwZWVkIH0pO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9pbnRlcm5hbEV4ZWN1dGVDb21tYW5kKHNldFNwZWVkQ29tbWFuZCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodGhpcy5wYWdlTG9hZFRpbWVvdXQgIT09IHRoaXMub3B0cy5wYWdlTG9hZFRpbWVvdXQpIHtcbiAgICAgICAgICAgIGNvbnN0IHNldFBhZ2VMb2FkVGltZW91dENvbW1hbmQgPSBuZXcgYWN0aW9uQ29tbWFuZHMuU2V0UGFnZUxvYWRUaW1lb3V0Q29tbWFuZCh7IGR1cmF0aW9uOiB0aGlzLm9wdHMucGFnZUxvYWRUaW1lb3V0IH0pO1xuXG4gICAgICAgICAgICBhd2FpdCB0aGlzLl9pbnRlcm5hbEV4ZWN1dGVDb21tYW5kKHNldFBhZ2VMb2FkVGltZW91dENvbW1hbmQpO1xuICAgICAgICB9XG5cbiAgICAgICAgYXdhaXQgdGhpcy5uYXZpZ2F0ZVRvVXJsKHVybCwgdHJ1ZSk7XG5cbiAgICAgICAgaWYgKHRoaXMuYWN0aXZlRGlhbG9nSGFuZGxlcikge1xuICAgICAgICAgICAgY29uc3QgcmVtb3ZlRGlhbG9nSGFuZGxlckNvbW1hbmQgPSBuZXcgYWN0aW9uQ29tbWFuZHMuU2V0TmF0aXZlRGlhbG9nSGFuZGxlckNvbW1hbmQoeyBkaWFsb2dIYW5kbGVyOiB7IGZuOiBudWxsIH0gfSk7XG5cbiAgICAgICAgICAgIGF3YWl0IHRoaXMuX2ludGVybmFsRXhlY3V0ZUNvbW1hbmQocmVtb3ZlRGlhbG9nSGFuZGxlckNvbW1hbmQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIG5hdmlnYXRlVG9VcmwgKHVybDogc3RyaW5nLCBmb3JjZVJlbG9hZDogYm9vbGVhbiwgc3RhdGVTbmFwc2hvdD86IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBuYXZpZ2F0ZUNvbW1hbmQgPSBuZXcgYWN0aW9uQ29tbWFuZHMuTmF2aWdhdGVUb0NvbW1hbmQoeyB1cmwsIGZvcmNlUmVsb2FkLCBzdGF0ZVNuYXBzaG90IH0pO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuX2ludGVybmFsRXhlY3V0ZUNvbW1hbmQobmF2aWdhdGVDb21tYW5kKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9nZXRTdGF0ZVNuYXBzaG90RnJvbVJvbGUgKHJvbGU6IFJvbGUpOiBQcm9taXNlPFN0YXRlU25hcHNob3Q+IHtcbiAgICAgICAgY29uc3QgcHJldlBoYXNlID0gdGhpcy5waGFzZTtcblxuICAgICAgICBpZiAocm9sZS5waGFzZSA9PT0gUk9MRV9QSEFTRS5pbml0aWFsaXplZCAmJiByb2xlLmluaXRFcnIgaW5zdGFuY2VvZiBUZXN0Q2FmZUVycm9yTGlzdCAmJiByb2xlLmluaXRFcnIuaGFzRXJyb3JzKVxuICAgICAgICAgICAgcm9sZS5pbml0RXJyLmFkYXB0ZXIgPSB0aGlzLl9jcmVhdGVFcnJvckFkYXB0ZXIocm9sZS5pbml0RXJyLml0ZW1zWzBdKTtcblxuICAgICAgICB0aGlzLnBoYXNlID0gVGVzdFJ1blBoYXNlLmluUm9sZUluaXRpYWxpemVyO1xuXG4gICAgICAgIGlmIChyb2xlLnBoYXNlID09PSBST0xFX1BIQVNFLnVuaW5pdGlhbGl6ZWQpXG4gICAgICAgICAgICBhd2FpdCByb2xlLmluaXRpYWxpemUodGhpcyk7XG5cbiAgICAgICAgZWxzZSBpZiAocm9sZS5waGFzZSA9PT0gUk9MRV9QSEFTRS5wZW5kaW5nSW5pdGlhbGl6YXRpb24pXG4gICAgICAgICAgICBhd2FpdCBwcm9taXNpZnlFdmVudChyb2xlLCAnaW5pdGlhbGl6ZWQnKTtcblxuICAgICAgICBpZiAocm9sZS5pbml0RXJyKVxuICAgICAgICAgICAgdGhyb3cgcm9sZS5pbml0RXJyO1xuXG4gICAgICAgIHRoaXMucGhhc2UgPSBwcmV2UGhhc2U7XG5cbiAgICAgICAgcmV0dXJuIHJvbGUuc3RhdGVTbmFwc2hvdDtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF91c2VSb2xlIChyb2xlOiBSb2xlLCBjYWxsc2l0ZTogQ2FsbHNpdGVSZWNvcmQpOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgaWYgKHRoaXMucGhhc2UgPT09IFRlc3RSdW5QaGFzZS5pblJvbGVJbml0aWFsaXplcilcbiAgICAgICAgICAgIHRocm93IG5ldyBSb2xlU3dpdGNoSW5Sb2xlSW5pdGlhbGl6ZXJFcnJvcihjYWxsc2l0ZSk7XG5cbiAgICAgICAgY29uc3QgYm9va21hcmsgPSBuZXcgVGVzdFJ1bkJvb2ttYXJrKHRoaXMsIHJvbGUpO1xuXG4gICAgICAgIGF3YWl0IGJvb2ttYXJrLmluaXQoKTtcblxuICAgICAgICBpZiAodGhpcy5jdXJyZW50Um9sZUlkKVxuICAgICAgICAgICAgdGhpcy51c2VkUm9sZVN0YXRlc1t0aGlzLmN1cnJlbnRSb2xlSWRdID0gYXdhaXQgdGhpcy5nZXRTdGF0ZVNuYXBzaG90KCk7XG5cbiAgICAgICAgY29uc3Qgc3RhdGVTbmFwc2hvdCA9IHRoaXMudXNlZFJvbGVTdGF0ZXNbcm9sZS5pZF0gfHwgYXdhaXQgdGhpcy5fZ2V0U3RhdGVTbmFwc2hvdEZyb21Sb2xlKHJvbGUpO1xuXG4gICAgICAgIHRoaXMuc2Vzc2lvbi51c2VTdGF0ZVNuYXBzaG90KHN0YXRlU25hcHNob3QpO1xuXG4gICAgICAgIHRoaXMuY3VycmVudFJvbGVJZCA9IHJvbGUuaWQ7XG5cbiAgICAgICAgYXdhaXQgYm9va21hcmsucmVzdG9yZShjYWxsc2l0ZSwgc3RhdGVTbmFwc2hvdCk7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGdldEN1cnJlbnRVcmwgKCk6IFByb21pc2U8c3RyaW5nPiB7XG4gICAgICAgIGNvbnN0IGJ1aWxkZXIgPSBuZXcgQ2xpZW50RnVuY3Rpb25CdWlsZGVyKCgpID0+IHtcbiAgICAgICAgICAgIHJldHVybiB3aW5kb3cubG9jYXRpb24uaHJlZjsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZlxuICAgICAgICB9LCB7IGJvdW5kVGVzdFJ1bjogdGhpcyB9KTtcblxuICAgICAgICBjb25zdCBnZXRMb2NhdGlvbiA9IGJ1aWxkZXIuZ2V0RnVuY3Rpb24oKTtcblxuICAgICAgICByZXR1cm4gYXdhaXQgZ2V0TG9jYXRpb24oKTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIF9zd2l0Y2hUb1dpbmRvd0J5UHJlZGljYXRlIChjb21tYW5kOiBTd2l0Y2hUb1dpbmRvd0J5UHJlZGljYXRlQ29tbWFuZCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBjb25zdCBjdXJyZW50V2luZG93cyA9IGF3YWl0IHRoaXMuX2ludGVybmFsRXhlY3V0ZUNvbW1hbmQobmV3IEdldEN1cnJlbnRXaW5kb3dzQ29tbWFuZCh7fSwgdGhpcykgYXMgQ29tbWFuZEJhc2UpIGFzIE9wZW5lZFdpbmRvd0luZm9ybWF0aW9uW107XG5cbiAgICAgICAgY29uc3Qgd2luZG93cyA9IGF3YWl0IGFzeW5jRmlsdGVyPE9wZW5lZFdpbmRvd0luZm9ybWF0aW9uPihjdXJyZW50V2luZG93cywgYXN5bmMgd25kID0+IHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcHJlZGljYXRlRGF0YSA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAgIG5ldyBVUkwod25kLnVybCksXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiB3bmQudGl0bGUsXG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmNvbXBpbGVyU2VydmljZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBjb21waWxlclNlcnZpY2VQcmVkaWNhdGVEYXRhID0gT2JqZWN0LmFzc2lnbihwcmVkaWNhdGVEYXRhLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXN0UnVuSWQ6IHRoaXMuaWQsXG4gICAgICAgICAgICAgICAgICAgICAgICBjb21tYW5kSWQ6IGNvbW1hbmQuaWQsXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbXBpbGVyU2VydmljZS5jaGVja1dpbmRvdyhjb21waWxlclNlcnZpY2VQcmVkaWNhdGVEYXRhKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29tbWFuZC5jaGVja1dpbmRvdyhwcmVkaWNhdGVEYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNhdGNoIChlOiBhbnkpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgU3dpdGNoVG9XaW5kb3dQcmVkaWNhdGVFcnJvcihlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIXdpbmRvd3MubGVuZ3RoKVxuICAgICAgICAgICAgdGhyb3cgbmV3IFdpbmRvd05vdEZvdW5kRXJyb3IoKTtcblxuICAgICAgICBpZiAod2luZG93cy5sZW5ndGggPiAxKVxuICAgICAgICAgICAgdGhpcy53YXJuaW5nTG9nLmFkZFdhcm5pbmcoeyBtZXNzYWdlOiBXQVJOSU5HX01FU1NBR0UubXVsdGlwbGVXaW5kb3dzRm91bmRCeVByZWRpY2F0ZSwgYWN0aW9uSWQ6IGNvbW1hbmQuYWN0aW9uSWQgfSk7XG5cbiAgICAgICAgYXdhaXQgdGhpcy5faW50ZXJuYWxFeGVjdXRlQ29tbWFuZChuZXcgU3dpdGNoVG9XaW5kb3dDb21tYW5kKHsgd2luZG93SWQ6IHdpbmRvd3NbMF0uaWQgfSwgdGhpcykgYXMgQ29tbWFuZEJhc2UpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2Rpc2Nvbm5lY3QgKGVycjogRXJyb3IpOiB2b2lkIHtcbiAgICAgICAgdGhpcy5kaXNjb25uZWN0ZWQgPSB0cnVlO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnREcml2ZXJUYXNrKVxuICAgICAgICAgICAgdGhpcy5fcmVqZWN0Q3VycmVudERyaXZlclRhc2soZXJyKTtcblxuICAgICAgICB0aGlzLmVtaXQoJ2Rpc2Nvbm5lY3RlZCcsIGVycik7XG5cbiAgICAgICAgdGVzdFJ1blRyYWNrZXIucmVtb3ZlQWN0aXZlVGVzdFJ1bih0aGlzLnNlc3Npb24uaWQpO1xuICAgIH1cblxuICAgIHByaXZhdGUgX2hhbmRsZUZpbGVEb3dubG9hZGluZ0luTmV3V2luZG93UmVxdWVzdCAoKTogQ29tbWFuZEJhc2UgfCBudWxsIHtcbiAgICAgICAgaWYgKHRoaXMuYXR0YWNobWVudERvd25sb2FkaW5nSGFuZGxlZCkge1xuICAgICAgICAgICAgdGhpcy5hdHRhY2htZW50RG93bmxvYWRpbmdIYW5kbGVkID0gZmFsc2U7XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9zZW5kQ2xvc2VDaGlsZFdpbmRvd09uRmlsZURvd25sb2FkaW5nQ29tbWFuZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGVtaXRBY3Rpb25FdmVudCAoZXZlbnROYW1lOiBzdHJpbmcsIGFyZ3M6IHVua25vd24pOiBQcm9taXNlPHZvaWQ+IHtcbiAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICBpZiAoIXRoaXMucHJldmVudEVtaXRBY3Rpb25FdmVudHMpXG4gICAgICAgICAgICBhd2FpdCB0aGlzLmVtaXQoZXZlbnROYW1lLCBhcmdzKTtcbiAgICB9XG5cbiAgICBwdWJsaWMgc3RhdGljIGlzTXVsdGlwbGVXaW5kb3dzQWxsb3dlZCAodGVzdFJ1bjogVGVzdFJ1bik6IGJvb2xlYW4ge1xuICAgICAgICBjb25zdCB7IGRpc2FibGVNdWx0aXBsZVdpbmRvd3MsIHRlc3QgfSA9IHRlc3RSdW47XG5cbiAgICAgICAgcmV0dXJuICFkaXNhYmxlTXVsdGlwbGVXaW5kb3dzICYmICEodGVzdCBhcyBMZWdhY3lUZXN0UnVuKS5pc0xlZ2FjeSAmJiAhIXRlc3RSdW4uYWN0aXZlV2luZG93SWQ7XG4gICAgfVxuXG4gICAgcHVibGljIGFzeW5jIGluaXRpYWxpemUgKCk6IFByb21pc2U8dm9pZD4ge1xuICAgICAgICBhd2FpdCB0aGlzLl9jb29raWVQcm92aWRlci5pbml0aWFsaXplKCk7XG4gICAgICAgIGF3YWl0IHRoaXMuX2luaXRSZXF1ZXN0SG9va3MoKTtcblxuICAgICAgICBpZiAoIXRoaXMuY29tcGlsZXJTZXJ2aWNlKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuY29tcGlsZXJTZXJ2aWNlLmluaXRpYWxpemVUZXN0UnVuRGF0YSh7XG4gICAgICAgICAgICB0ZXN0UnVuSWQ6ICAgICAgdGhpcy5pZCxcbiAgICAgICAgICAgIHRlc3RJZDogICAgICAgICB0aGlzLnRlc3QuaWQsXG4gICAgICAgICAgICBicm93c2VyOiAgICAgICAgdGhpcy5icm93c2VyLFxuICAgICAgICAgICAgYWN0aXZlV2luZG93SWQ6IHRoaXMuYWN0aXZlV2luZG93SWQsXG4gICAgICAgICAgICBtZXNzYWdlQnVzOiAgICAgdGhpcy5fbWVzc2FnZUJ1cyxcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcHVibGljIGdldCBhY3RpdmVXaW5kb3dJZCAoKTogbnVsbCB8IHN0cmluZyB7XG4gICAgICAgIHJldHVybiB0aGlzLmJyb3dzZXJDb25uZWN0aW9uLmFjdGl2ZVdpbmRvd0lkO1xuICAgIH1cblxuICAgIC8vIE5PVEU6IHRoaXMgZnVuY3Rpb24gaXMgdGltZS1jcml0aWNhbCBhbmQgbXVzdCByZXR1cm4gQVNBUCB0byBhdm9pZCBjbGllbnQgZGlzY29ubmVjdGlvblxuICAgIHByaXZhdGUgYXN5bmMgW0NMSUVOVF9NRVNTQUdFUy5yZWFkeV0gKG1zZzogRHJpdmVyTWVzc2FnZSk6IFByb21pc2U8dW5rbm93bj4ge1xuICAgICAgICBpZiAobXNnLnN0YXR1cy5pc09ic2VydmluZ0ZpbGVEb3dubG9hZGluZ0luTmV3V2luZG93KVxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX2hhbmRsZUZpbGVEb3dubG9hZGluZ0luTmV3V2luZG93UmVxdWVzdCgpO1xuXG4gICAgICAgIHRoaXMuZGVidWdMb2cuZHJpdmVyTWVzc2FnZShtc2cpO1xuXG4gICAgICAgIGlmICh0aGlzLmRpc2Nvbm5lY3RlZClcbiAgICAgICAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLnRlc3RSdW5SZXF1ZXN0SW5EaXNjb25uZWN0ZWRCcm93c2VyLCB0aGlzLmJyb3dzZXJDb25uZWN0aW9uLmJyb3dzZXJJbmZvLmFsaWFzKSk7XG5cbiAgICAgICAgdGhpcy5lbWl0KCdjb25uZWN0ZWQnKTtcblxuICAgICAgICB0aGlzLl9jbGVhclBlbmRpbmdSZXF1ZXN0KCk7XG5cbiAgICAgICAgLy8gTk9URTogdGhlIGRyaXZlciBzZW5kcyB0aGUgc3RhdHVzIGZvciB0aGUgc2Vjb25kIHRpbWUgaWYgaXQgZGlkbid0IGdldCBhIHJlc3BvbnNlIGF0IHRoZVxuICAgICAgICAvLyBmaXJzdCB0cnkuIFRoaXMgaXMgcG9zc2libGUgd2hlbiB0aGUgcGFnZSB3YXMgdW5sb2FkZWQgYWZ0ZXIgdGhlIGRyaXZlciBzZW50IHRoZSBzdGF0dXMuXG4gICAgICAgIGlmIChtc2cuc3RhdHVzLmlkID09PSB0aGlzLmxhc3REcml2ZXJTdGF0dXNJZClcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmxhc3REcml2ZXJTdGF0dXNSZXNwb25zZTtcblxuICAgICAgICB0aGlzLmxhc3REcml2ZXJTdGF0dXNJZCAgICAgICA9IG1zZy5zdGF0dXMuaWQ7XG4gICAgICAgIHRoaXMubGFzdERyaXZlclN0YXR1c1Jlc3BvbnNlID0gdGhpcy5faGFuZGxlRHJpdmVyUmVxdWVzdChtc2cuc3RhdHVzKTtcblxuICAgICAgICBpZiAodGhpcy5sYXN0RHJpdmVyU3RhdHVzUmVzcG9uc2UgfHwgbXNnLnN0YXR1cy5pc1BlbmRpbmdXaW5kb3dTd2l0Y2hpbmcpXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5sYXN0RHJpdmVyU3RhdHVzUmVzcG9uc2U7XG5cbiAgICAgICAgLy8gTk9URTogd2Ugc2VuZCBhbiBlbXB0eSByZXNwb25zZSBhZnRlciB0aGUgTUFYX1JFU1BPTlNFX0RFTEFZIHRpbWVvdXQgaXMgZXhjZWVkZWQgdG8ga2VlcCBjb25uZWN0aW9uXG4gICAgICAgIC8vIHdpdGggdGhlIGNsaWVudCBhbmQgcHJldmVudCB0aGUgcmVzcG9uc2UgdGltZW91dCBleGNlcHRpb24gb24gdGhlIGNsaWVudCBzaWRlXG4gICAgICAgIGNvbnN0IHJlc3BvbnNlVGltZW91dCA9IHNldFRpbWVvdXQoKCkgPT4gdGhpcy5fcmVzb2x2ZVBlbmRpbmdSZXF1ZXN0KG51bGwpLCBNQVhfUkVTUE9OU0VfREVMQVkpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAgICAgICB0aGlzLnBlbmRpbmdSZXF1ZXN0ID0geyByZXNvbHZlLCByZWplY3QsIHJlc3BvbnNlVGltZW91dCB9O1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcml2YXRlIGFzeW5jIFtDTElFTlRfTUVTU0FHRVMucmVhZHlGb3JCcm93c2VyTWFuaXB1bGF0aW9uXSAobXNnOiBEcml2ZXJNZXNzYWdlKTogUHJvbWlzZTxCcm93c2VyTWFuaXB1bGF0aW9uUmVzdWx0PiB7XG4gICAgICAgIHRoaXMuZGVidWdMb2cuZHJpdmVyTWVzc2FnZShtc2cpO1xuXG4gICAgICAgIGxldCByZXN1bHQgPSBudWxsO1xuICAgICAgICBsZXQgZXJyb3IgID0gbnVsbDtcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmVzdWx0ID0gYXdhaXQgdGhpcy5icm93c2VyTWFuaXB1bGF0aW9uUXVldWUuZXhlY3V0ZVBlbmRpbmdNYW5pcHVsYXRpb24obXNnLCB0aGlzLl9tZXNzYWdlQnVzKTtcbiAgICAgICAgfVxuICAgICAgICBjYXRjaCAoZXJyOiBhbnkpIHtcbiAgICAgICAgICAgIGVycm9yID0gZXJyO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHsgcmVzdWx0LCBlcnJvciB9O1xuICAgIH1cblxuICAgIHByaXZhdGUgYXN5bmMgW0NMSUVOVF9NRVNTQUdFUy53YWl0Rm9yRmlsZURvd25sb2FkXSAobXNnOiBEcml2ZXJNZXNzYWdlKTogUHJvbWlzZTxib29sZWFuPiB7XG4gICAgICAgIHRoaXMuZGVidWdMb2cuZHJpdmVyTWVzc2FnZShtc2cpO1xuXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZShyZXNvbHZlID0+IHtcbiAgICAgICAgICAgIGlmICh0aGlzLmZpbGVEb3dubG9hZGluZ0hhbmRsZWQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmZpbGVEb3dubG9hZGluZ0hhbmRsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXNvbHZlKHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZVxuICAgICAgICAgICAgICAgIHRoaXMucmVzb2x2ZVdhaXRGb3JGaWxlRG93bmxvYWRpbmdQcm9taXNlID0gcmVzb2x2ZTtcbiAgICAgICAgfSk7XG4gICAgfVxufVxuIl19