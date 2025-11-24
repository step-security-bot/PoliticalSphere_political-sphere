'use strict';

customElements.define('compodoc-menu', class extends HTMLElement {
    constructor() {
        super();
        this.isNormalMode = this.getAttribute('mode') === 'normal';
    }

    connectedCallback() {
        this.render(this.isNormalMode);
    }

    render(isNormalMode) {
        let tp = lithtml.html(`
        <nav>
            <ul class="list">
                <li class="title">
                    <a href="index.html" data-type="index-link">political-sphere documentation</a>
                </li>

                <li class="divider"></li>
                ${ isNormalMode ? `<div id="book-search-input" role="search"><input type="text" placeholder="Type to search"></div>` : '' }
                <li class="chapter">
                    <a data-type="chapter-link" href="index.html"><span class="icon ion-ios-home"></span>Getting started</a>
                    <ul class="links">
                                <li class="link">
                                    <a href="overview.html" data-type="chapter-link">
                                        <span class="icon ion-ios-keypad"></span>Overview
                                    </a>
                                </li>

                            <li class="link">
                                <a href="index.html" data-type="chapter-link">
                                    <span class="icon ion-ios-paper"></span>
                                        README
                                </a>
                            </li>
                        <li class="link">
                            <a href="changelog.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CHANGELOG
                            </a>
                        </li>
                        <li class="link">
                            <a href="contributing.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>CONTRIBUTING
                            </a>
                        </li>
                        <li class="link">
                            <a href="license.html"  data-type="chapter-link">
                                <span class="icon ion-ios-paper"></span>LICENSE
                            </a>
                        </li>
                                <li class="link">
                                    <a href="dependencies.html" data-type="chapter-link">
                                        <span class="icon ion-ios-list"></span>Dependencies
                                    </a>
                                </li>

                    </ul>
                </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#classes-links"' :
                            'data-bs-target="#xs-classes-links"' }>
                            <span class="icon ion-ios-paper"></span>
                            <span>Classes</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="classes-links"' : 'id="xs-classes-links"' }>
                            <li class="link">
                                <a href="classes/AgeVerificationService.html" data-type="entity-link" >AgeVerificationService</a>
                            </li>
                            <li class="link">
                                <a href="classes/AgeVerificationService-1.html" data-type="entity-link" >AgeVerificationService</a>
                            </li>
                            <li class="link">
                                <a href="classes/AggregateMetricsTransformer.html" data-type="entity-link" >AggregateMetricsTransformer</a>
                            </li>
                            <li class="link">
                                <a href="classes/AISystemError.html" data-type="entity-link" >AISystemError</a>
                            </li>
                            <li class="link">
                                <a href="classes/AISystemInventory.html" data-type="entity-link" >AISystemInventory</a>
                            </li>
                            <li class="link">
                                <a href="classes/AITracer.html" data-type="entity-link" >AITracer</a>
                            </li>
                            <li class="link">
                                <a href="classes/AlertingService.html" data-type="entity-link" >AlertingService</a>
                            </li>
                            <li class="link">
                                <a href="classes/AnalyticsPipeline.html" data-type="entity-link" >AnalyticsPipeline</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApiClient.html" data-type="entity-link" >ApiClient</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApiConnector.html" data-type="entity-link" >ApiConnector</a>
                            </li>
                            <li class="link">
                                <a href="classes/ApiError.html" data-type="entity-link" >ApiError</a>
                            </li>
                            <li class="link">
                                <a href="classes/App.html" data-type="entity-link" >App</a>
                            </li>
                            <li class="link">
                                <a href="classes/AppError.html" data-type="entity-link" >AppError</a>
                            </li>
                            <li class="link">
                                <a href="classes/AppError-1.html" data-type="entity-link" >AppError</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuditLoggerImpl.html" data-type="entity-link" >AuditLoggerImpl</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthHelper.html" data-type="entity-link" >AuthHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/AuthService.html" data-type="entity-link" >AuthService</a>
                            </li>
                            <li class="link">
                                <a href="classes/BasePage.html" data-type="entity-link" >BasePage</a>
                            </li>
                            <li class="link">
                                <a href="classes/BiasMonitoringSystem.html" data-type="entity-link" >BiasMonitoringSystem</a>
                            </li>
                            <li class="link">
                                <a href="classes/BillService.html" data-type="entity-link" >BillService</a>
                            </li>
                            <li class="link">
                                <a href="classes/BillService-1.html" data-type="entity-link" >BillService</a>
                            </li>
                            <li class="link">
                                <a href="classes/BillStore.html" data-type="entity-link" >BillStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/BreachNotificationManager.html" data-type="entity-link" >BreachNotificationManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/CacheService.html" data-type="entity-link" >CacheService</a>
                            </li>
                            <li class="link">
                                <a href="classes/CacheService-1.html" data-type="entity-link" >CacheService</a>
                            </li>
                            <li class="link">
                                <a href="classes/CircuitBreaker.html" data-type="entity-link" >CircuitBreaker</a>
                            </li>
                            <li class="link">
                                <a href="classes/CircuitBreaker-1.html" data-type="entity-link" >CircuitBreaker</a>
                            </li>
                            <li class="link">
                                <a href="classes/ComplianceService.html" data-type="entity-link" >ComplianceService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ComplianceService-1.html" data-type="entity-link" >ComplianceService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ComplianceService-2.html" data-type="entity-link" >ComplianceService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConflictError.html" data-type="entity-link" >ConflictError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConnectionTracker.html" data-type="entity-link" >ConnectionTracker</a>
                            </li>
                            <li class="link">
                                <a href="classes/ConsentManager.html" data-type="entity-link" >ConsentManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseBackupManager.html" data-type="entity-link" >DatabaseBackupManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseConnection.html" data-type="entity-link" >DatabaseConnection</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseConnectionPool.html" data-type="entity-link" >DatabaseConnectionPool</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseConnector.html" data-type="entity-link" >DatabaseConnector</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseError.html" data-type="entity-link" >DatabaseError</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseHelper.html" data-type="entity-link" >DatabaseHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseMigrator.html" data-type="entity-link" >DatabaseMigrator</a>
                            </li>
                            <li class="link">
                                <a href="classes/DatabaseSeeder.html" data-type="entity-link" >DatabaseSeeder</a>
                            </li>
                            <li class="link">
                                <a href="classes/DataCleanupJob.html" data-type="entity-link" >DataCleanupJob</a>
                            </li>
                            <li class="link">
                                <a href="classes/DataServer.html" data-type="entity-link" >DataServer</a>
                            </li>
                            <li class="link">
                                <a href="classes/DevServer.html" data-type="entity-link" >DevServer</a>
                            </li>
                            <li class="link">
                                <a href="classes/DSARHandler.html" data-type="entity-link" >DSARHandler</a>
                            </li>
                            <li class="link">
                                <a href="classes/ElectionService.html" data-type="entity-link" >ElectionService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorBoundary.html" data-type="entity-link" >ErrorBoundary</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorFactory.html" data-type="entity-link" >ErrorFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/ErrorTracker.html" data-type="entity-link" >ErrorTracker</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExportReportsJob.html" data-type="entity-link" >ExportReportsJob</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalServiceError.html" data-type="entity-link" >ExternalServiceError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ExternalSourcesConnector.html" data-type="entity-link" >ExternalSourcesConnector</a>
                            </li>
                            <li class="link">
                                <a href="classes/FeatureFlagService.html" data-type="entity-link" >FeatureFlagService</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileCache.html" data-type="entity-link" >FileCache</a>
                            </li>
                            <li class="link">
                                <a href="classes/FileNewsStore.html" data-type="entity-link" >FileNewsStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/GameBoardPage.html" data-type="entity-link" >GameBoardPage</a>
                            </li>
                            <li class="link">
                                <a href="classes/GameEventEmitter.html" data-type="entity-link" >GameEventEmitter</a>
                            </li>
                            <li class="link">
                                <a href="classes/GameService.html" data-type="entity-link" >GameService</a>
                            </li>
                            <li class="link">
                                <a href="classes/GameStateSyncPipeline.html" data-type="entity-link" >GameStateSyncPipeline</a>
                            </li>
                            <li class="link">
                                <a href="classes/GovernanceError.html" data-type="entity-link" >GovernanceError</a>
                            </li>
                            <li class="link">
                                <a href="classes/GovernFunction.html" data-type="entity-link" >GovernFunction</a>
                            </li>
                            <li class="link">
                                <a href="classes/GovernmentService.html" data-type="entity-link" >GovernmentService</a>
                            </li>
                            <li class="link">
                                <a href="classes/GovernmentService-1.html" data-type="entity-link" >GovernmentService</a>
                            </li>
                            <li class="link">
                                <a href="classes/HealthCheckService.html" data-type="entity-link" >HealthCheckService</a>
                            </li>
                            <li class="link">
                                <a href="classes/HttpError.html" data-type="entity-link" >HttpError</a>
                            </li>
                            <li class="link">
                                <a href="classes/InMemoryMemory.html" data-type="entity-link" >InMemoryMemory</a>
                            </li>
                            <li class="link">
                                <a href="classes/InMemoryResponseCache.html" data-type="entity-link" >InMemoryResponseCache</a>
                            </li>
                            <li class="link">
                                <a href="classes/JudiciaryService.html" data-type="entity-link" >JudiciaryService</a>
                            </li>
                            <li class="link">
                                <a href="classes/JudiciaryService-1.html" data-type="entity-link" >JudiciaryService</a>
                            </li>
                            <li class="link">
                                <a href="classes/Logger.html" data-type="entity-link" >Logger</a>
                            </li>
                            <li class="link">
                                <a href="classes/Logger-1.html" data-type="entity-link" >Logger</a>
                            </li>
                            <li class="link">
                                <a href="classes/Logger-2.html" data-type="entity-link" >Logger</a>
                            </li>
                            <li class="link">
                                <a href="classes/LoginPage.html" data-type="entity-link" >LoginPage</a>
                            </li>
                            <li class="link">
                                <a href="classes/ManageFunction.html" data-type="entity-link" >ManageFunction</a>
                            </li>
                            <li class="link">
                                <a href="classes/ManualTestingTracker.html" data-type="entity-link" >ManualTestingTracker</a>
                            </li>
                            <li class="link">
                                <a href="classes/MapFunction.html" data-type="entity-link" >MapFunction</a>
                            </li>
                            <li class="link">
                                <a href="classes/MapFunction-1.html" data-type="entity-link" >MapFunction</a>
                            </li>
                            <li class="link">
                                <a href="classes/MeasureFunction.html" data-type="entity-link" >MeasureFunction</a>
                            </li>
                            <li class="link">
                                <a href="classes/MemoryCache.html" data-type="entity-link" >MemoryCache</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetricsCollector.html" data-type="entity-link" >MetricsCollector</a>
                            </li>
                            <li class="link">
                                <a href="classes/MetricsCollector-1.html" data-type="entity-link" >MetricsCollector</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockProvider.html" data-type="entity-link" >MockProvider</a>
                            </li>
                            <li class="link">
                                <a href="classes/MockSocket.html" data-type="entity-link" >MockSocket</a>
                            </li>
                            <li class="link">
                                <a href="classes/ModelRegistry.html" data-type="entity-link" >ModelRegistry</a>
                            </li>
                            <li class="link">
                                <a href="classes/ModerationService.html" data-type="entity-link" >ModerationService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ModerationService-1.html" data-type="entity-link" >ModerationService</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsService.html" data-type="entity-link" >NewsService</a>
                            </li>
                            <li class="link">
                                <a href="classes/NewsService-1.html" data-type="entity-link" >NewsService</a>
                            </li>
                            <li class="link">
                                <a href="classes/NISTAIRMFOrchestrator.html" data-type="entity-link" >NISTAIRMFOrchestrator</a>
                            </li>
                            <li class="link">
                                <a href="classes/NLPService.html" data-type="entity-link" >NLPService</a>
                            </li>
                            <li class="link">
                                <a href="classes/NoopSpan.html" data-type="entity-link" >NoopSpan</a>
                            </li>
                            <li class="link">
                                <a href="classes/NoopTracer.html" data-type="entity-link" >NoopTracer</a>
                            </li>
                            <li class="link">
                                <a href="classes/NormalizeUserDataTransformer.html" data-type="entity-link" >NormalizeUserDataTransformer</a>
                            </li>
                            <li class="link">
                                <a href="classes/NotFoundError.html" data-type="entity-link" >NotFoundError</a>
                            </li>
                            <li class="link">
                                <a href="classes/OrchestrationEngine.html" data-type="entity-link" >OrchestrationEngine</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParliamentService.html" data-type="entity-link" >ParliamentService</a>
                            </li>
                            <li class="link">
                                <a href="classes/ParliamentService-1.html" data-type="entity-link" >ParliamentService</a>
                            </li>
                            <li class="link">
                                <a href="classes/PartyService.html" data-type="entity-link" >PartyService</a>
                            </li>
                            <li class="link">
                                <a href="classes/PartyStore.html" data-type="entity-link" >PartyStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/PerformanceHelper.html" data-type="entity-link" >PerformanceHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/PoliticalNeutralityEnforcer.html" data-type="entity-link" >PoliticalNeutralityEnforcer</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrismaDatabaseService.html" data-type="entity-link" >PrismaDatabaseService</a>
                            </li>
                            <li class="link">
                                <a href="classes/PrivacyError.html" data-type="entity-link" >PrivacyError</a>
                            </li>
                            <li class="link">
                                <a href="classes/RateLimitError.html" data-type="entity-link" >RateLimitError</a>
                            </li>
                            <li class="link">
                                <a href="classes/RedisCache.html" data-type="entity-link" >RedisCache</a>
                            </li>
                            <li class="link">
                                <a href="classes/RetentionPolicyManager.html" data-type="entity-link" >RetentionPolicyManager</a>
                            </li>
                            <li class="link">
                                <a href="classes/RiskManagementOrchestrator.html" data-type="entity-link" >RiskManagementOrchestrator</a>
                            </li>
                            <li class="link">
                                <a href="classes/RiskRegister.html" data-type="entity-link" >RiskRegister</a>
                            </li>
                            <li class="link">
                                <a href="classes/SanitizeInputsTransformer.html" data-type="entity-link" >SanitizeInputsTransformer</a>
                            </li>
                            <li class="link">
                                <a href="classes/ScheduledImportsJob.html" data-type="entity-link" >ScheduledImportsJob</a>
                            </li>
                            <li class="link">
                                <a href="classes/SpanWrapper.html" data-type="entity-link" >SpanWrapper</a>
                            </li>
                            <li class="link">
                                <a href="classes/StructuredLogger.html" data-type="entity-link" >StructuredLogger</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestDatabase.html" data-type="entity-link" >TestDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestDatabase-1.html" data-type="entity-link" >TestDatabase</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestDatabaseFactory.html" data-type="entity-link" >TestDatabaseFactory</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestDataGenerator.html" data-type="entity-link" >TestDataGenerator</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestDataSeeder.html" data-type="entity-link" >TestDataSeeder</a>
                            </li>
                            <li class="link">
                                <a href="classes/TestScenarios.html" data-type="entity-link" >TestScenarios</a>
                            </li>
                            <li class="link">
                                <a href="classes/ToolRegistry.html" data-type="entity-link" >ToolRegistry</a>
                            </li>
                            <li class="link">
                                <a href="classes/TransformationError.html" data-type="entity-link" >TransformationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/UnauthorizedError.html" data-type="entity-link" >UnauthorizedError</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserDataPipeline.html" data-type="entity-link" >UserDataPipeline</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserService.html" data-type="entity-link" >UserService</a>
                            </li>
                            <li class="link">
                                <a href="classes/UserStore.html" data-type="entity-link" >UserStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationError.html" data-type="entity-link" >ValidationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationError-1.html" data-type="entity-link" >ValidationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationError-2.html" data-type="entity-link" >ValidationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationError-3.html" data-type="entity-link" >ValidationError</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationGate.html" data-type="entity-link" >ValidationGate</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationGate-1.html" data-type="entity-link" >ValidationGate</a>
                            </li>
                            <li class="link">
                                <a href="classes/ValidationRegistry.html" data-type="entity-link" >ValidationRegistry</a>
                            </li>
                            <li class="link">
                                <a href="classes/VoteService.html" data-type="entity-link" >VoteService</a>
                            </li>
                            <li class="link">
                                <a href="classes/VoteService-1.html" data-type="entity-link" >VoteService</a>
                            </li>
                            <li class="link">
                                <a href="classes/VoteStore.html" data-type="entity-link" >VoteStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/VoteStore-1.html" data-type="entity-link" >VoteStore</a>
                            </li>
                            <li class="link">
                                <a href="classes/WCAGValidator.html" data-type="entity-link" >WCAGValidator</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebSocketHelper.html" data-type="entity-link" >WebSocketHelper</a>
                            </li>
                            <li class="link">
                                <a href="classes/WebSocketServer.html" data-type="entity-link" >WebSocketServer</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#interfaces-links"' :
                            'data-bs-target="#xs-interfaces-links"' }>
                            <span class="icon ion-md-information-circle-outline"></span>
                            <span>Interfaces</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? ' id="interfaces-links"' : 'id="xs-interfaces-links"' }>
                            <li class="link">
                                <a href="interfaces/AccessibilityResult.html" data-type="entity-link" >AccessibilityResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AccessibilityViolation.html" data-type="entity-link" >AccessibilityViolation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Agent.html" data-type="entity-link" >Agent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Agent-1.html" data-type="entity-link" >Agent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AgentConfig.html" data-type="entity-link" >AgentConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AgentInput.html" data-type="entity-link" >AgentInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AgentOutput.html" data-type="entity-link" >AgentOutput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AgentResult.html" data-type="entity-link" >AgentResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AgeVerifiedRequest.html" data-type="entity-link" >AgeVerifiedRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AggregatedMetric.html" data-type="entity-link" >AggregatedMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AISystemRegistration.html" data-type="entity-link" >AISystemRegistration</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlertingConfig.html" data-type="entity-link" >AlertingConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AlertRule.html" data-type="entity-link" >AlertRule</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AnalyticsSummary.html" data-type="entity-link" >AnalyticsSummary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiConfig.html" data-type="entity-link" >ApiConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiMethods.html" data-type="entity-link" >ApiMethods</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApiResponse-1.html" data-type="entity-link" >ApiResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AppConfig.html" data-type="entity-link" >AppConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ApprovalRating.html" data-type="entity-link" >ApprovalRating</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditEntry.html" data-type="entity-link" >AuditEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditEvent.html" data-type="entity-link" >AuditEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditEvent-1.html" data-type="entity-link" >AuditEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditLogEntry.html" data-type="entity-link" >AuditLogEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditLogger.html" data-type="entity-link" >AuditLogger</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditRequestLike.html" data-type="entity-link" >AuditRequestLike</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditResponseLike.html" data-type="entity-link" >AuditResponseLike</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuditRun.html" data-type="entity-link" >AuditRun</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthContextType.html" data-type="entity-link" >AuthContextType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthFormProps.html" data-type="entity-link" >AuthFormProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthProviderProps.html" data-type="entity-link" >AuthProviderProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthRequest.html" data-type="entity-link" >AuthRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthResult.html" data-type="entity-link" >AuthResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthTokens.html" data-type="entity-link" >AuthTokens</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthUser.html" data-type="entity-link" >AuthUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthUser-1.html" data-type="entity-link" >AuthUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthUser-2.html" data-type="entity-link" >AuthUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AuthUser-3.html" data-type="entity-link" >AuthUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/AxeTestConfig.html" data-type="entity-link" >AxeTestConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BackupConfig.html" data-type="entity-link" >BackupConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BackupOptions.html" data-type="entity-link" >BackupOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BiasAlert.html" data-type="entity-link" >BiasAlert</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BiasMetric.html" data-type="entity-link" >BiasMetric</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Bill.html" data-type="entity-link" >Bill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Bill-1.html" data-type="entity-link" >Bill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Bill-2.html" data-type="entity-link" >Bill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Bill-3.html" data-type="entity-link" >Bill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/BillVotes.html" data-type="entity-link" >BillVotes</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ButtonProps.html" data-type="entity-link" >ButtonProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Cabinet.html" data-type="entity-link" >Cabinet</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CabinetMeeting.html" data-type="entity-link" >CabinetMeeting</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CacheConfig.html" data-type="entity-link" >CacheConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CachedContext.html" data-type="entity-link" >CachedContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CacheEntry.html" data-type="entity-link" >CacheEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CacheEntry-1.html" data-type="entity-link" >CacheEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Campaign.html" data-type="entity-link" >Campaign</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Candidate.html" data-type="entity-link" >Candidate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Candidate-1.html" data-type="entity-link" >Candidate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CaptchaProps.html" data-type="entity-link" >CaptchaProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CaptchaRef.html" data-type="entity-link" >CaptchaRef</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CardProps.html" data-type="entity-link" >CardProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Catalogue.html" data-type="entity-link" >Catalogue</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chamber.html" data-type="entity-link" >Chamber</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chamber-1.html" data-type="entity-link" >Chamber</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Chamber-2.html" data-type="entity-link" >Chamber</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CleanupConfig.html" data-type="entity-link" >CleanupConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CommandControl.html" data-type="entity-link" >CommandControl</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComplianceAlert.html" data-type="entity-link" >ComplianceAlert</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComplianceConfig.html" data-type="entity-link" >ComplianceConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ComplianceEvent.html" data-type="entity-link" >ComplianceEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConfirmDialogProps.html" data-type="entity-link" >ConfirmDialogProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConsentRecord.html" data-type="entity-link" >ConsentRecord</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ConsentResult.html" data-type="entity-link" >ConsentResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Constituency.html" data-type="entity-link" >Constituency</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Constituency-1.html" data-type="entity-link" >Constituency</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Constituency-2.html" data-type="entity-link" >Constituency</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ContextSwitch.html" data-type="entity-link" >ContextSwitch</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateCabinetMeetingData.html" data-type="entity-link" >CreateCabinetMeetingData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateCaseData.html" data-type="entity-link" >CreateCaseData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateExecutiveActionData.html" data-type="entity-link" >CreateExecutiveActionData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateGameRequest.html" data-type="entity-link" >CreateGameRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateGameResponse.html" data-type="entity-link" >CreateGameResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateGovernmentData.html" data-type="entity-link" >CreateGovernmentData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateJudgeData.html" data-type="entity-link" >CreateJudgeData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateMinisterData.html" data-type="entity-link" >CreateMinisterData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreatePrecedentData.html" data-type="entity-link" >CreatePrecedentData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateReviewData.html" data-type="entity-link" >CreateReviewData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/CreateRulingData.html" data-type="entity-link" >CreateRulingData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Database.html" data-type="entity-link" >Database</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DatabaseConfig.html" data-type="entity-link" >DatabaseConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DatabaseConfig-1.html" data-type="entity-link" >DatabaseConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DatabaseConnectionWrapper.html" data-type="entity-link" >DatabaseConnectionWrapper</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DatabaseService.html" data-type="entity-link" >DatabaseService</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DataBreachIncident.html" data-type="entity-link" >DataBreachIncident</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DataFeed.html" data-type="entity-link" >DataFeed</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DataRetentionPolicy.html" data-type="entity-link" >DataRetentionPolicy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Debate.html" data-type="entity-link" >Debate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Debate-1.html" data-type="entity-link" >Debate</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/DSARRequest.html" data-type="entity-link" >DSARRequest</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EconomyState.html" data-type="entity-link" >EconomyState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Election.html" data-type="entity-link" >Election</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Election-1.html" data-type="entity-link" >Election</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Election-2.html" data-type="entity-link" >Election</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ElectionsCenterProps.html" data-type="entity-link" >ElectionsCenterProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ElectionsManagerProps.html" data-type="entity-link" >ElectionsManagerProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ElectionVoteResult.html" data-type="entity-link" >ElectionVoteResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorBoundaryProps.html" data-type="entity-link" >ErrorBoundaryProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorBoundaryState.html" data-type="entity-link" >ErrorBoundaryState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorContext.html" data-type="entity-link" >ErrorContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ErrorTrackingConfig.html" data-type="entity-link" >ErrorTrackingConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/EscalationPolicy.html" data-type="entity-link" >EscalationPolicy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExecutionOptions.html" data-type="entity-link" >ExecutionOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExecutionResult.html" data-type="entity-link" >ExecutionResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExecutiveAction.html" data-type="entity-link" >ExecutiveAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExecutiveAction-1.html" data-type="entity-link" >ExecutiveAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ExternalSourceConfig.html" data-type="entity-link" >ExternalSourceConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeatureFlag.html" data-type="entity-link" >FeatureFlag</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FeatureFlags.html" data-type="entity-link" >FeatureFlags</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FlagContext.html" data-type="entity-link" >FlagContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/FlagRule.html" data-type="entity-link" >FlagRule</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ForgotPasswordModalProps.html" data-type="entity-link" >ForgotPasswordModalProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GameClient.html" data-type="entity-link" >GameClient</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GameData.html" data-type="entity-link" >GameData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GameEvent.html" data-type="entity-link" >GameEvent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GameMessage.html" data-type="entity-link" >GameMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GameState.html" data-type="entity-link" >GameState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GameState-1.html" data-type="entity-link" >GameState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GateConfig.html" data-type="entity-link" >GateConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Governance.html" data-type="entity-link" >Governance</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Government.html" data-type="entity-link" >Government</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Government-1.html" data-type="entity-link" >Government</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GovernmentDashboardProps.html" data-type="entity-link" >GovernmentDashboardProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/GracefulShutdownOptions.html" data-type="entity-link" >GracefulShutdownOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HealthChecker.html" data-type="entity-link" >HealthChecker</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HealthCheckResult.html" data-type="entity-link" >HealthCheckResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/HistogramData.html" data-type="entity-link" >HistogramData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ImportJobConfig.html" data-type="entity-link" >ImportJobConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Judge.html" data-type="entity-link" >Judge</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Judge-1.html" data-type="entity-link" >Judge</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JudicialCase.html" data-type="entity-link" >JudicialCase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JudiciarySystemProps.html" data-type="entity-link" >JudiciarySystemProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JwtPayload.html" data-type="entity-link" >JwtPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JWTPayload.html" data-type="entity-link" >JWTPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/JWTRefreshPayload.html" data-type="entity-link" >JWTRefreshPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LegalCase.html" data-type="entity-link" >LegalCase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ListParams.html" data-type="entity-link" >ListParams</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadingContextType.html" data-type="entity-link" >LoadingContextType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadingProviderProps.html" data-type="entity-link" >LoadingProviderProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadingSpinnerProps.html" data-type="entity-link" >LoadingSpinnerProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadingState.html" data-type="entity-link" >LoadingState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoadingStates.html" data-type="entity-link" >LoadingStates</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LogEntry.html" data-type="entity-link" >LogEntry</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Logger.html" data-type="entity-link" >Logger</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Logger-1.html" data-type="entity-link" >Logger</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoggerOptions.html" data-type="entity-link" >LoggerOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoggerOptions-1.html" data-type="entity-link" >LoggerOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoggingConfig.html" data-type="entity-link" >LoggingConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginInput.html" data-type="entity-link" >LoginInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginProps.html" data-type="entity-link" >LoginProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LoginProps-1.html" data-type="entity-link" >LoginProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/LogMeta.html" data-type="entity-link" >LogMeta</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MainGameProps.html" data-type="entity-link" >MainGameProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ManualTestItem.html" data-type="entity-link" >ManualTestItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ManualTestResult.html" data-type="entity-link" >ManualTestResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MediaCenterProps.html" data-type="entity-link" >MediaCenterProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MediaCoverage.html" data-type="entity-link" >MediaCoverage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MediaSystemProps.html" data-type="entity-link" >MediaSystemProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Memory.html" data-type="entity-link" >Memory</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Message.html" data-type="entity-link" >Message</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricControl.html" data-type="entity-link" >MetricControl</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricData.html" data-type="entity-link" >MetricData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricDataPoint.html" data-type="entity-link" >MetricDataPoint</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricsConfig.html" data-type="entity-link" >MetricsConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricSpec.html" data-type="entity-link" >MetricSpec</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MetricsReport.html" data-type="entity-link" >MetricsReport</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Minister.html" data-type="entity-link" >Minister</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Minister-1.html" data-type="entity-link" >Minister</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/MockPartyDatabase.html" data-type="entity-link" >MockPartyDatabase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ModelCard.html" data-type="entity-link" >ModelCard</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ModelProvider.html" data-type="entity-link" >ModelProvider</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Motion.html" data-type="entity-link" >Motion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Motion-1.html" data-type="entity-link" >Motion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Motion-2.html" data-type="entity-link" >Motion</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NeutralityCheckResult.html" data-type="entity-link" >NeutralityCheckResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsArticle.html" data-type="entity-link" >NewsArticle</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsArticle-1.html" data-type="entity-link" >NewsArticle</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsItem.html" data-type="entity-link" >NewsItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsItem-1.html" data-type="entity-link" >NewsItem</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsStore.html" data-type="entity-link" >NewsStore</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NewsValidationError.html" data-type="entity-link" >NewsValidationError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/NLPAnalysisResult.html" data-type="entity-link" >NLPAnalysisResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Observability.html" data-type="entity-link" >Observability</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Observability-1.html" data-type="entity-link" >Observability</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OpenAIClient.html" data-type="entity-link" >OpenAIClient</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrchestrationConfig.html" data-type="entity-link" >OrchestrationConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrchestrationContext.html" data-type="entity-link" >OrchestrationContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrchestrationResult.html" data-type="entity-link" >OrchestrationResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/OrchestratorInit.html" data-type="entity-link" >OrchestratorInit</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginatedResponse.html" data-type="entity-link" >PaginatedResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationOptions.html" data-type="entity-link" >PaginationOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PaginationQuery.html" data-type="entity-link" >PaginationQuery</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ParliamentChamberProps.html" data-type="entity-link" >ParliamentChamberProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Party.html" data-type="entity-link" >Party</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Party-1.html" data-type="entity-link" >Party</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Party-2.html" data-type="entity-link" >Party</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PartyFilter.html" data-type="entity-link" >PartyFilter</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PasswordStrength.html" data-type="entity-link" >PasswordStrength</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PerformanceMetrics.html" data-type="entity-link" >PerformanceMetrics</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PerspectiveClient.html" data-type="entity-link" >PerspectiveClient</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PipelineConfig.html" data-type="entity-link" >PipelineConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PipelineError.html" data-type="entity-link" >PipelineError</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PipelineMetrics.html" data-type="entity-link" >PipelineMetrics</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PipelineResult.html" data-type="entity-link" >PipelineResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Player.html" data-type="entity-link" >Player</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PlayerAction.html" data-type="entity-link" >PlayerAction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Policy.html" data-type="entity-link" >Policy</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PolicyContext.html" data-type="entity-link" >PolicyContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PolicyResult.html" data-type="entity-link" >PolicyResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PolicyViolation.html" data-type="entity-link" >PolicyViolation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Poll.html" data-type="entity-link" >Poll</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Poll-1.html" data-type="entity-link" >Poll</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Poll-2.html" data-type="entity-link" >Poll</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PoolConnection.html" data-type="entity-link" >PoolConnection</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Precedent.html" data-type="entity-link" >Precedent</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PressRelease.html" data-type="entity-link" >PressRelease</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/PressRelease-1.html" data-type="entity-link" >PressRelease</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Proposal.html" data-type="entity-link" >Proposal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Proposal-1.html" data-type="entity-link" >Proposal</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProtectedRouteProps.html" data-type="entity-link" >ProtectedRouteProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ProviderResponse.html" data-type="entity-link" >ProviderResponse</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QueryResult.html" data-type="entity-link" >QueryResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/QueuedBackup.html" data-type="entity-link" >QueuedBackup</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterInput.html" data-type="entity-link" >RegisterInput</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RegisterProps.html" data-type="entity-link" >RegisterProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportConfig.html" data-type="entity-link" >ReportConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ReportResult.html" data-type="entity-link" >ReportResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request-1.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Request-2.html" data-type="entity-link" >Request</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RequestLike.html" data-type="entity-link" >RequestLike</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResetOptions.html" data-type="entity-link" >ResetOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Response.html" data-type="entity-link" >Response</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResponseCache.html" data-type="entity-link" >ResponseCache</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ResponseLike.html" data-type="entity-link" >ResponseLike</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RetentionRule.html" data-type="entity-link" >RetentionRule</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Review.html" data-type="entity-link" >Review</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RGBColor.html" data-type="entity-link" >RGBColor</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RiskAssessment.html" data-type="entity-link" >RiskAssessment</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RiskMitigation.html" data-type="entity-link" >RiskMitigation</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RuleCondition.html" data-type="entity-link" >RuleCondition</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/RuleResult.html" data-type="entity-link" >RuleResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ruling.html" data-type="entity-link" >Ruling</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Ruling-1.html" data-type="entity-link" >Ruling</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ScheduleConfig.html" data-type="entity-link" >ScheduleConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SecureTokens.html" data-type="entity-link" >SecureTokens</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SeedConfig.html" data-type="entity-link" >SeedConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SeederOptions.html" data-type="entity-link" >SeederOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SeederResult.html" data-type="entity-link" >SeederResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SeedingResults.html" data-type="entity-link" >SeedingResults</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Session.html" data-type="entity-link" >Session</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimulationContextType.html" data-type="entity-link" >SimulationContextType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimulationProviderProps.html" data-type="entity-link" >SimulationProviderProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SimulationState.html" data-type="entity-link" >SimulationState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SkeletonCardProps.html" data-type="entity-link" >SkeletonCardProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SkeletonListProps.html" data-type="entity-link" >SkeletonListProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SkeletonProps.html" data-type="entity-link" >SkeletonProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SkeletonTextProps.html" data-type="entity-link" >SkeletonTextProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SLI.html" data-type="entity-link" >SLI</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SLI-1.html" data-type="entity-link" >SLI</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SLO.html" data-type="entity-link" >SLO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SLO-1.html" data-type="entity-link" >SLO</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SLODefinition.html" data-type="entity-link" >SLODefinition</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SLOMetrics.html" data-type="entity-link" >SLOMetrics</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/SLOStatus.html" data-type="entity-link" >SLOStatus</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Span.html" data-type="entity-link" >Span</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Speech.html" data-type="entity-link" >Speech</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Speech-1.html" data-type="entity-link" >Speech</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Statement.html" data-type="entity-link" >Statement</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Summary.html" data-type="entity-link" >Summary</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TelemetryConfig.html" data-type="entity-link" >TelemetryConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestBill.html" data-type="entity-link" >TestBill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestBill-1.html" data-type="entity-link" >TestBill</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestDatabase.html" data-type="entity-link" >TestDatabase</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestFixtureData.html" data-type="entity-link" >TestFixtureData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestParty.html" data-type="entity-link" >TestParty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestParty-1.html" data-type="entity-link" >TestParty</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestUser.html" data-type="entity-link" >TestUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestUser-1.html" data-type="entity-link" >TestUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestUser-2.html" data-type="entity-link" >TestUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TestUser-3.html" data-type="entity-link" >TestUser</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TextGenerationOptions.html" data-type="entity-link" >TextGenerationOptions</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToastContainerProps.html" data-type="entity-link" >ToastContainerProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToastContextType.html" data-type="entity-link" >ToastContextType</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToastMessage.html" data-type="entity-link" >ToastMessage</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToastProps.html" data-type="entity-link" >ToastProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToastProviderProps.html" data-type="entity-link" >ToastProviderProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TokenPayload.html" data-type="entity-link" >TokenPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TokenPayload-1.html" data-type="entity-link" >TokenPayload</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToolCall.html" data-type="entity-link" >ToolCall</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ToolDefinition.html" data-type="entity-link" >ToolDefinition</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Tracer.html" data-type="entity-link" >Tracer</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TraceSpan.html" data-type="entity-link" >TraceSpan</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Transaction.html" data-type="entity-link" >Transaction</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/TurnState.html" data-type="entity-link" >TurnState</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User-1.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User-2.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/User-3.html" data-type="entity-link" >User</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserData.html" data-type="entity-link" >UserData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserData-1.html" data-type="entity-link" >UserData</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserPreferences.html" data-type="entity-link" >UserPreferences</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserProfileProps.html" data-type="entity-link" >UserProfileProps</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/UserStats.html" data-type="entity-link" >UserStats</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationGateConfig.html" data-type="entity-link" >ValidationGateConfig</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationResult.html" data-type="entity-link" >ValidationResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidationResult-1.html" data-type="entity-link" >ValidationResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Validator.html" data-type="entity-link" >Validator</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidatorContext.html" data-type="entity-link" >ValidatorContext</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/ValidatorResult.html" data-type="entity-link" >ValidatorResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Validators.html" data-type="entity-link" >Validators</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VerificationResult.html" data-type="entity-link" >VerificationResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VerificationResult-1.html" data-type="entity-link" >VerificationResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VerificationStatus.html" data-type="entity-link" >VerificationStatus</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vote.html" data-type="entity-link" >Vote</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vote-1.html" data-type="entity-link" >Vote</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vote-2.html" data-type="entity-link" >Vote</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vote-3.html" data-type="entity-link" >Vote</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/Vote-4.html" data-type="entity-link" >Vote</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VoteCastResult.html" data-type="entity-link" >VoteCastResult</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VoteRecord.html" data-type="entity-link" >VoteRecord</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VoteResults.html" data-type="entity-link" >VoteResults</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VoteResults-1.html" data-type="entity-link" >VoteResults</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VoteResults-2.html" data-type="entity-link" >VoteResults</a>
                            </li>
                            <li class="link">
                                <a href="interfaces/VotesApi.html" data-type="entity-link" >VotesApi</a>
                            </li>
                        </ul>
                    </li>
                    <li class="chapter">
                        <div class="simple menu-toggler" data-bs-toggle="collapse" ${ isNormalMode ? 'data-bs-target="#miscellaneous-links"'
                            : 'data-bs-target="#xs-miscellaneous-links"' }>
                            <span class="icon ion-ios-cube"></span>
                            <span>Miscellaneous</span>
                            <span class="icon ion-ios-arrow-down"></span>
                        </div>
                        <ul class="links collapse " ${ isNormalMode ? 'id="miscellaneous-links"' : 'id="xs-miscellaneous-links"' }>
                            <li class="link">
                                <a href="miscellaneous/enumerations.html" data-type="entity-link">Enums</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/functions.html" data-type="entity-link">Functions</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/typealiases.html" data-type="entity-link">Type aliases</a>
                            </li>
                            <li class="link">
                                <a href="miscellaneous/variables.html" data-type="entity-link">Variables</a>
                            </li>
                        </ul>
                    </li>
                        <li class="chapter">
                            <a data-type="chapter-link" href="routes.html"><span class="icon ion-ios-git-branch"></span>Routes</a>
                        </li>
                    <li class="chapter">
                        <a data-type="chapter-link" href="coverage.html"><span class="icon ion-ios-stats"></span>Documentation coverage</a>
                    </li>
                    <li class="divider"></li>
                    <li class="copyright">
                        Documentation generated using <a href="https://compodoc.app/" target="_blank" rel="noopener noreferrer">
                            <img data-src="images/compodoc-vectorise.png" class="img-responsive" data-type="compodoc-logo">
                        </a>
                    </li>
            </ul>
        </nav>
        `);
        this.innerHTML = tp.strings;
    }
});