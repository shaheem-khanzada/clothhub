import type { Pool } from 'mysql2/promise';

export class LockBusyError extends Error {
  constructor(name: string) {
    super(`Another ${name} run is in progress.`);
    this.name = 'LockBusyError';
  }
}

/**
 * Runs `work` while holding a MySQL advisory lock, so a scheduled job never
 * overlaps itself. The lock is named after the database as well, so dev and
 * production on the same server never block each other.
 *
 * Fails at once with `LockBusyError` when another run holds the lock.
 */
export async function withAdvisoryLock<T>(pool: Pool, name: string, work: () => Promise<T>): Promise<T> {
  const connection = await pool.getConnection();
  const lockName = `concat(${connection.escape(`clothhub_${name}:`)}, database())`;

  try {
    const [[acquired]] = (await connection.query(`SELECT GET_LOCK(${lockName}, 0) AS ok`)) as unknown as [
      { ok: number }[],
    ];
    if (!acquired || acquired.ok !== 1) {
      throw new LockBusyError(name);
    }

    try {
      return await work();
    } finally {
      await connection.query(`SELECT RELEASE_LOCK(${lockName})`);
    }
  } finally {
    connection.release();
  }
}
