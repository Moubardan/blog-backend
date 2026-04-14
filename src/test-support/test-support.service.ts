import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { User } from "../entities/user.entity";

@Injectable()
export class TestSupportService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async cleanupUsers(emails: string[]) {
    const uniqueEmails = [...new Set(emails.filter(Boolean))];

    if (uniqueEmails.length === 0) {
      return { deletedUsers: 0 };
    }

    const users = await this.userRepository.find({
      where: { email: In(uniqueEmails) },
    });

    if (users.length === 0) {
      return { deletedUsers: 0 };
    }

    await this.userRepository.remove(users);

    return { deletedUsers: users.length };
  }
}