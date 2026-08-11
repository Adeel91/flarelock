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

  @Get("fxrp/redemption/:owner")
  async getFxrpRedemptionStatus(@Param("owner") owner: string) {
    try {
      return await this.fassetService.getFxrpRedemptionStatus(owner);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to read FXRP redemption status.";

      throw new BadRequestException(message);
    }
  }

  @Get("fxrp/redemption/tx/:hash")
  async getFxrpRedemptionTransaction(@Param("hash") hash: string) {
    try {
      return await this.fassetService.getFxrpRedemptionTransaction(hash);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to read the redemption transaction.";

      throw new BadRequestException(message);
    }
  }
}
