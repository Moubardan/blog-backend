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
import {
  AddCommentDto,
  CreatePostDto,
  UpdatePostDto,
  PaginationQueryDto,
} from "./dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { IsOwnerGuard } from "../auth/is-owner.guard";

@Controller("posts")
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(@Query() query: PaginationQueryDto) {
    return this.postsService.findAll(query);
  }

  @Get("mine")
  @UseGuards(JwtAuthGuard)
  findMine(@Request() req: { user: { id: string } }) {
    return this.postsService.findMine(req.user.id);
  }

  @Get("mine/:id")
  @UseGuards(JwtAuthGuard)
  findMineOne(
    @Param("id", ParseUUIDPipe) id: string,
    @Request() req: { user: { id: string } },
  ) {
    return this.postsService.findMineOne(id, req.user.id);
  }

  @Get("by-slug/:slug")
  findBySlug(@Param("slug") slug: string) {
    return this.postsService.findBySlug(slug);
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

  @Post(":id/comments")
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AddCommentDto,
    @Request() req: { user: { id: string } },
  ) {
    return this.postsService.addComment(id, dto, req.user.id);
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
