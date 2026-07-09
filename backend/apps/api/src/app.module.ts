import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { ChainModule } from "./modules/chain/chain.module";
import { RiskModule } from "./modules/risk/risk.module";

@Module({
  imports: [RiskModule, ChainModule],
  controllers: [AppController],
})
export class AppModule {}
