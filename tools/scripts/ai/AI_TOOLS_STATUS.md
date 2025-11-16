# AI Tools Status Inventory

**Version:** 1.0.0  
**Last Updated:** 2025-01-XX  
**Total Tools:** 37 files

## Executive Summary

This document provides a comprehensive status of all AI development tools in the Political Sphere project. Each tool is categorized by function and marked with operational status.

**Status Indicators:**
- ✅ **OPERATIONAL** - Tested and working correctly
- 🔄 **PENDING_TESTING** - Exists but not yet validated
- ⚠️ **NEEDS_FIX** - Exists but has known issues
- ❌ **NON_FUNCTIONAL** - Not working or obsolete
- 📝 **DOCUMENTATION_ONLY** - Referenced in docs but missing implementation

---

## Core Indexing & Search (7 tools)

### code-indexer.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Build and search semantic code index  
**Usage:** `node tools/scripts/ai/code-indexer.js build|search <query>`  
**Dependencies:** None identified  
**Notes:** Referenced in smoke test, needs path validation

### semantic-indexer.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Advanced semantic code analysis and indexing  
**Usage:** `node tools/scripts/ai/semantic-indexer.cjs`  
**Dependencies:** embedding-engine.cjs, vector-store.cjs  
**Notes:** Part of AI hub system

### incremental-indexer.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Incremental code indexing for changed files  
**Usage:** `node tools/scripts/ai/incremental-indexer.js`  
**Dependencies:** code-indexer.js  
**Notes:** Optimize reindexing performance

### index-if-changed.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Conditional indexing based on file changes  
**Usage:** `node tools/scripts/ai/index-if-changed.js`  
**Dependencies:** git, code-indexer.js  
**Notes:** CI/CD integration candidate

### index-server.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** HTTP API server for code index queries  
**Usage:** `node tools/scripts/ai/index-server.js` (runs on port 3001)  
**Endpoints:** `/health`, `/search?q=`, `/metrics`  
**Dependencies:** code-indexer.js  
**Notes:** Referenced in smoke test with health checks

### embeddings.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Generate vector embeddings for code  
**Usage:** `node tools/scripts/ai/embeddings.js`  
**Dependencies:** AI model (unspecified)  
**Notes:** Foundation for semantic search

### embedding-engine.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Advanced embedding engine with caching  
**Usage:** `node tools/scripts/ai/embedding-engine.cjs test`  
**Dependencies:** External AI model API  
**Notes:** install-upgrades.sh validates with timeout (90s)

---

## Context & Caching (6 tools)

### context-preloader.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Preload and manage AI context bundles  
**Usage:** `node tools/scripts/ai/context-preloader.js preload|get <context>`  
**Dependencies:** tools/ai/context-bundles/  
**Notes:** Referenced in smoke test

