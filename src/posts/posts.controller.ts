import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { CreatePostDto, UpdatePostDto, PaginationQueryDto } from "./dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { IsOwnerGuard } from "../auth/is-owner.guard";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get(":id")
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.postsService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() dto: CreatePostDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.postsService.create(dto, req.user.id);
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdatePostDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.postsService.update(id, dto, req.user.id);
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, IsOwnerGuard)
  remove(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.postsService.remove(id, req.user.id);
  }
}
