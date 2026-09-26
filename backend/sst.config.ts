/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "backend",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
    };
  },
  async run() {
    // 1. Configuramos el acceso al Secreto de la Base de Datos Externa (Supabase)
    const dbUrl = new sst.Secret("DATABASE_URL");
    const jwtSecret = new sst.Secret("JWT_SECRET");

    // 2. Crear la API y darle permisos para leer el secreto
    const api = new sst.aws.ApiGatewayV2("MiApiGateway", {
      link: [dbUrl, jwtSecret],
    });

    // 3. Lambdalith catch-all route apuntando al unico handler de Hono
    api.route("$default", "src/index.handler");

    return {
      apiUrl: api.url,
    };
  },
});
