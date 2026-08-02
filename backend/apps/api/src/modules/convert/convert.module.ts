import { Module } from "@nestjs/common";
import { ConvertController } from "./convert.controller";

@Module({
  controllers: [ConvertController],
})
export class ConvertModule {}
