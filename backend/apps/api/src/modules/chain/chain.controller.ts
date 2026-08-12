import { BadRequestException, Controller, Get } from "@nestjs/common";

import { ChainService } from "./chain.service";

@Controller("chain")
export class ChainController {
  private readonly chainService = new ChainService();

  @Get("status")
  async getStatus() {
    try {
      return await this.chainService.getStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read Coston2 status.";

      throw new BadRequestException(message);
    }
  }

  @Get("confidential")
  async getConfidentialStatus() {
    try {
      return await this.chainService.getConfidentialStatus();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to verify confidential compute status.";

      throw new BadRequestException(message);
    }
  }
}
