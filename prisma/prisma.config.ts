export default {
  schema: './schema.prisma',
  database: {
    provider: 'sqlite',
    url: process.env.DATABASE_URL,
  },
};
