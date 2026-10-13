#!/usr/bin/env node
/**
 * Exports the scraper database's structure and a sample of its rows into
 * .data-scan/, so Claude can study the data without ever holding the
 * database password.
 *
 * - The connection URL is typed at a hidden prompt. It is not echoed, not
 *   saved, and not written to shell history.
 * - The session is READ ONLY, so the script cannot change anything even with
 *   a powerful user.
 * - Output is plain JSON in .data-scan/ (git-ignored). It holds product data
 *   only, and you can look through it before sharing.
 *
 * Run from the repo root:  npm run scan:scraper
 *
 * The URL looks like mysql://USER:PASSWORD@HOST:PORT/DATABASE. Special
 * characters in the password (@ ! # …) are fine to paste as they are.
 * Add ?ssl=true at the end if the server requires TLS.
 */

import { mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_ROWS = 200;
const QUERY_TIMEOUT_MS = 60_000;
const MAX_STRING_LENGTH = 2_000;

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '.data-scan');

// ─── Input ──────────────────────────────────────────────────────────────────

function askHidden(question) {
  const { stdin, stdout } = process;
  if (!stdin.isTTY) {
    return new Promise((resolve) => {
      let data = '';
      stdin.setEncoding('utf8');
      stdin.on('data', (chunk) => (data += chunk));
      stdin.on('end', () => resolve(data.split('\n')[0] ?? ''));
    });
  }
  return new Promise((resolve) => {
    let value = '';
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    const onData = (chunk) => {
      for (const char of chunk) {
        if (char === '\r' || char === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (char === '\u0003') {
          stdout.write('\n');
          process.exit(130);
        }
        if (char === '\u007f' || char === '\b') value = value.slice(0, -1);
        else value += char;
      }
    };
    stdin.on('data', onData);
  });
}

/**
 * Parses mysql://user:password@host:port/database?ssl=true by hand, splitting
 * at the LAST "@" so a password containing @ or ! works without encoding.
 */
function parseUrl(raw) {
  let url = raw.trim().replace(/^[A-Z_]*URL=/, '').replace(/^['"]|['"]$/g, '').replace(/^jdbc:/, '');
  const scheme = url.match(/^(mysql|mariadb):\/\//i);
  if (!scheme) {
    throw new Error('That does not look like a MySQL URL. It should start with mysql://');
  }
  url = url.slice(scheme[0].length);

  const at = url.lastIndexOf('@');
  if (at === -1) throw new Error('The URL is missing the user and password (mysql://USER:PASSWORD@HOST/DB).');
  const credentials = url.slice(0, at);
  const location = url.slice(at + 1);

  const colon = credentials.indexOf(':');
  const decode = (s) => {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  };
  const user = decode(colon === -1 ? credentials : credentials.slice(0, colon));
  const password = colon === -1 ? '' : decode(credentials.slice(colon + 1));

  const [hostPort, rest = ''] = location.split(/\/(.*)/s);
  const [database, query = ''] = rest.split('?');
  const [host, port = '3306'] = hostPort.split(':');
  const params = new URLSearchParams(query);

  if (!host) throw new Error('The URL is missing the host.');
  if (!database) throw new Error('The URL is missing the database name (…:3306/DATABASE).');

  const ssl = ['true', '1', 'required', 'require'].includes(
    (params.get('ssl') ?? params.get('sslmode') ?? params.get('ssl-mode') ?? '').toLowerCase(),
  );
  return { host, port: Number(port), user, password, database: decode(database), ssl };
}

// ─── Output ─────────────────────────────────────────────────────────────────

/** Keeps sample files readable: binary becomes a note, long text is cut. */
function tidy(_key, value) {
  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    return `<binary ${value.data.length} bytes>`;
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    return `${value.slice(0, MAX_STRING_LENGTH)}… <${value.length - MAX_STRING_LENGTH} more characters>`;
  }
  return value;
}

const save = (name, data) => writeFile(join(OUT_DIR, name), `${JSON.stringify(data, tidy, 2)}\n`);

// ─── Scan ───────────────────────────────────────────────────────────────────

async function main() {
  let mysql;
  try {
    mysql = (await import('mysql2/promise')).default;
  } catch {
    console.error('mysql2 is not installed. Run `npm install` in the repo root first.');
    process.exit(1);
  }

  const raw = process.env.SCRAPER_DATABASE_URL || (await askHidden('Scraper database URL (input hidden): '));
  if (!raw.trim()) {
    console.error('Nothing was entered. Run it again and paste the URL at the prompt.');
    process.exit(1);
  }

  let config;
  try {
    config = parseUrl(raw);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }

  console.log(`Connecting to: mysql://${config.user}:*****@${config.host}:${config.port}/${config.database}`);

  let db;
  try {
    db = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      ssl: config.ssl ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 15_000,
      dateStrings: true,
      supportBigNumbers: true,
      bigNumberStrings: true,
    });
  } catch (error) {
    console.error(`Could not connect: ${error.code ?? ''} ${error.message}`);
    if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
      console.error(
        `"${config.host}" is not a public address. If it's a Coolify database, use its public URL (server IP + public port) instead of the internal one.`,
      );
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
      console.error('The server did not answer. Check the port is public and not blocked by a firewall.');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('Wrong user or password, or this user may not connect from your IP.');
    }
    process.exit(1);
  }

  config.password = '';

  // Read-only for the whole session, and a per-query time limit.
  await db.query('SET SESSION TRANSACTION READ ONLY');
  await db.query(`SET SESSION max_execution_time = ${QUERY_TIMEOUT_MS}`).catch(() =>
    // MariaDB uses a different variable (in seconds).
    db.query(`SET SESSION max_statement_time = ${QUERY_TIMEOUT_MS / 1000}`).catch(() => {}),
  );

  const [[info]] = await db.query('SELECT DATABASE() AS db, CURRENT_USER() AS user, VERSION() AS version');
  console.log(`Connected to ${info.db} as ${info.user} (server ${info.version})`);

  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(join(OUT_DIR, 'samples'), { recursive: true });

  console.log('1/4 Tables and row counts (estimates — instant even on big tables)');
  const [tables] = await db.query(
    `SELECT TABLE_NAME AS name, TABLE_TYPE AS type, ENGINE AS engine, TABLE_ROWS AS rows_estimate,
            ROUND((DATA_LENGTH + INDEX_LENGTH) / 1024 / 1024, 1) AS size_mb,
            TABLE_COLLATION AS collation, CREATE_TIME AS created_at, UPDATE_TIME AS updated_at,
            TABLE_COMMENT AS comment
       FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME`,
  );
  await save('tables.json', { database: info.db, server: info.version, tables });

  console.log('2/4 Columns');
  const [columns] = await db.query(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, COLUMN_TYPE AS column_type,
            IS_NULLABLE AS nullable, COLUMN_DEFAULT AS default_value, COLUMN_KEY AS column_key,
            EXTRA AS extra, COLUMN_COMMENT AS comment, ORDINAL_POSITION AS position
       FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, ORDINAL_POSITION`,
  );
  await save('columns.json', columns);

  console.log('3/4 Keys, indexes and relations');
  const [indexes] = await db.query(
    `SELECT TABLE_NAME AS table_name, INDEX_NAME AS index_name, NON_UNIQUE AS non_unique,
            SEQ_IN_INDEX AS seq, COLUMN_NAME AS column_name, INDEX_TYPE AS index_type
       FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX`,
  );
  await save('indexes.json', indexes);

  const [foreignKeys] = await db.query(
    `SELECT TABLE_NAME AS table_name, COLUMN_NAME AS column_name, CONSTRAINT_NAME AS constraint_name,
            REFERENCED_TABLE_NAME AS references_table, REFERENCED_COLUMN_NAME AS references_column
       FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, COLUMN_NAME`,
  );
  await save('foreign-keys.json', foreignKeys);

  console.log(`4/4 Sample rows (up to ${SAMPLE_ROWS} random rows per table)`);
  const quote = (name) => `\`${String(name).replaceAll('`', '``')}\``;
  for (const table of tables.filter((t) => t.type === 'BASE TABLE')) {
    const from = `FROM ${quote(table.name)}`;
    let rows;
    let note = '';
    try {
      [rows] = await db.query(`SELECT * ${from} ORDER BY RAND() LIMIT ${SAMPLE_ROWS}`);
    } catch {
      try {
        [rows] = await db.query(`SELECT * ${from} LIMIT ${SAMPLE_ROWS}`);
        note = ' (first rows — table too large to shuffle)';
      } catch (error) {
        rows = [];
        note = ` (skipped: ${error.code ?? error.message})`;
      }
    }
    await save(`samples/${table.name}.json`, rows);
    console.log(`   ${table.name}: ${rows.length} rows${note}`);
  }

  await db.end();
  console.log(`\nDone. Files are in: ${OUT_DIR}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
