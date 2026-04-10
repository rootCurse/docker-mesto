const configuration = () => ({
  db: {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.POSTGRES_USER ?? 'student',
    password: process.env.POSTGRES_PASSWORD ?? 'student',
    database: process.env.POSTGRES_DB ?? 'kupipodariday',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'secret',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '24h',
  },
});

export default configuration;
