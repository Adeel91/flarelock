import { Module } from "@nestjs/common";
import { ChainController } from "./chain.controller";

@Module({
  controllers: [ChainController],
})
export class ChainModule {}