### build-context-bundles.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Generate context bundles for AI assistants  
**Usage:** `node tools/scripts/ai/build-context-bundles.js`  
**Output:** tools/ai/context-bundles/*.md  
**Notes:** Should run before context-preloader

### pre-cache.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Pre-warm caches for faster AI responses  
**Usage:** `node tools/scripts/ai/pre-cache.js`  
**Environment:** PRE_CACHE_MAX_ENTRIES (default: 1000)  
**Notes:** Referenced in README.md CI workflow

### cache-manager.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Manage AI response caching  
**Usage:** Library import  
**Dependencies:** ai/ai-cache/  
**Notes:** Used by ai-hub.cjs

### smart-cache.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Intelligent cache with LRU eviction  
**Usage:** Library import  
**Dependencies:** None  
**Notes:** Advanced caching logic

### context-optimizer.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Optimize context window usage  
**Usage:** Library import  
**Dependencies:** None  
**Notes:** Token budget management

---

## Quality & Governance (8 tools)

### competence-monitor.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Assess AI assistant code quality and competence  
**Usage:** `node tools/scripts/ai/competence-monitor.js assess`  
**Tests:** competence-monitor.spec.js (exists)  
**Notes:** Referenced in smoke test, has test suite

### ci-neutrality-check.mts
**Status:** ✅ OPERATIONAL  
**Purpose:** CI/CD political neutrality validation  
**Usage:** `node tools/scripts/ai/ci-neutrality-check.mts <files...>`  
**Integration:** .github/workflows/ai-governance.yml  
**Notes:** Actively used in CI pipeline

### precommit-neutrality.mts
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Pre-commit hook for neutrality validation  
**Usage:** Git hook (symlink to .git/hooks/pre-commit)  
**Integration:** Should be in .lefthook.yml  
**Notes:** Currently not integrated

### guard-change-budget.mjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Enforce change budget limits (Fast-Secure/Safe/Audit modes)  
**Usage:** `node tools/scripts/ai/guard-change-budget.mjs`  
**Integration:** Should be in CI workflows  
**Notes:** Referenced in governance docs

### risk-assessment-integration.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Integrate AI risk assessment into workflows  
**Usage:** `node tools/scripts/ai/risk-assessment-integration.js`  
**Dependencies:** docs/06-security-and-risk/risk-register.md  
**Notes:** NIST AI RMF 1.0 compliance

### model-validation-pipeline.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Validate AI model outputs for bias and quality  
**Usage:** `node tools/scripts/ai/model-validation-pipeline.js`  
**Notes:** AI governance requirement

### performance-monitor.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Monitor AI tool performance and metrics  
**Usage:** `node tools/scripts/ai/performance-monitor.js`  
**Outputs:** ai-metrics/  
**Notes:** Should feed into observability stack

### analytics.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** AI usage analytics and reporting  
**Usage:** `node tools/scripts/ai/analytics.js`  
**Notes:** Track AI assistance effectiveness

---

## Advanced AI Core (10 tools)

### ai-hub.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Unified AI intelligence hub - single interface for all AI capabilities  
**Usage:** Library import or CLI  
**Dependencies:** code-analyzer.cjs, expert-knowledge.cjs, pattern-matcher.cjs  
**Notes:** Central orchestration layer

### ai-assistant.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Interactive AI coding assistant  
**Usage:** `node tools/scripts/ai/ai-assistant.cjs`  
**Dependencies:** ai-hub.cjs  
**Notes:** CLI interface for developers

### code-analyzer.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Static code analysis for AI context  
**Usage:** Library import  
**Dependencies:** ast-analyzer.cjs, tree-sitter-parser.cjs  
**Notes:** Part of ai-hub.cjs

### ast-analyzer.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Abstract Syntax Tree analysis  
**Usage:** `npm run ai:parse <file>`  
**Dependencies:** tree-sitter  
**Notes:** install-upgrades.sh mentions npm run ai:parse

### tree-sitter-parser.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Tree-sitter-based code parsing  
**Usage:** `node tools/scripts/ai/tree-sitter-parser.cjs list`  
**Dependencies:** tree-sitter packages  
**Notes:** install-upgrades.sh validates with 'list' command

### expert-knowledge.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Expert knowledge base for AI recommendations  
**Usage:** Library import  
**Dependencies:** ai/knowledge/ directory  
**Notes:** Part of ai-hub.cjs

### pattern-matcher.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Code pattern matching and recognition  
**Usage:** Library import  
**Dependencies:** None identified  
**Notes:** Part of ai-hub.cjs

### memory-system.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Persistent memory for AI context across sessions  
**Usage:** Library import  
**Dependencies:** ai/ai-cache/  
**Notes:** Long-term context retention

### vector-store.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Vector database for semantic search  
**Usage:** Library import  
**Dependencies:** embedding-engine.cjs  
**Notes:** Foundation for semantic indexer

### parallel-processor.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Parallel processing for AI tasks  
**Usage:** Library import  
**Environment:** INDEXER_CONCURRENCY (default: 4)  
**Notes:** Performance optimization

---

## Testing & Validation (4 tools)

### test-ai-tools.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Test suite runner for AI tools  
**Usage:** `node tools/scripts/ai/test-ai-tools.cjs`  
**Notes:** Should be in CI pipeline

### test-all-tools.cjs
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Comprehensive AI tools validation  
**Usage:** `node tools/scripts/ai/test-all-tools.cjs`  
**Notes:** Similar to smoke.sh but more thorough

### code-indexer.spec.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Unit tests for code-indexer.js  
**Framework:** Vitest/Jest  
**Notes:** Test coverage for indexing

### context-preloader.spec.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Unit tests for context-preloader.js  
**Framework:** Vitest/Jest  
**Notes:** Test coverage for context loading

### competence-monitor.spec.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Unit tests for competence-monitor.js  
**Framework:** Vitest/Jest  
**Tests:** Quality assessment, empty files, error handling  
**Notes:** Most complete test suite found

---

## Maintenance & Utilities (2 tools)

### update-recent-changes.js
**Status:** 🔄 PENDING_TESTING  
**Purpose:** Update AI index with recent code changes  
**Usage:** `node tools/scripts/ai/update-recent-changes.js`  
**Dependencies:** git, code-indexer.js  
**Notes:** Should run after commits

### smoke.sh
**Status:** ⚠️ NEEDS_FIX  
**Purpose:** Smoke test for all AI tools  
**Usage:** `bash tools/scripts/ai/smoke.sh`  
**Issues:** Had incorrect paths (FIXED in this session)  
**Notes:** Now uses $SCRIPT_DIR for correct paths

---

## Missing/Referenced Tools

### ai-maintenance.yml
**Status:** ❌ NON_FUNCTIONAL  
**Expected:** .github/workflows/ai-maintenance.yml  
**Referenced:** tools/scripts/ai/README.md (lines describing nightly CI runs)  
**Impact:** HIGH - No automated AI tool execution in CI/CD  
**Action Required:** Create workflow (Task #2)

---

## Integration Status

### Current Integrations ✅
- **ci-neutrality-check.mts** → .github/workflows/ai-governance.yml (ACTIVE)
- **competence-monitor.spec.js** → Has test suite (TESTABLE)

### Missing Integrations ⚠️
- **precommit-neutrality.mts** → NOT in .lefthook.yml
- **guard-change-budget.mjs** → NOT in CI workflows
- **test-ai-tools.cjs** → NOT in CI pipeline
- **smoke.sh** → NOT in CI pipeline (should be)
- **Performance monitoring** → NOT connected to observability stack
- **AI metrics** → NOT tracked in dashboards

---

## Recommended Actions

### Priority 1: Critical Path Validation
1. Run smoke.sh with fixed paths to identify broken tools
2. Test core tools: code-indexer, context-preloader, competence-monitor
3. Validate index-server endpoints and health checks
4. Fix any broken dependencies or missing files

### Priority 2: CI/CD Integration
1. Create .github/workflows/ai-maintenance.yml (nightly runs)
2. Add AI validation gates to existing CI workflows
3. Integrate precommit-neutrality.mts into .lefthook.yml
4. Add guard-change-budget.mjs to PR validation

### Priority 3: Testing & Documentation
1. Run all .spec.js test suites (code-indexer, context-preloader, competence-monitor)
2. Create integration tests for AI workflow
3. Document actual tool usage patterns in SOPs
4. Create troubleshooting guides for common failures

### Priority 4: Observability
1. Connect performance-monitor.js to Prometheus/Grafana
2. Add AI metrics dashboard (usage, quality improvements, time saved)
3. Implement alerting for AI tool degradation
4. Track AI assistance effectiveness KPIs

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| FAST_AI | 0 | Enable fast mode (lower rigor) |
| INDEXER_CONCURRENCY | 4 | Parallel indexing workers |
| PRE_CACHE_MAX_ENTRIES | 1000 | Maximum cache entries |

---

## Next Review: 2025-02-XX

**Review Cadence:** Monthly  
**Owner:** Technical Governance Committee  
**Last Audit:** 2025-01-XX (Initial creation)
