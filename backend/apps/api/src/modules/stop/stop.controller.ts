import { BadRequestException, Controller, Get, Post } from "@nestjs/common";
import { StopService } from "./stop.service";

@Controller("stops")
export class StopController {
  private readonly stopService = new StopService();

  @Get("status")
  async getStatus() {
    try {
      return await this.stopService.getStatus();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to read stop engine status.";

      throw new BadRequestException(message);
    }
  }

  @Post("run")
  async runStops() {
    try {
      return await this.stopService.runStops();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to evaluate stop intents.";

      throw new BadRequestException(message);
    }
  }

  @Get()
  getTriggers() {
    return this.stopService.getTriggers();
  }
}
