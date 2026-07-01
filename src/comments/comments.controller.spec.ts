import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser
} from '../common/decorators/current-user.decorator';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@UseGuards(JwtAuthGuard)
@Controller()
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post('tasks/:taskId/comments')
  create(
    @CurrentUser() user: CurrentUserType,
    @Param('taskId') taskId: string,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    return this.commentsService.create(user.id, taskId, createCommentDto);
  }

  @Get('tasks/:taskId/comments')
  findByTask(
    @CurrentUser() user: CurrentUserType,
    @Param('taskId') taskId: string,
  ) {
    return this.commentsService.findByTask(user.id, taskId);
  }

  @Delete('comments/:commentId')
  remove(
    @CurrentUser() user: CurrentUserType,
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.remove(user.id, commentId);
  }
}