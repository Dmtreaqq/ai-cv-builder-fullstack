import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateUserDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Enter a valid email address.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;

  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(100)
  name?: string;
}
