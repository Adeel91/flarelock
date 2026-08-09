import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { ChainModule } from "./modules/chain/chain.module";
import { ConvertModule } from "./modules/convert/convert.module";
import { IntentModule } from "./modules/intent/intent.module";
import { MatchModule } from "./modules/match/match.module";
import { RiskModule } from "./modules/risk/risk.module";

@Module({
  imports: [MatchModule, RiskModule, ChainModule, ConvertModule, IntentModule],
  controllers: [AppController],
})
export class AppModule {}
