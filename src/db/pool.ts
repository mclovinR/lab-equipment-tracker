import { Pool } from "pg";
import { env } from "../config/env";

// A pool reuses a few open connections instead of opening one per request.
export const pool = new Pool({ connectionString: env.databaseUrl });
