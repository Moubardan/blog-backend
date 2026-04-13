import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Post } from "../entities/post.entity";
import { Comment } from "../entities/comment.entity";
import {
  AddCommentDto,
  CreatePostDto,
  UpdatePostDto,
  PaginationQueryDto,
} from "./dto";

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async findAll(query: PaginationQueryDto) {
    const { page, limit } = query;
    const skip = (page - 1) * limit;

    const [data, total] = await this.postRepository.findAndCount({
      where: { published: true },
      relations: { author: true },
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        createdAt: true,
        author: { id: true, name: true },
      },
      order: { createdAt: "DESC" },
      skip,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findMine(userId: string) {
    return this.postRepository.find({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        slug: true,
        published: true,
        createdAt: true,
      },
      order: { createdAt: "DESC" },
    });
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
        excerpt: true,
        published: true,
        authorId: true,
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

  async findMineOne(id: string, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id, authorId: userId },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        published: true,
        authorId: true,
      },
    });

    if (!post) {
      throw new NotFoundException("Article introuvable");
    }

    return post;
  }

  async findBySlug(slug: string) {
    const post = await this.postRepository.findOne({
      where: { slug, published: true },
      relations: { author: true, comments: { author: true } },
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        excerpt: true,
        published: true,
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
      order: {
        comments: {
          createdAt: "DESC",
        },
      },
    });

    if (!post) {
      throw new NotFoundException("Article introuvable");
    }

    return post;
  }

  async create(dto: CreatePostDto, userId: string) {
    const slug = this.slugify(dto.slug || dto.title);
    await this.ensureSlugAvailable(slug);

    const post = this.postRepository.create({
      ...dto,
      slug,
      excerpt: dto.excerpt ?? null,
      published: dto.published ?? false,
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

    if (dto.slug || dto.title) {
      const nextSlug = this.slugify(dto.slug || dto.title || post.slug);
      await this.ensureSlugAvailable(nextSlug, post.id);
      post.slug = nextSlug;
    }

    Object.assign(post, {
      ...dto,
      excerpt: dto.excerpt ?? post.excerpt,
      published: dto.published === undefined ? post.published : dto.published,
    });
    return this.postRepository.save(post);
  }

  async addComment(postId: string, dto: AddCommentDto, userId: string) {
    const post = await this.postRepository.findOne({
      where: { id: postId, published: true },
      select: { id: true },
    });

    if (!post) {
      throw new NotFoundException("Article introuvable");
    }

    const comment = this.commentRepository.create({
      content: dto.content,
      postId,
      authorId: userId,
    });

    return this.commentRepository.save(comment);
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

  private async ensureSlugAvailable(slug: string, currentPostId?: string) {
    const existing = await this.postRepository.findOne({
      where: { slug },
      select: { id: true },
    });

    if (existing && existing.id !== currentPostId) {
      throw new BadRequestException("Ce slug est déjà utilisé");
    }
  }
}
