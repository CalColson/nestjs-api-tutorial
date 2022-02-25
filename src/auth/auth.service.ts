import { Injectable } from '@nestjs/common';

@Injectable({})
export class AuthService {
  signup() {
    return { msg: 'signed up' };
  }

  signin() {
    return { msg: 'signed in' };
  }
}
