const pg = require('pg');
// Session mode pooler on port 5432
const url = 'postgresql://postgres.lfzzhgrtpkzxzcbvsvxu:1BjeLJydUHogdpnO@aws-0-us-east-1.pooler.supabase.com:5432/postgres';
console.log('Testing session mode pooler (port 5432)...');
const c = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 10000 });
c.connect().then(() => c.query('SELECT NOW() as now')).then(r => { console.log('OK', r.rows[0]); c.end(); }).catch(e => console.log('ERR', e.message));
