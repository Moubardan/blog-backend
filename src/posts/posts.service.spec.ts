import { Test, TestingModule } from "@nestjs/testing";
import { getRepositoryToken } from "@nestjs/typeorm";
import { NotFoundException, ForbiddenException } from "@nestjs/common";
import { PostsService } from "./posts.service";
import { Post } from "../entities/post.entity";

describe("PostsService", () => {
  let service: PostsService;

  const mockPost: Partial<Post> = {
    id: "uuid-1",
    title: "Test Post",
    slug: "test-post",
    content: "Test content for the post",
    authorId: "user-1",
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    author: { id: "user-1", name: "Alice" } as Post["author"],
    comments: [],
  };

  const mockRepository = {
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockRepository,
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
      mockRepository.findAndCount.mockResolvedValue([posts, 1]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result).toEqual({
        data: posts,
        total: 1,
        page: 1,
        limit: 10,
      });
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          order: { createdAt: "DESC" },
        }),
      );
    });

    it("should handle page 2 correctly", async () => {
      mockRepository.findAndCount.mockResolvedValue([[], 15]);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(result.page).toBe(2);
      expect(result.limit).toBe(5);
      expect(mockRepository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });
  });

  describe("findOne", () => {
    it("should return a post with relations", async () => {
      mockRepository.findOne.mockResolvedValue(mockPost);

      const result = await service.findOne("uuid-1");

      expect(result).toEqual(mockPost);
      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "uuid-1" },
        }),
      );
    });

    it("should throw NotFoundException when post does not exist", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne("nonexistent")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("create", () => {
    it("should create a post with a generated slug", async () => {
      const dto = { title: "Mon Nouveau Post", content: "Contenu du post avec assez de texte" };
      const created = { ...mockPost, ...dto, slug: "mon-nouveau-post" };

      mockRepository.create.mockReturnValue(created);
      mockRepository.save.mockResolvedValue(created);

      const result = await service.create(dto, "user-1");

      expect(result.slug).toBe("mon-nouveau-post");
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: dto.title,
          content: dto.content,
          authorId: "user-1",
        }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(created);
    });
  });

  describe("update", () => {
    it("should update a post when user is the owner", async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockPost });
      const updated = { ...mockPost, title: "Updated Title" };
      mockRepository.save.mockResolvedValue(updated);

      const result = await service.update(
        "uuid-1",
        { title: "Updated Title" },
        "user-1",
      );

      expect(result.title).toBe("Updated Title");
    });

    it("should throw NotFoundException when post does not exist", async () => {
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update("nonexistent", { title: "X" }, "user-1"),
      ).rejects.toThrow(NotFoundException);
    });

    it("should throw ForbiddenException when user is not the owner", async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockPost });

      await expect(
        service.update("uuid-1", { title: "X" }, "other-user"),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("remove", () => {
    it("should remove a post when user is the owner", async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockPost });
      mockRepository.remove.mockResolvedValue(undefined);

      const result = await service.remove("uuid-1", "user-1");

      expect(result).toEqual({ message: "Article supprimé" });
      expect(mockRepository.remove).toHaveBeenCalled();
    });

    it("should throw ForbiddenException when user is not the owner", async () => {
      mockRepository.findOne.mockResolvedValue({ ...mockPost });

      await expect(service.remove("uuid-1", "other-user")).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
