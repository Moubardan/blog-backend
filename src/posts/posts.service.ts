import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Post } from "../entities/post.entity";
import { CreatePostDto, UpdatePostDto, PaginationQueryDto } from "./dto";

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.postRepository.findAndCount({
      relations: { author: true },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        author: { id: true, name: true },
      },
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findOne(id: string) {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: { author: true, comments: { author: true } },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        createdAt: true,
        updatedAt: true,
        author: { id: true, name: true },
        comments: {
          id: true,
          content: true,
          createdAt: true,
          author: { id: true, name: true },
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Article introuvable");
    }

    return post;
  }

  async create(dto: CreatePostDto, userId: string) {
    const slug = this.slugify(dto.title);

    const post = this.postRepository.create({
      ...dto,
      slug,
      authorId: userId,
    });

    return this.postRepository.save(post);
  }

  async update(id: string, dto: UpdatePostDto, userId: string) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException("Article introuvable");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cet article",
      );
    }

    if (dto.title) {
      (dto as Record<string, unknown>).slug = this.slugify(dto.title);
    }

    Object.assign(post, dto);
    return this.postRepository.save(post);
  }

  async remove(id: string, userId: string) {
    const post = await this.postRepository.findOne({ where: { id } });

    if (!post) {
      throw new NotFoundException("Article introuvable");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à supprimer cet article",
      );
    }

    await this.postRepository.remove(post);
    return { message: "Article supprimé" };
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
}
