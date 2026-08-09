import { Module } from "@nestjs/common";
import { OrderBookController } from "./order-book.controller";

@Module({
  controllers: [OrderBookController],
})
export class OrderBookModule {}
