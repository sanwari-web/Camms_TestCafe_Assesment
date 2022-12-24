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
const runtime_1 = require("./errors/runtime");
const types_1 = require("./errors/types");
const content_types_1 = __importDefault(require("./assets/content-types"));
const option_names_1 = __importDefault(require("./configuration/option-names"));
const INJECTABLES = __importStar(require("./assets/injectables"));
const setup_sourcemap_support_1 = __importDefault(require("./utils/setup-sourcemap-support"));
const lazyRequire = require('import-lazy')(require);
const hammerhead = lazyRequire('testcafe-hammerhead');
const loadAssets = lazyRequire('./load-assets');
const errorHandlers = lazyRequire('./utils/handle-errors');
const BrowserConnectionGateway = lazyRequire('./browser/connection/gateway');
const BrowserConnection = lazyRequire('./browser/connection');
const browserProviderPool = lazyRequire('./browser/provider/pool');
const CompilerHost = lazyRequire('./services/compiler/host');
const Runner = lazyRequire('./runner');
const LiveModeRunner = lazyRequire('./live/test-runner');
// NOTE: CoffeeScript can't be loaded lazily, because it will break stack traces
require('coffeescript');
class TestCafe {
    constructor(configuration) {
        (0, setup_sourcemap_support_1.default)();
        errorHandlers.registerErrorHandlers();
        const { hostname, port1, port2, options } = configuration.startOptions;
        this.closed = false;
        this.proxy = new hammerhead.Proxy(hostname, port1, port2, options);
        this.runners = [];
        this.configuration = configuration;
        this.browserConnectionGateway = new BrowserConnectionGateway(this.proxy, {
            retryTestPages: configuration.getOption(option_names_1.default.retryTestPages),
            proxyless: configuration.getOption(option_names_1.default.proxyless),
        });
        if (configuration.getOption(option_names_1.default.experimentalDebug)) {
            const developmentMode = configuration.getOption(option_names_1.default.developmentMode);
            const v8Flags = configuration.getOption(option_names_1.default.v8Flags);
            this.compilerService = new CompilerHost({ developmentMode, v8Flags });
        }
        this._registerAssets(options.developmentMode);
    }
    _registerAssets(developmentMode) {
        const { favIcon, coreScript, driverScript, uiScript, uiStyle, uiSprite, uiSpriteSvg, automationScript, legacyRunnerScript } = loadAssets(developmentMode);
        this.proxy.GET(INJECTABLES.TESTCAFE_CORE, { content: coreScript, contentType: content_types_1.default.javascript });
        this.proxy.GET(INJECTABLES.TESTCAFE_DRIVER, { content: driverScript, contentType: content_types_1.default.javascript });
        this.proxy.GET(INJECTABLES.TESTCAFE_LEGACY_RUNNER, {
            content: legacyRunnerScript,
            contentType: content_types_1.default.javascript,
        });
        this.proxy.GET(INJECTABLES.TESTCAFE_AUTOMATION, { content: automationScript, contentType: content_types_1.default.javascript });
        this.proxy.GET(INJECTABLES.TESTCAFE_UI, { content: uiScript, contentType: content_types_1.default.javascript });
        this.proxy.GET(INJECTABLES.TESTCAFE_UI_SPRITE, { content: uiSprite, contentType: content_types_1.default.png });
        this.proxy.GET(INJECTABLES.TESTCAFE_UI_SPRITE_SVG, { content: uiSpriteSvg, contentType: content_types_1.default.svg });
        this.proxy.GET(INJECTABLES.DEFAULT_FAVICON_PATH, { content: favIcon, contentType: content_types_1.default.icon });
        this.proxy.GET(INJECTABLES.TESTCAFE_UI_STYLES, {
            content: uiStyle,
            contentType: content_types_1.default.css,
            isShadowUIStylesheet: true,
        });
    }
    _createRunner(isLiveMode) {
        const Ctor = isLiveMode ? LiveModeRunner : Runner;
        const newRunner = new Ctor({
            proxy: this.proxy,
            browserConnectionGateway: this.browserConnectionGateway,
            configuration: this.configuration.clone(option_names_1.default.hooks),
            compilerService: this.compilerService,
        });
        this.runners.push(newRunner);
        return newRunner;
    }
    // API
    async createBrowserConnection() {
        const browserInfo = await browserProviderPool.getBrowserInfo('remote');
        return new BrowserConnection(this.browserConnectionGateway, browserInfo, true);
    }
    createRunner() {
        return this._createRunner(false);
    }
    createLiveModeRunner() {
        if (this.runners.some(runner => runner instanceof LiveModeRunner))
            throw new runtime_1.GeneralError(types_1.RUNTIME_ERRORS.cannotCreateMultipleLiveModeRunners);
        return this._createRunner(true);
    }
    async close() {
        if (this.closed)
            return;
        this.closed = true;
        await Promise.all(this.runners.map(runner => runner.stop()));
        await browserProviderPool.dispose();
        if (this.compilerService)
            this.compilerService.stop();
        await this.browserConnectionGateway.close();
        this.proxy.close();
    }
}
exports.default = TestCafe;
module.exports = exports.default;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdGNhZmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvdGVzdGNhZmUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLDhDQUFnRDtBQUNoRCwwQ0FBZ0Q7QUFDaEQsMkVBQW1EO0FBQ25ELGdGQUF3RDtBQUN4RCxrRUFBb0Q7QUFDcEQsOEZBQW9FO0FBRXBFLE1BQU0sV0FBVyxHQUFnQixPQUFPLENBQUMsYUFBYSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDakUsTUFBTSxVQUFVLEdBQWlCLFdBQVcsQ0FBQyxxQkFBcUIsQ0FBQyxDQUFDO0FBQ3BFLE1BQU0sVUFBVSxHQUFpQixXQUFXLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDOUQsTUFBTSxhQUFhLEdBQWMsV0FBVyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFDdEUsTUFBTSx3QkFBd0IsR0FBRyxXQUFXLENBQUMsOEJBQThCLENBQUMsQ0FBQztBQUM3RSxNQUFNLGlCQUFpQixHQUFVLFdBQVcsQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO0FBQ3JFLE1BQU0sbUJBQW1CLEdBQVEsV0FBVyxDQUFDLHlCQUF5QixDQUFDLENBQUM7QUFDeEUsTUFBTSxZQUFZLEdBQWUsV0FBVyxDQUFDLDBCQUEwQixDQUFDLENBQUM7QUFDekUsTUFBTSxNQUFNLEdBQXFCLFdBQVcsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN6RCxNQUFNLGNBQWMsR0FBYSxXQUFXLENBQUMsb0JBQW9CLENBQUMsQ0FBQztBQUVuRSxnRkFBZ0Y7QUFDaEYsT0FBTyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBRXhCLE1BQXFCLFFBQVE7SUFDekIsWUFBYSxhQUFhO1FBQ3RCLElBQUEsaUNBQXFCLEdBQUUsQ0FBQztRQUN4QixhQUFhLENBQUMscUJBQXFCLEVBQUUsQ0FBQztRQUV0QyxNQUFNLEVBQUUsUUFBUSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxF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QztJQUNyQyxDQUFDO0lBRUQsb0JBQW9CO1FBQ2hCLElBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLFlBQVksY0FBYyxDQUFDO1lBQzdELE1BQU0sSUFBSSxzQkFBWSxDQUFDLHNCQUFjLENBQUMsbUNBQW1DLENBQUMsQ0FBQztRQUUvRSxPQUFPLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDcEMsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLO1FBQ1AsSUFBSSxJQUFJLENBQUMsTUFBTTtZQUNYLE9BQU87UUFFWCxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQztRQUVuQixNQUFNLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBRTdELE1BQU0sbUJBQW1CLENBQUMsT0FBTyxFQUFFLENBQUM7UUFFcEMsSUFBSSxJQUFJLENBQUMsZUFBZTtZQUNwQixJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO1FBRWhDLE1BQU0sSUFBSSxDQUFDLHdCQUF3QixDQUFDLEtBQUssRUFBRSxDQUFDO1FBQzVDLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDdkIsQ0FBQztDQUNKO0FBcEdELDJCQW9HQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEdlbmVyYWxFcnJvciB9IGZyb20gJy4vZXJyb3JzL3J1bnRpbWUnO1xuaW1wb3J0IHsgUlVOVElNRV9FUlJPUlMgfSBmcm9tICcuL2Vycm9ycy90eXBlcyc7XG5pbXBvcnQgQ09OVEVOVF9UWVBFUyBmcm9tICcuL2Fzc2V0cy9jb250ZW50LXR5cGVzJztcbmltcG9ydCBPUFRJT05fTkFNRVMgZnJvbSAnLi9jb25maWd1cmF0aW9uL29wdGlvbi1uYW1lcyc7XG5pbXBvcnQgKiBhcyBJTkpFQ1RBQkxFUyBmcm9tICcuL2Fzc2V0cy9pbmplY3RhYmxlcyc7XG5pbXBvcnQgc2V0dXBTb3VyY2VNYXBTdXBwb3J0IGZyb20gJy4vdXRpbHMvc2V0dXAtc291cmNlbWFwLXN1cHBvcnQnO1xuXG5jb25zdCBsYXp5UmVxdWlyZSAgICAgICAgICAgICAgPSByZXF1aXJlKCdpbXBvcnQtbGF6eScpKHJlcXVpcmUpO1xuY29uc3QgaGFtbWVyaGVhZCAgICAgICAgICAgICAgID0gbGF6eVJlcXVpcmUoJ3Rlc3RjYWZlLWhhbW1lcmhlYWQnKTtcbmNvbnN0IGxvYWRBc3NldHMgICAgICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL2xvYWQtYXNzZXRzJyk7XG5jb25zdCBlcnJvckhhbmRsZXJzICAgICAgICAgICAgPSBsYXp5UmVxdWlyZSgnLi91dGlscy9oYW5kbGUtZXJyb3JzJyk7XG5jb25zdCBCcm93c2VyQ29ubmVjdGlvbkdhdGV3YXkgPSBsYXp5UmVxdWlyZSgnLi9icm93c2VyL2Nvbm5lY3Rpb24vZ2F0ZXdheScpO1xuY29uc3QgQnJvd3NlckNvbm5lY3Rpb24gICAgICAgID0gbGF6eVJlcXVpcmUoJy4vYnJvd3Nlci9jb25uZWN0aW9uJyk7XG5jb25zdCBicm93c2VyUHJvdmlkZXJQb29sICAgICAgPSBsYXp5UmVxdWlyZSgnLi9icm93c2VyL3Byb3ZpZGVyL3Bvb2wnKTtcbmNvbnN0IENvbXBpbGVySG9zdCAgICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL3NlcnZpY2VzL2NvbXBpbGVyL2hvc3QnKTtcbmNvbnN0IFJ1bm5lciAgICAgICAgICAgICAgICAgICA9IGxhenlSZXF1aXJlKCcuL3J1bm5lcicpO1xuY29uc3QgTGl2ZU1vZGVSdW5uZXIgICAgICAgICAgID0gbGF6eVJlcXVpcmUoJy4vbGl2ZS90ZXN0LXJ1bm5lcicpO1xuXG4vLyBOT1RFOiBDb2ZmZWVTY3JpcHQgY2FuJ3QgYmUgbG9hZGVkIGxhemlseSwgYmVjYXVzZSBpdCB3aWxsIGJyZWFrIHN0YWNrIHRyYWNlc1xucmVxdWlyZSgnY29mZmVlc2NyaXB0Jyk7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFRlc3RDYWZlIHtcbiAgICBjb25zdHJ1Y3RvciAoY29uZmlndXJhdGlvbikge1xuICAgICAgICBzZXR1cFNvdXJjZU1hcFN1cHBvcnQoKTtcbiAgICAgICAgZXJyb3JIYW5kbGVycy5yZWdpc3RlckVycm9ySGFuZGxlcnMoKTtcblxuICAgICAgICBjb25zdCB7IGhvc3RuYW1lLCBwb3J0MSwgcG9ydDIsIG9wdGlvbnMgfSA9IGNvbmZpZ3VyYXRpb24uc3RhcnRPcHRpb25zO1xuXG4gICAgICAgIHRoaXMuY2xvc2VkICAgICAgICA9IGZhbHNlO1xuICAgICAgICB0aGlzLnByb3h5ICAgICAgICAgPSBuZXcgaGFtbWVyaGVhZC5Qcm94eShob3N0bmFtZSwgcG9ydDEsIHBvcnQyLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5ydW5uZXJzICAgICAgID0gW107XG4gICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb247XG5cbiAgICAgICAgdGhpcy5icm93c2VyQ29ubmVjdGlvbkdhdGV3YXkgPSBuZXcgQnJvd3NlckNvbm5lY3Rpb25HYXRld2F5KHRoaXMucHJveHksIHtcbiAgICAgICAgICAgIHJldHJ5VGVzdFBhZ2VzOiBjb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMucmV0cnlUZXN0UGFnZXMpLFxuICAgICAgICAgICAgcHJveHlsZXNzOiAgICAgIGNvbmZpZ3VyYXRpb24uZ2V0T3B0aW9uKE9QVElPTl9OQU1FUy5wcm94eWxlc3MpLFxuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLmV4cGVyaW1lbnRhbERlYnVnKSkge1xuICAgICAgICAgICAgY29uc3QgZGV2ZWxvcG1lbnRNb2RlID0gY29uZmlndXJhdGlvbi5nZXRPcHRpb24oT1BUSU9OX05BTUVTLmRldmVsb3BtZW50TW9kZSk7XG4gICAgICAgICAgICBjb25zdCB2OEZsYWdzICAgICAgICAgPSBjb25maWd1cmF0aW9uLmdldE9wdGlvbihPUFRJT05fTkFNRVMudjhGbGFncyk7XG5cbiAgICAgICAgICAgIHRoaXMuY29tcGlsZXJTZXJ2aWNlID0gbmV3IENvbXBpbGVySG9zdCh7IGRldmVsb3BtZW50TW9kZSwgdjhGbGFncyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3JlZ2lzdGVyQXNzZXRzKG9wdGlvbnMuZGV2ZWxvcG1lbnRNb2RlKTtcbiAgICB9XG5cbiAgICBfcmVnaXN0ZXJBc3NldHMgKGRldmVsb3BtZW50TW9kZSkge1xuICAgICAgICBjb25zdCB7IGZhdkljb24sIGNvcmVTY3JpcHQsIGRyaXZlclNjcmlwdCwgdWlTY3JpcHQsXG4gICAgICAgICAgICB1aVN0eWxlLCB1aVNwcml0ZSwgdWlTcHJpdGVTdmcsIGF1dG9tYXRpb25TY3JpcHQsIGxlZ2FjeVJ1bm5lclNjcmlwdCB9ID0gbG9hZEFzc2V0cyhkZXZlbG9wbWVudE1vZGUpO1xuXG4gICAgICAgIHRoaXMucHJveHkuR0VUKElOSkVDVEFCTEVTLlRFU1RDQUZFX0NPUkUsIHsgY29udGVudDogY29yZVNjcmlwdCwgY29udGVudFR5cGU6IENPTlRFTlRfVFlQRVMuamF2YXNjcmlwdCB9KTtcbiAgICAgICAgdGhpcy5wcm94eS5HRVQoSU5KRUNUQUJMRVMuVEVTVENBRkVfRFJJVkVSLCB7IGNvbnRlbnQ6IGRyaXZlclNjcmlwdCwgY29udGVudFR5cGU6IENPTlRFTlRfVFlQRVMuamF2YXNjcmlwdCB9KTtcblxuICAgICAgICB0aGlzLnByb3h5LkdFVChJTkpFQ1RBQkxFUy5URVNUQ0FGRV9MRUdBQ1lfUlVOTkVSLCB7XG4gICAgICAgICAgICBjb250ZW50OiAgICAgbGVnYWN5UnVubmVyU2NyaXB0LFxuICAgICAgICAgICAgY29udGVudFR5cGU6IENPTlRFTlRfVFlQRVMuamF2YXNjcmlwdCxcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5wcm94eS5HRVQoSU5KRUNUQUJMRVMuVEVTVENBRkVfQVVUT01BVElPTiwgeyBjb250ZW50OiBhdXRvbWF0aW9uU2NyaXB0LCBjb250ZW50VHlwZTogQ09OVEVOVF9UWVBFUy5qYXZhc2NyaXB0IH0pO1xuICAgICAgICB0aGlzLnByb3h5LkdFVChJTkpFQ1RBQkxFUy5URVNUQ0FGRV9VSSwgeyBjb250ZW50OiB1aVNjcmlwdCwgY29udGVudFR5cGU6IENPTlRFTlRfVFlQRVMuamF2YXNjcmlwdCB9KTtcbiAgICAgICAgdGhpcy5wcm94eS5HRVQoSU5KRUNUQUJMRVMuVEVTVENBRkVfVUlfU1BSSVRFLCB7IGNvbnRlbnQ6IHVpU3ByaXRlLCBjb250ZW50VHlwZTogQ09OVEVOVF9UWVBFUy5wbmcgfSk7XG4gICAgICAgIHRoaXMucHJveHkuR0VUKElOSkVDVEFCTEVTLlRFU1RDQUZFX1VJX1NQUklURV9TVkcsIHsgY29udGVudDogdWlTcHJpdGVTdmcsIGNvbnRlbnRUeXBlOiBDT05URU5UX1RZUEVTLnN2ZyB9KTtcbiAgICAgICAgdGhpcy5wcm94eS5HRVQoSU5KRUNUQUJMRVMuREVGQVVMVF9GQVZJQ09OX1BBVEgsIHsgY29udGVudDogZmF2SWNvbiwgY29udGVudFR5cGU6IENPTlRFTlRfVFlQRVMuaWNvbiB9KTtcblxuICAgICAgICB0aGlzLnByb3h5LkdFVChJTkpFQ1RBQkxFUy5URVNUQ0FGRV9VSV9TVFlMRVMsIHtcbiAgICAgICAgICAgIGNvbnRlbnQ6ICAgICAgICAgICAgICB1aVN0eWxlLFxuICAgICAgICAgICAgY29udGVudFR5cGU6ICAgICAgICAgIENPTlRFTlRfVFlQRVMuY3NzLFxuICAgICAgICAgICAgaXNTaGFkb3dVSVN0eWxlc2hlZXQ6IHRydWUsXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIF9jcmVhdGVSdW5uZXIgKGlzTGl2ZU1vZGUpIHtcbiAgICAgICAgY29uc3QgQ3RvciAgICAgID0gaXNMaXZlTW9kZSA/IExpdmVNb2RlUnVubmVyIDogUnVubmVyO1xuICAgICAgICBjb25zdCBuZXdSdW5uZXIgPSBuZXcgQ3Rvcih7XG4gICAgICAgICAgICBwcm94eTogICAgICAgICAgICAgICAgICAgIHRoaXMucHJveHksXG4gICAgICAgICAgICBicm93c2VyQ29ubmVjdGlvbkdhdGV3YXk6IHRoaXMuYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LFxuICAgICAgICAgICAgY29uZmlndXJhdGlvbjogICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb24uY2xvbmUoT1BUSU9OX05BTUVTLmhvb2tzKSxcbiAgICAgICAgICAgIGNvbXBpbGVyU2VydmljZTogICAgICAgICAgdGhpcy5jb21waWxlclNlcnZpY2UsXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMucnVubmVycy5wdXNoKG5ld1J1bm5lcik7XG5cbiAgICAgICAgcmV0dXJuIG5ld1J1bm5lcjtcbiAgICB9XG5cbiAgICAvLyBBUElcbiAgICBhc3luYyBjcmVhdGVCcm93c2VyQ29ubmVjdGlvbiAoKSB7XG4gICAgICAgIGNvbnN0IGJyb3dzZXJJbmZvID0gYXdhaXQgYnJvd3NlclByb3ZpZGVyUG9vbC5nZXRCcm93c2VySW5mbygncmVtb3RlJyk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBCcm93c2VyQ29ubmVjdGlvbih0aGlzLmJyb3dzZXJDb25uZWN0aW9uR2F0ZXdheSwgYnJvd3NlckluZm8sIHRydWUpO1xuICAgIH1cblxuICAgIGNyZWF0ZVJ1bm5lciAoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9jcmVhdGVSdW5uZXIoZmFsc2UpO1xuICAgIH1cblxuICAgIGNyZWF0ZUxpdmVNb2RlUnVubmVyICgpIHtcbiAgICAgICAgaWYgKHRoaXMucnVubmVycy5zb21lKHJ1bm5lciA9PiBydW5uZXIgaW5zdGFuY2VvZiBMaXZlTW9kZVJ1bm5lcikpXG4gICAgICAgICAgICB0aHJvdyBuZXcgR2VuZXJhbEVycm9yKFJVTlRJTUVfRVJST1JTLmNhbm5vdENyZWF0ZU11bHRpcGxlTGl2ZU1vZGVSdW5uZXJzKTtcblxuICAgICAgICByZXR1cm4gdGhpcy5fY3JlYXRlUnVubmVyKHRydWUpO1xuICAgIH1cblxuICAgIGFzeW5jIGNsb3NlICgpIHtcbiAgICAgICAgaWYgKHRoaXMuY2xvc2VkKVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHRoaXMuY2xvc2VkID0gdHJ1ZTtcblxuICAgICAgICBhd2FpdCBQcm9taXNlLmFsbCh0aGlzLnJ1bm5lcnMubWFwKHJ1bm5lciA9PiBydW5uZXIuc3RvcCgpKSk7XG5cbiAgICAgICAgYXdhaXQgYnJvd3NlclByb3ZpZGVyUG9vbC5kaXNwb3NlKCk7XG5cbiAgICAgICAgaWYgKHRoaXMuY29tcGlsZXJTZXJ2aWNlKVxuICAgICAgICAgICAgdGhpcy5jb21waWxlclNlcnZpY2Uuc3RvcCgpO1xuXG4gICAgICAgIGF3YWl0IHRoaXMuYnJvd3NlckNvbm5lY3Rpb25HYXRld2F5LmNsb3NlKCk7XG4gICAgICAgIHRoaXMucHJveHkuY2xvc2UoKTtcbiAgICB9XG59XG4iXX0=