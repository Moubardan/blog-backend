import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { User } from "../entities/user.entity";
import { TestSupportController } from "./test-support.controller";
import { TestSupportService } from "./test-support.service";

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [TestSupportController],
  providers: [TestSupportService],
})
export class TestSupportModule {}