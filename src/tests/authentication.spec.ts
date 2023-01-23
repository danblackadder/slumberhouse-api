import 'dotenv/config';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import server from '../server';
import { createUser, database } from './config';
import { Organization, OrganizationUsers, User } from '../models';

describe('/authentication', () => {
  database('slumberhouse-test', server);

  describe('POST /register', () => {
    it('successfully registers new user', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });

      const user = await User.findOne({ email: 'test@test.com' });
      const organization = await Organization.findOne({ name: 'Slumberhouse ' });
      const organizationUser = await OrganizationUsers.find({
        userId: user?._id,
        organizationId: organization?._id,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(user?.firstName).toBe('FirstTest');
      expect(user?.lastName).toBe('LastTest');
      expect(user?.email).toBe('test@test.com');
      expect(organization).toBeDefined();
      expect(organizationUser).toBeDefined();
    });

    it('fails if first name is not passed', async () => {
      const response = await request(server).post('/authentication/register').send({
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors.firstName).toContain('First name must be supplied');
    });

    it('fails if first name is shorter than 2 characters', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 's',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.firstName).toContain('First name must be longer than 2 characters');
    });

    it('fails if last name is not passed', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.lastName).toContain('Last name must be supplied');
    });

    it('fails if last name is shorter than 2 characters', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 's',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.lastName).toContain('Last name must be longer than 2 characters');
    });

    it('fails if email is not passed', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email must be supplied');
    });

    it('fails if email is not a valid email', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 's@s',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email must be a valid email address');
    });

    it('fails if organization is not passed', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.organization).toContain('Organization must be supplied');
    });

    it('fails if last name is shorter than 2 characters', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 's',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.organization).toContain('Organization must be longer than 2 characters');
    });

    it('fails if password is not passed', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must be supplied');
    });

    it('fails if password confirmation is not passed', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.passwordConfirmation).toContain('Password confirmation must be supplied');
    });

    it('fails if password does not contain at least 8 characters', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'P@s5',
        passwordConfirmation: 'P@s5',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must be longer than 8 characters');
    });

    it('fails if password does not contain upper and lower case characters', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'p@55word',
        passwordConfirmation: 'p@55word',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain(
        'Password must contain upper and lower case characters'
      );
    });

    it('fails if password does not contain at least 1 number', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'P@ssWord',
        passwordConfirmation: 'P@ssWord',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must contain at least 1 number');
    });

    it('fails if password does not contain at least 1 special character', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'PassW0rd',
        passwordConfirmation: 'PassW0rd',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must contain at least 1 special character');
    });

    it('fails if password confirmation does not match password', async () => {
      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8b',
        organization: 'Slumberhouse',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.passwordConfirmation).toContain(
        'Password confirmation must match password'
      );
    });

    it('fails if email is not unique', async () => {
      await User.create({
        email: 'test@test.com',
      });

      const response = await request(server).post('/authentication/register').send({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
        passwordConfirmation: 'fr5T$kE@LNy8p8a',
        organization: 'Slumberhouse',
      });

      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email address is already in use');
    });
  });

  describe('POST /login', () => {
    it('successfully logs in', async () => {
      const hashedPassword = await bcrypt.hash('fr5T$kE@LNy8p8a', 10);
      const user = await User.create({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: hashedPassword,
      });
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string);

      const response = await request(server).post('/authentication/login').send({
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.token).toBe(token);
    });

    it('fails if password does not match', async () => {
      const hashedPassword = await bcrypt.hash('fr5T$kE@LNy8p8a', 10);
      await User.create({
        firstName: 'FirstTest',
        lastName: 'LastTest',
        email: 'test@test.com',
        password: hashedPassword,
        organization: 'Slumberhouse',
      });

      const response = await request(server).post('/authentication/login').send({
        email: 'test@test.com',
        password: 'wrongPassword',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username or password does not match');
    });

    it('fails if user does not exist', async () => {
      const response = await request(server).post('/authentication/login').send({
        email: 'test@test.com',
        password: 'fr5T$kE@LNy8p8a',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username or password does not match');
    });
  });

  describe('GET /me', () => {
    it('returns users details when successfully aquired token', async () => {
      const { token } = await createUser();
      const response = await request(server)
        .get('/authentication/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.firstName).toBe('FirstTest');
      expect(response.body.lastName).toBe('LastTest');
      expect(response.body.email).toBe('test@test.com');
      expect(response.body.organization).toBe('Slumberhouse');
    });

    it('fails when no token has been provided', async () => {
      const response = await request(server).get('/authentication/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
    });

    it('fails when token is not valid', async () => {
      const response = await request(server)
        .get('/authentication/me')
        .set('Authorization', `Bearer fakeToken`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('fails when no user is associated with token', async () => {
      const token = jwt.sign({ id: '9543254' }, process.env.JWT_SECRET as string);
      const response = await request(server)
        .get('/authentication/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });
});
