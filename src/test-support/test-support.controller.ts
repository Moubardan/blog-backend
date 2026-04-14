import {
  Body,
  Controller,
  Headers,
  NotFoundException,
  Post,
  UnauthorizedException,
} from "@nestjs/common";
import { TestSupportService } from "./test-support.service";

type CleanupUsersBody = {
  emails?: string[];
};

@Controller("test-support")
export class TestSupportController {
  constructor(private readonly testSupportService: TestSupportService) {}

  @Post("cleanup-users")
  async cleanupUsers(
    @Headers("x-e2e-cleanup-secret") secret: string | undefined,
    @Body() body: CleanupUsersBody,
  ) {
    if (process.env.NODE_ENV === "production") {
      throw new NotFoundException();
    }

    const expectedSecret =
      process.env.E2E_CLEANUP_SECRET || "local-e2e-cleanup-secret";

    if (!secret || secret !== expectedSecret) {
      throw new UnauthorizedException("Invalid cleanup secret");
    }

    return this.testSupportService.cleanupUsers(body.emails ?? []);
  }
}