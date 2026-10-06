import "dotenv/config";

// Central place to read environment variables, so the rest of the code never touches process.env directly.
export const env = {
  port: Number(process.env.PORT ?? 3000),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://lab:lab@localhost:5432/labtracker"
};
