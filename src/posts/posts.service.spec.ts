import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { PostsService } from "./posts.service";
import { Post } from "../entities/post.entity";
import { Comment } from "../entities/comment.entity";

describe("PostsService", () => {
  let service: PostsService;

  const mockPost: Partial<Post> = {
    id: "uuid-1",
    title: "Test Post",
    slug: "test-post",
    content: "Test content for the post",
    excerpt: "Test excerpt",
    published: true,
    authorId: "user-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    author: { id: "user-1", name: "Alice" } as Post["author"],
    comments: [],
  };

  const mockPostRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockCommentRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
      ],
    }).compile();

    service = module.get<PostsService>(PostsService);
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("findAll", () => {
    it("should return paginated posts", async () => {
      const posts = [mockPost];
      mockPostRepository.findAndCount.mockResolvedValue([posts, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: posts,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { published: true },
          skip: 0,
          take: 10,
          order: { createdAt: "DESC" },
        }),
      );
    });

    it("should handle page 2 correctly", async () => {
      mockPostRepository.findAndCount.mockResolvedValue([[], 15]);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockPostRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe("findMine", () => {
    it("should return posts for the current author", async () => {
      mockPostRepository.find.mockResolvedValue([mockPost]);

      const result = await service.findMine("user-1");

      expect(result).toEqual([mockPost]);
      expect(mockPostRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { authorId: "user-1" } }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a post with relations", async () => {
      mockPostRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.findOne("uuid-1");

      expect(result).toEqual(mockPost);
      expect(mockPostRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "uuid-1" },
        }),
      );
    });

    it("should throw NotFoundException when post does not exist", async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("findBySlug", () => {
    it("should return a published post by slug", async () => {
      mockPostRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.findBySlug("test-post");

      expect(result).toEqual(mockPost);
      expect(mockPostRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { slug: "test-post", published: true } }),
      );
    });
  });

  describe("create", () => {
    it("should create a post with a generated slug", async () => {
      const dto = {
        title: "Mon Nouveau Post",
        content: "Contenu du post avec assez de texte",
        excerpt: "Un extrait",
        published: true,
      };
      const created = { ...mockPost, ...dto, slug: "mon-nouveau-post" };

      mockPostRepository.findOne.mockResolvedValue(null);
      mockPostRepository.create.mockReturnValue(created);
      mockPostRepository.save.mockResolvedValue(created);

      const result = await service.create(dto, "user-1");

      expect(result.slug).toBe("mon-nouveau-post");
      expect(mockPostRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          content: dto.content,
          excerpt: dto.excerpt,
          published: true,
          authorId: "user-1",
        }),
      );
      expect(mockPostRepository.save).toHaveBeenCalledWith(created);
    });

    it("should reject duplicate slugs", async () => {
      mockPostRepository.findOne.mockResolvedValue({ id: "another-post" });

      await expect(
        service.create(
          {
            title: "Mon Nouveau Post",
            content: "Contenu du post avec assez de texte",
            slug: "test-post",
          },
          "user-1",
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("update", () => {
    it("should update a post when user is the owner", async () => {
      mockPostRepository.findOne
        .mockResolvedValueOnce({ ...mockPost })
        .mockResolvedValueOnce(null);
      const updated = { ...mockPost, title: "Updated Title" };
      mockPostRepository.save.mockResolvedValue(updated);

      const result = await service.update(
        "uuid-1",
        { title: "Updated Title" },
        "user-1",
      );

      expect(result.title).toBe("Updated Title");
    });

    it("should throw NotFoundException when post does not exist", async () => {
      mockPostRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", { title: "X" }, "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when user is not the owner", async () => {
      mockPostRepository.findOne.mockResolvedValue({ ...mockPost });

      await expect(
        service.update("uuid-1", { title: "X" }, "other-user"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("addComment", () => {
    it("should create a comment on a published post", async () => {
      const createdComment = {
        id: "comment-1",
        content: "Bonjour",
        postId: "uuid-1",
        authorId: "user-1",
      };

      mockPostRepository.findOne.mockResolvedValue({ id: "uuid-1" });
      mockCommentRepository.create.mockReturnValue(createdComment);
      mockCommentRepository.save.mockResolvedValue(createdComment);

      const result = await service.addComment(
        "uuid-1",
        { content: "Bonjour" },
        "user-1",
      );

      expect(result).toEqual(createdComment);
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        content: "Bonjour",
        postId: "uuid-1",
        authorId: "user-1",
      });
    });
  });

  describe("remove", () => {
    it("should remove a post when user is the owner", async () => {
      mockPostRepository.findOne.mockResolvedValue({ ...mockPost });
      mockPostRepository.remove.mockResolvedValue(undefined);

      const result = await service.remove("uuid-1", "user-1");

      expect(result).toEqual({ message: "Article supprimé" });
      expect(mockPostRepository.remove).toHaveBeenCalled();
    });

    it("should throw ForbiddenException when user is not the owner", async () => {
      mockPostRepository.findOne.mockResolvedValue({ ...mockPost });

      await expect(service.remove("uuid-1", "other-user")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
