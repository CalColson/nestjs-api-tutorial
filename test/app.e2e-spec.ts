import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as pactum from 'pactum';
import { PrismaService } from '../src/prisma/prisma.service';
import { AppModule } from '../src/app.module';
import { AuthDto } from '../src/auth/dto';
import { EditUserDto } from '../src/user/dto';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto';

describe('App e2e', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
      }),
    );
    await app.init();
    await app.listen(3001);

    prisma = app.get(PrismaService);

    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:3001');
  });

  afterAll(() => {
    app.close();
  });

  describe('Auth', () => {
    const dto: AuthDto = {
      email: 'cal@cal.com',
      password: '14141',
    };
    describe('Signup', () => {
      it('should throw if no email', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw if no password', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('should throw if no body', () => {
        return pactum.spec().post('/auth/signup').expectStatus(400);
      });
      it('should signup', () => {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201);
      });
    });

    describe('Signin', () => {
      it('should throw if no email', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ password: dto.password })
          .expectStatus(400);
      });
      it('should throw if no password', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({ email: dto.email })
          .expectStatus(400);
      });
      it('should throw if no body', () => {
        return pactum.spec().post('/auth/signin').expectStatus(400);
      });
      it('should signin', () => {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAT', 'access_token');
      });
    });
  });

  describe('User', () => {
    describe('Get me', () => {
      it('should get current user', () => {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(200);
      });
    });

    describe('Edit User', () => {
      it('should edit current user', () => {
        const dto: EditUserDto = {
          firstName: 'cal',
          lastName: 'bot',
        };
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains('"email":"cal@cal.com"')
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.lastName);
      });
    });
  });

  describe('Bookmark', () => {
    const dto: CreateBookmarkDto = {
      title: 'Calmark',
      description: 'test bookmark',
      link: 'www.whatev.com',
    };
    const editedDto: EditBookmarkDto = {
      title: 'updateMark',
      description: 'updated bookmark',
      link: 'www.whatevupdate.com',
    };
    describe('get empty bookmarks', () => {
      it('should get empty array from bookmarks endpoint', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });

    describe('create bookmark', () => {
      it('should create bookmark', () => {
        return pactum
          .spec()
          .post('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .withBody(dto)
          .expectStatus(201)
          .expectBodyContains(dto.title)
          .stores('bookmarkId', 'id');
      });
    });
    describe('get bookmarks', () => {
      it('should get bookmarks', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(200)
          .expectJsonLength(1);
      });
    });

    describe('get bookmark by id', () => {
      it('should get specific bookmark', () => {
        return pactum
          .spec()
          .get('/bookmarks/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(200)
          .expectBodyContains(dto.title);
      });
    });

    describe('edit bookmark by id', () => {
      it('should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmarks/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .withBody(editedDto)
          .expectStatus(200)
          .expectBodyContains(editedDto.title);
      });
    });

    describe('delete bookmark by id', () => {
      it('should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmarks/$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(204);
      });

      it('should get empty array from bookmarks endpoint', () => {
        return pactum
          .spec()
          .get('/bookmarks')
          .withHeaders({
            Authorization: 'Bearer $S{userAT}',
          })
          .expectStatus(200)
          .expectBody([]);
      });
    });
  });
});
