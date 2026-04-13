import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { AuthModule } from "../auth/auth.module";
import { User } from "../entities/user.entity";
import { Post } from "../entities/post.entity";
import { Comment } from "../entities/comment.entity";
import { Repository } from "typeorm";
import { getRepositoryToken } from "@nestjs/typeorm";
import { hash } from "bcryptjs";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  let userRepository: Repository<User>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              JWT_SECRET: "test-secret",
              JWT_REFRESH_SECRET: "test-refresh-secret",
              JWT_EXPIRATION: "15m",
              JWT_REFRESH_EXPIRATION: "7d",
            }),
          ],
        }),
        TypeOrmModule.forRoot({
          type: "sqlite",
          database: ":memory:",
          entities: [User, Post, Comment],
          synchronize: true,
        }),
        AuthModule,
      ],
    }).compile();

    app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    const passwordHash = await hash("password123", 10);
    await userRepository.save(
      userRepository.create({
        name: "Test User",
        email: "test@example.com",
        passwordHash,
      }),
    );
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /auth/login", () => {
    it("should return tokens with valid credentials", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "test@example.com", password: "password123" })
        .expect(200);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
      expect(typeof response.body.accessToken).toBe("string");
      expect(typeof response.body.refreshToken).toBe("string");
    });

    it("should return 401 with invalid password", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "test@example.com", password: "wrongpassword" })
        .expect(401);
    });

    it("should return 401 with nonexistent email", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "nonexistent@example.com", password: "password123" })
        .expect(401);
    });

    it("should return 400 with invalid body", async () => {
      await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "not-an-email" })
        .expect(400);
    });
  });

  describe("POST /auth/register", () => {
    it("should create a new user and return tokens", async () => {
      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          name: "New User",
          email: "new@example.com",
          password: "securepassword",
        })
        .expect(201);

      expect(response.body).toHaveProperty("accessToken");
      expect(response.body).toHaveProperty("refreshToken");
    });

    it("should return 400 with duplicate email", async () => {
      await request(app.getHttpServer())
        .post("/auth/register")
        .send({
          name: "Duplicate",
          email: "test@example.com",
          password: "securepassword",
        })
        .expect(400);
    });
  });

  describe("GET /auth/profile", () => {
    it("should return profile with valid token", async () => {
      const loginRes = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: "test@example.com", password: "password123" });

      const response = await request(app.getHttpServer())
        .get("/auth/profile")
        .set("Authorization", `Bearer ${loginRes.body.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body.email).toBe("test@example.com");
      expect(response.body.name).toBe("Test User");
    });

    it("should return 401 without token", async () => {
      await request(app.getHttpServer()).get("/auth/profile").expect(401);
    });
  });
});
