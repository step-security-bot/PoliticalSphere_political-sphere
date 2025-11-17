import { DB_PATH } from './apps/api/src/modules/stores/migrations.ts';

console.log('DB_PATH:', DB_PATH);
console.log('Resolved:', DB_PATH === ':memory:' ? 'IN-MEMORY' : DB_PATH);
console.log('NODE_ENV:', process.env.NODE_ENV);
