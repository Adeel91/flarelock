import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";

import {
  type EscrowFundingRegistrationRequest,
  type EscrowPlanRequest,
  type MatchRunRequest,
  MatchService,
  type RecoverMatchRequest,
  type SettlementRequest,
} from "./match.service";

@Controller("matches")
export class MatchController {
  private readonly matchService = new MatchService();

  @Post("run")
  async runMatching(@Body() request: MatchRunRequest) {
    return this.matchService.runMatching(request);
  }

  @Get()
  getMatches() {
    return this.matchService.getMatches();
  }

  @Post("recover")
  async recoverLatestMatch(@Body() request: RecoverMatchRequest) {
    try {
      return await this.matchService.recoverLatestMatch(request);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to recover private execution.";

      throw new BadRequestException(message);
    }
  }

  @Post("activity")
  async getWalletActivity(@Body() request: RecoverMatchRequest) {
    try {
      return await this.matchService.getWalletActivity(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load private activity.";

      throw new BadRequestException(message);
    }
  }

  @Post(":matchId/escrow-plan")
  async getEscrowPlan(@Param("matchId") matchId: string, @Body() request: EscrowPlanRequest) {
    try {
      return await this.matchService.getEscrowPlan(matchId, request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to prepare escrow funding.";

      throw new BadRequestException(message);
    }
  }

  @Post(":matchId/funding")
  async registerFunding(
    @Param("matchId") matchId: string,
    @Body() request: EscrowFundingRegistrationRequest,
  ) {
    try {
      return await this.matchService.registerFunding(matchId, request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to register escrow funding.";

      throw new BadRequestException(message);
    }
  }

  @Post(":matchId/settle")
  async settleMatch(@Param("matchId") matchId: string, @Body() request: SettlementRequest) {
    try {
      return await this.matchService.settleMatch(matchId, request);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to settle private execution.";

      throw new BadRequestException(message);
    }
  }

  @Get(":matchId/execution")
  async getExecution(@Param("matchId") matchId: string) {
    try {
      return await this.matchService.getExecution(matchId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load private execution.";

      throw new NotFoundException(message);
    }
  }

  @Get(":matchId")
  async getMatch(@Param("matchId") matchId: string) {
    const match = await this.matchService.getMatch(matchId);

    if (!match) {
      throw new NotFoundException("Match was not found.");
    }

    return match;
  }
}
