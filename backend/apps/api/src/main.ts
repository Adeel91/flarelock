import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, type NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: true }),
  );

  app.enableCors({
    origin: ["http://localhost:3000"],
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 4000);

  await app.listen(port, "0.0.0.0");

  console.log(`FlareLock API running on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error("FlareLock API failed to start", error);
  process.exit(1);
});
