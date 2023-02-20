import request from 'supertest';
import jwt from 'jsonwebtoken';

import 'dotenv/config';

import server from '../server';
import { createOrganization, createUser } from '../utility/mock';

import { database } from './config';

describe('/profile', () => {
  database('slumberhouse-test', server);

  describe('GET /me', () => {
    it('returns users details when successfully aquired token', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, email } = await createUser({ organizationId });

      const response = await request(server).get('/profile').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.email).toBe(email);
    });

    it('fails when no token has been provided', async () => {
      const response = await request(server).get('/profile');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
    });

    it('fails when token is not valid', async () => {
      const response = await request(server).get('/profile').set('Authorization', `Bearer fakeToken`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('fails when no user is associated with token', async () => {
      const token = jwt.sign({ id: '9543254' }, process.env.JWT_SECRET as string);
      const response = await request(server).get('/profile').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });
});
