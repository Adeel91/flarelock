import { Controller, Get, Query } from "@nestjs/common";
import { ConvertService } from "./convert.service";

@Controller("convert")
export class ConvertController {
  private readonly convertService = new ConvertService();

  @Get("quote")
  getQuote(
    @Query("fromAsset") fromAsset?: string,
    @Query("toAsset") toAsset?: string,
    @Query("side") side?: string,
    @Query("amount") amount?: string,
  ) {
    return this.convertService.getQuote({
      amount,
      fromAsset,
      side,
      toAsset,
    });
  }
}
