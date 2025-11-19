#!/usr/bin/env node

/**
 * Cache Performance Validation Script
 * Measures and validates cache hit rates and performance improvements
 */

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CACHE_METRICS_FILE = 'cache-performance-results.json';

class CachePerformanceMonitor {
  constructor() {
    this.metrics = {
      timestamp: new Date().toISOString(),
      workflow: process.env.GITHUB_WORKFLOW || 'unknown',
      runId: process.env.GITHUB_RUN_ID || 'unknown',
      sha: process.env.GITHUB_SHA || 'unknown',
      caches: {}
    };
  }

  async measureCacheHitRate(cacheName, cacheKey) {
    // In CI environment, try GitHub CLI
    if (process.env.CI) {
      try {
        const result = execSync(`gh cache list --key "${cacheKey}" --json key,sizeInBytes,createdAt,lastAccessedAt`, {
          encoding: 'utf8'
        });

        const caches = JSON.parse(result);
        const cache = caches.find(c => c.key.includes(cacheKey) || cacheKey.includes(c.key));

        if (cache) {
          return {
            hit: true,
            size: cache.sizeInBytes,
            createdAt: cache.createdAt,
            lastAccessedAt: cache.lastAccessedAt,
            age: Date.now() - new Date(cache.createdAt).getTime()
          };
        }

        return { hit: false };
      } catch (error) {
        console.warn(`Failed to measure cache hit for ${cacheName}:`, error.message);
        return { hit: false, error: error.message };
      }
    } else {
      // Local environment - check for cache directories
      const cacheDirs = {
        'nx-cloud': '.nx/cache',
        'dependencies': 'node_modules',
        'build-artifacts': 'dist',
        'docker-layers': '.docker-cache'
      };

      const cacheDir = cacheDirs[cacheName];
      if (cacheDir && existsSync(cacheDir)) {
        try {
          const stats = execSync(`du -sb ${cacheDir} 2>/dev/null | cut -f1`, { encoding: 'utf8' });
          const size = parseInt(stats.trim()) || 0;
          return {
            hit: true,
            size,
            local: true
          };
        } catch (error) {
          return { hit: true, local: true };
        }
      }

      return { hit: false, local: true };
    }
  }

  async measureNxCachePerformance() {
    const nxCacheDir = '.nx/cache';
    const cacheKey = `nx-cloud-v2-${process.platform}`;

    const hit = await this.measureCacheHitRate('nx-cloud', cacheKey);

    // Measure Nx cache size and entries
    let cacheSize = 0;
    let cacheEntries = 0;

    try {
      if (existsSync(nxCacheDir)) {
        const output = execSync(`find ${nxCacheDir} -type f -exec stat -f "%z" {} + 2>/dev/null | awk '{sum += $1} END {print sum}'`, {
          encoding: 'utf8'
        });
        cacheSize = parseInt(output.trim(), 10) || 0;

        const entries = execSync(`find ${nxCacheDir} -type f | wc -l`, {
          encoding: 'utf8'
        });
        cacheEntries = parseInt(entries.trim()) || 0;
      }
    } catch (error) {
      console.warn('Failed to measure Nx cache size:', error.message);
    }

    this.metrics.caches['nx-cloud'] = {
      ...hit,
      size: cacheSize,
      entries: cacheEntries,
      type: 'nx-cloud'
    };
  }

  async measureDependencyCachePerformance() {
    const cacheKey = `deps-v2-${process.platform}`;

    const hit = await this.measureCacheHitRate('dependencies', cacheKey);

    // Measure node_modules size
    let nodeModulesSize = 0;
    try {
      const output = execSync(`du -sb node_modules 2>/dev/null | cut -f1`, {
        encoding: 'utf8'
      });
      nodeModulesSize = parseInt(output.trim(), 10) || 0;
    } catch (error) {
      console.warn('Failed to measure node_modules size:', error.message);
    }

    this.metrics.caches.dependencies = {
      ...hit,
      nodeModulesSize,
      type: 'npm-dependencies'
    };
  }

  async measureBuildCachePerformance() {
    const cacheKey = `build-v2-${process.platform}`;

    const hit = await this.measureCacheHitRate('build-artifacts', cacheKey);

    // Measure build outputs size
    let buildSize = 0;
    try {
      const output = execSync(`du -sb dist apps/*/dist libs/*/dist 2>/dev/null | awk '{sum += $1} END {print sum}'`, {
        encoding: 'utf8'
      });
      buildSize = parseInt(output.trim(), 10) || 0;
    } catch (error) {
      console.warn('Failed to measure build size:', error.message);
    }

    this.metrics.caches['build-artifacts'] = {
      ...hit,
      buildSize,
      type: 'build-outputs'
    };
  }

  async measureDockerCachePerformance() {
    // Docker cache is managed by GitHub Actions cache
    const cacheKey = `docker-layers`;

    const hit = await this.measureCacheHitRate('docker-layers', cacheKey);

    this.metrics.caches['docker-layers'] = {
      ...hit,
      type: 'docker-layers'
    };
  }

  calculateOverallMetrics() {
    const caches = Object.values(this.metrics.caches);
    const totalCaches = caches.length;
    const hitCaches = caches.filter(c => c.hit).length;
    const hitRate = totalCaches > 0 ? (hitCaches / totalCaches) * 100 : 0;

    // Estimate performance improvement based on cache hits
    // Rough estimate: 80% time reduction for full cache hits
    const performanceImprovement = hitRate * 0.8;

    this.metrics.validation = {
      totalCaches,
      hitCaches,
      hitRate: Math.round(hitRate * 100) / 100,
      performanceImprovement: Math.round(performanceImprovement * 100) / 100,
      targetHitRate: 80,
      targetPerformanceImprovement: 25,
      status: hitRate >= 80 ? 'PASS' : 'WARN'
    };

    return this.metrics.validation;
  }

  async runValidation() {
    console.log('🔍 Measuring cache performance...');

    await Promise.all([
      this.measureNxCachePerformance(),
      this.measureDependencyCachePerformance(),
      this.measureBuildCachePerformance(),
      this.measureDockerCachePerformance()
    ]);

    const validation = this.calculateOverallMetrics();

    console.log(`\n📊 Cache Performance Results:`);
    console.log(`   Cache Hit Rate: ${validation.hitRate}% (Target: ${validation.targetHitRate}%)`);
    console.log(`   Performance Improvement: ${validation.performanceImprovement}% (Target: ${validation.targetPerformanceImprovement}%)`);
    console.log(`   Status: ${validation.status}`);

    // Save results
    writeFileSync(CACHE_METRICS_FILE, JSON.stringify(this.metrics, null, 2));
    console.log(`\n✅ Results saved to ${CACHE_METRICS_FILE}`);

    // Validate against targets
    if (validation.hitRate < validation.targetHitRate) {
      console.warn(`\n⚠️  Cache hit rate below target. Consider cache optimization.`);
      process.exit(1);
    }

    console.log('\n✅ Cache performance validation passed!');
    return this.metrics;
  }
}

// Run validation if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const monitor = new CachePerformanceMonitor();
  monitor.runValidation().catch(error => {
    console.error('Cache performance validation failed:', error);
    process.exit(1);
  });
}

export default CachePerformanceMonitor;