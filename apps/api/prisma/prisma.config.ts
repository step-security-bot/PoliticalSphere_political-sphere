/**
 * Prisma configuration object used to initialise database connections.
 *
 * TODO: Document environment variable overrides and supported adapters.
 */
export default {
  datasource: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};
