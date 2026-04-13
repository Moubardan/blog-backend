import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "./auth/auth.module";
import { PostsModule } from "./posts/posts.module";
import { User } from "./entities/user.entity";
import { Post } from "./entities/post.entity";
import { Comment } from "./entities/comment.entity";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const databaseUrl = config.get<string>("DATABASE_URL");
        const useSsl = config.get<string>("DATABASE_SSL", "false") === "true";
        const databaseSynchronize = config.get<string>(
          "DATABASE_SYNCHRONIZE",
          config.get("NODE_ENV") !== "production" ? "true" : "false",
        );

        return {
          type: "postgres" as const,
          url: databaseUrl,
          host: databaseUrl
            ? undefined
            : config.get<string>("DATABASE_HOST", "localhost"),
          port: databaseUrl
            ? undefined
            : config.get<number>("DATABASE_PORT", 5432),
          username: databaseUrl
            ? undefined
            : config.get<string>("DATABASE_USER", "postgres"),
          password: databaseUrl
            ? undefined
            : config.get<string>("DATABASE_PASSWORD", "postgres"),
          database: databaseUrl
            ? undefined
            : config.get<string>("DATABASE_NAME", "blog_api"),
          ssl: useSsl ? { rejectUnauthorized: false } : false,
          entities: [User, Post, Comment],
          synchronize: databaseSynchronize === "true",
        };
      },
    }),
    AuthModule,
    PostsModule,
  ],
})
export class AppModule {}
