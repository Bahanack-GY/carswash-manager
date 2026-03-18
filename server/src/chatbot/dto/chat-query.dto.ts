import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChatQueryDto {
  @ApiProperty({
    example: 'Combien de fiches de piste ouvertes aujourd\'hui ?',
    description: 'Question en langage naturel',
  })
  @IsString({ message: 'La question doit être une chaîne de caractères' })
  @IsNotEmpty({ message: 'La question est requise' })
  @MaxLength(500, { message: 'La question ne doit pas dépasser 500 caractères' })
  question: string;
}
