import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { RiskModule } from "./modules/risk/risk.module";

@Module({
  imports: [RiskModule],
  controllers: [AppController],
})
export class AppModule {}
