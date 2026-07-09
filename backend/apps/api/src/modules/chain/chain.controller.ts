import { Controller, Get } from "@nestjs/common";
import { ChainService } from "./chain.service";

@Controller("chain")
export class ChainController {
  private readonly chainService = new ChainService();

  @Get("status")
  getStatus() {
    return this.chainService.getStatus();
  }
}
