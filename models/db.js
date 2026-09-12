const pool = require('../config/database');

const db = {
  // Execute a query
  query: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows;
  },

  // Get single row
  queryOne: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return rows[0] || null;
  },

  // Insert and return insertId
  insert: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return result.insertId;
  },

  // Update/delete and return affectedRows
  execute: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params);
    return result.affectedRows;
  }
};

module.exports = db;
