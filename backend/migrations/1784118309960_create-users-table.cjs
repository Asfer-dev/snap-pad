/* eslint-disable no-undef */

exports.shorthands = undefined;

/**
 * What to run when migrating UP (Creating tables/indices)
 */
exports.up = (pgm) => {
  pgm.createTable('users', {
    id: { type: 'serial', primaryKey: true },
    name: { type: 'varchar(100)', notNull: true },
    email: { type: 'varchar(255)', notNull: true, unique: true },
    password_hash: { type: 'varchar(255)', notNull: true },
    created_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
    updated_at: {
      type: 'timestamp',
      notNull: true,
      default: pgm.func('current_timestamp'),
    },
  });

  // Create a database index on email for lightning-fast logins
  pgm.createIndex('users', 'email');
};

/**
 * What to run when migrating DOWN (Reverting changes)
 */
exports.down = (pgm) => {
  pgm.dropTable('users');
};
