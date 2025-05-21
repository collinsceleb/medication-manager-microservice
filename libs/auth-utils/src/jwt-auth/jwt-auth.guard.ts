import { ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // const request = context.switchToHttp().getRequest();
    // const authHeader = request.headers.authorization;
    // if (!authHeader || !authHeader.startsWith('Bearer ')) {
    //   return false;
    // }
    return super.canActivate(context);
  }
}
