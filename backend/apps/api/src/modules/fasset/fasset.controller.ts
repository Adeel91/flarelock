import { BadRequestException, Controller, Get, Param, Query } from "@nestjs/common";
import { FassetService } from "./fasset.service";

@Controller("fassets")
export class FassetController {
  private readonly fassetService = new FassetService();

  @Get("fxrp")
  async getFxrpToken() {
    try {
      return await this.fassetService.getFxrpToken();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to resolve FXRP.";

      throw new BadRequestException(message);
    }
  }

  @Get("fxrp/wallet/:owner")
  async getWalletFxrp(@Param("owner") owner: string, @Query("spender") spender?: string) {
    try {
      return await this.fassetService.getWalletFxrp(owner, spender);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to read the FXRP wallet balance.";

      throw new BadRequestException(message);
    }
  }
}
