import pg from "pg";
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes("railway") ? { rejectUnauthorized: false } : false,
});

export const query = (text, params) => pool.query(text, params);

export const dbStatus = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    return { status: "connected", time: res.rows[0].now };
  } catch (err) {
    return { status: "error", message: err.message };
  }
};
