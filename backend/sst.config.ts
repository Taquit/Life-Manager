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
    /**
     
    
    //1.Se crea la funcion lambda y le decimos a aws que le asigne una url publica
    const api = new sst.aws.Function("MiPrimeraApi", {
      url: true, //Crea endpoint hhtp
      handler: "src/transactions/get.handler", //APunta al archivo que creamos
    });

    //2. IMprimimos la URL den la terminal
    return {
      MiURL: api.url,
    };

  },
  */

    // 1. Configuramos el acceso al Secreto de la Base de Datos Externa (Supabase)
    const dbUrl = new sst.Secret("DATABASE_URL");
    const jwtSecret = new sst.Secret("JWT_SECRET");

    // 2. Crear la API y darle permisos para leer el secreto
    const api = new sst.aws.ApiGatewayV2("MiApiGateway", {
      link: [dbUrl, jwtSecret]
    });


    //Transactions routes
    api.route("GET /transactions", "src/transactions/get.handler");
    api.route("POST /transactions", "src/transactions/create.handler");
    api.route("PUT /transactions", "src/transactions/update.handler");
    api.route("DELETE /transactions", "src/transactions/delet.handler");

    //User routes
    api.route("POST /user/login", "src/user/login.handler");
    api.route("POST /user", "src/user/create.handler");
    api.route("PUT /user", "src/user/update.handler");
    api.route("DELETE /user", "src/user/delet.handler");
    api.route("GET /user", "src/user/get.handler");

    //Category routes
    api.route("POST /category", "src/category/create.handler");
    api.route("PUT /category", "src/category/update.handler");
    api.route("DELETE /category", "src/category/delet.handler");
    api.route("GET /category", "src/category/get.handler");

    //Card routes
    api.route("POST /card", "src/card/create.handler");
    api.route("PUT /card", "src/card/update.handler");
    api.route("DELETE /card", "src/card/delet.handler");
    api.route("GET /card", "src/card/get.handler");
    api.route("GET /card/by_l4", "src/card/get_by_l4.handler");

    return {
      apiUrl: api.url
    }

  }
});
