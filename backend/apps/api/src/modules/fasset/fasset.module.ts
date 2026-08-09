import { Module } from "@nestjs/common";
import { FassetController } from "./fasset.controller";

@Module({
  controllers: [FassetController],
})
export class FassetModule {}
