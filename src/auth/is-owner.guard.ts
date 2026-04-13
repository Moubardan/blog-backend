import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Post } from "../entities/post.entity";

@Injectable()
export class IsOwnerGuard implements CanActivate {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id;
    const postId = request.params.id;

    if (!userId || !postId) {
      throw new ForbiddenException("Accès refusé");
    }

    const post = await this.postRepository.findOne({ where: { id: postId } });

    if (!post) {
      throw new NotFoundException("Article introuvable");
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        "Vous n'êtes pas autorisé à modifier cet article",
      );
    }

    return true;
  }
}
