import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from "@nestjs/common";
import { IntentService, type SealIntentRequest } from "./intent.service";

@Controller("intents")
export class IntentController {
  private readonly intentService = new IntentService();

  @Post("seal")
  async sealIntent(@Body() request: SealIntentRequest) {
    try {
      return await this.intentService.sealIntent(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to seal private intent.";

      console.error("[FlareLock intent seal failed]", message);

      throw new BadRequestException(message);
    }
  }

  @Get()
  async getIntents() {
    return this.intentService.getIntents();
  }

  @Get(":intentId")
  async getIntent(@Param("intentId") intentId: string) {
    const intent = await this.intentService.getIntent(intentId);

    if (!intent) {
      throw new NotFoundException("Private intent was not found.");
    }

    return intent;
  }
}
