import { Controller, Get, NotFoundException, Param, Post } from "@nestjs/common";
import { MatchService } from "./match.service";

@Controller("matches")
export class MatchController {
  private readonly matchService = new MatchService();

  @Post("run")
  runMatching() {
    return this.matchService.runMatching();
  }

  @Get()
  getMatches() {
    return this.matchService.getMatches();
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
