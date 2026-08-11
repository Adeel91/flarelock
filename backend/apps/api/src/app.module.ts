import { Module } from "@nestjs/common";
import { AppController } from "./app.controller";
import { ChainModule } from "./modules/chain/chain.module";
import { ConvertModule } from "./modules/convert/convert.module";
import { FassetModule } from "./modules/fasset/fasset.module";
import { IntentModule } from "./modules/intent/intent.module";
import { MatchModule } from "./modules/match/match.module";
import { OrderBookModule } from "./modules/order-book/order-book.module";
import { RiskModule } from "./modules/risk/risk.module";
import { StopModule } from "./modules/stop/stop.module";
import { YieldModule } from "./modules/yield/yield.module";

@Module({
  imports: [
    FassetModule,
    StopModule,
    OrderBookModule,
    MatchModule,
    RiskModule,
    ChainModule,
    ConvertModule,
    IntentModule,
    YieldModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
