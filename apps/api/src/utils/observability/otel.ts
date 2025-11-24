import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { NodeSDK } from '@opentelemetry/sdk-node';

/**
 * OpenTelemetry Node SDK instance configured for the API.
 *
 * Exposes a preconfigured `sdk` that the application can start/stop in
 * integration tests or when running in production. The SDK uses the OTLP
 * HTTP exporter when `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` is set.
 */
export const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter(
    process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
      ? { url: process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT }
      : {}
  ),
  instrumentations: [getNodeAutoInstrumentations()],
});
