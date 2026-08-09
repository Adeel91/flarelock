import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { OrderBookService } from "./order-book.service";

@Controller("order-book")
export class OrderBookController {
  private readonly orderBookService = new OrderBookService();

  @Get(":market")
  getOrderBook(@Param("market") market: string) {
    if (market.toUpperCase() !== "FXRP-C2FLR") {
      throw new NotFoundException("Private market was not found.");
    }

    return this.orderBookService.getOrderBook();
  }
}
