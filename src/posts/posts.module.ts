import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Post } from "../entities/post.entity";
import { Comment } from "../entities/comment.entity";
import { PostsService } from "./posts.service";
import { PostsController } from "./posts.controller";
import { IsOwnerGuard } from "../auth/is-owner.guard";

@Module({
  imports: [TypeOrmModule.forFeature([Post, Comment])],
  controllers: [PostsController],
  providers: [PostsService, IsOwnerGuard],
})
export class PostsModule {}
