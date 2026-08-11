import { BadRequestException, Controller, Get, Param } from "@nestjs/common";

import { YieldService } from "./yield.service";

@Controller("yield")
export class YieldController {
  private readonly yieldService = new YieldService();

  @Get("firelight")
  async getFirelightStatus() {
    try {
      return await this.yieldService.getFirelightStatus();
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Unable to read Firelight.",
      );
    }
  }

  @Get("firelight/wallet/:owner")
  async getFirelightWallet(@Param("owner") owner: string) {
    try {
      return await this.yieldService.getFirelightWallet(owner);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : "Unable to read Firelight wallet.",
      );
    }
  }
}
