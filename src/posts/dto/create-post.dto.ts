import { IsString, MinLength, MaxLength } from "class-validator";

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title: string;

  @IsString()
  @MinLength(10)
  content: string;
}
