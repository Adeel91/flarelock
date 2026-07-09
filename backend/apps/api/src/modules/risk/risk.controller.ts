import { Controller, Get, Query } from "@nestjs/common";
import { RiskService } from "./risk.service";

@Controller("risk")
export class RiskController {
  private readonly riskService = new RiskService();

  @Get("preview")
  getPreview(@Query("asset") asset?: string) {
    return this.riskService.getPreview(asset);
  }
}
