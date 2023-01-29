import request from 'supertest';
import { faker } from '@faker-js/faker';
import jwt from 'jsonwebtoken';

import 'dotenv/config';

import { Organization, OrganizationUsers, User } from '../models';
import server from '../server';
import { createOrganization, createUser } from '../utility/mock';

import { database } from './config';

describe('/authentication', () => {
  database('slumberhouse-test', server);

  describe('POST /register', () => {
    it('successfully registers new user', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });

      const user = await User.findOne({ email: email.toLowerCase() });
      const organization = await Organization.findOne({ name: organizationName });
      const organizationUser = await OrganizationUsers.find({
        userId: user?._id,
        organizationId: organization?._id,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(user?.firstName).toBe(firstName);
      expect(user?.lastName).toBe(lastName);
      expect(user?.email).toBe(email.toLowerCase());
      expect(organization?.name).toBe(organizationName);
      expect(organizationUser).toBeDefined();
    });

    it('fails if first name is not passed', async () => {
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        lastName,
        email,
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });

      expect(response.status).toBe(400);
      expect(response.body.errors.firstName).toContain('First name must be supplied');
    });

    it('fails if first name is shorter than 2 characters', async () => {
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName: 's',
        lastName,
        email,
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.firstName).toContain('First name must be longer than 2 characters');
    });

    it('fails if last name is not passed', async () => {
      const firstName = faker.name.firstName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        email,
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.lastName).toContain('Last name must be supplied');
    });

    it('fails if last name is shorter than 2 characters', async () => {
      const firstName = faker.name.firstName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName: 's',
        email,
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.lastName).toContain('Last name must be longer than 2 characters');
    });

    it('fails if email is not passed', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email must be supplied');
    });

    it('fails if email is not a valid email', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email: 's@s',
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email must be a valid email address');
    });

    it('fails if organization is not passed', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation: password,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.organization).toContain('Organization must be supplied');
    });

    it('fails if organization is shorter than 2 characters', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation: password,
        organization: 's',
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.organization).toContain('Organization must be longer than 2 characters');
    });

    it('fails if password is not passed', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        passwordConfirmation: password,
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must be supplied');
    });

    it('fails if password confirmation is not passed', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password,
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.passwordConfirmation).toContain('Password confirmation must be supplied');
    });

    it('fails if password does not contain at least 8 characters', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password: 'P@s5',
        passwordConfirmation: 'P@s5',
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must be longer than 8 characters');
    });

    it('fails if password does not contain upper and lower case characters', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password: 'p@55word',
        passwordConfirmation: 'p@55word',
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must contain upper and lower case characters');
    });

    it('fails if password does not contain at least 1 number', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password: 'P@ssWord',
        passwordConfirmation: 'P@ssWord',
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.password).toContain('Password must contain at least 1 number');
    });

    it('fails if password confirmation does not match password', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const email = faker.internet.email();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation: 'wrongPassword',
        organization: organizationName,
      });
      expect(response.status).toBe(400);
      expect(response.body.errors.passwordConfirmation).toContain('Password confirmation must match password');
    });

    it('fails if email is not unique', async () => {
      const firstName = faker.name.firstName();
      const lastName = faker.name.lastName();
      const password = faker.internet.password(16, false, /[a-zA-Z0-9]/);
      const organizationName = faker.company.name();

      const { id: organizationId } = await createOrganization();
      const { email } = await createUser({ organizationId });

      const response = await request(server).post('/authentication/register').send({
        firstName,
        lastName,
        email,
        password,
        passwordConfirmation: password,
        organization: organizationName,
      });

      expect(response.status).toBe(400);
      expect(response.body.errors.email).toContain('Email address is already in use');
    });
  });

  describe('POST /login', () => {
    it('successfully logs in', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, email, password } = await createUser({ organizationId });

      const response = await request(server).post('/authentication/login').send({
        email,
        password,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.token).toBe(token);
    });

    it('fails if password does not match', async () => {
      const { id: organizationId } = await createOrganization();
      const { email } = await createUser({ organizationId });

      const response = await request(server).post('/authentication/login').send({
        email: email,
        password: 'password',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username or password does not match');
    });

    it('fails if user does not exist', async () => {
      const email = faker.internet.email();
      const password = faker.internet.password();

      const response = await request(server).post('/authentication/login').send({
        email,
        password,
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Username or password does not match');
    });
  });

  describe('GET /me', () => {
    it('returns users details when successfully aquired token', async () => {
      const { id: organizationId } = await createOrganization();
      const { token, email } = await createUser({ organizationId });

      const response = await request(server).get('/authentication/me').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.email).toBe(email);
    });

    it('fails when no token has been provided', async () => {
      const response = await request(server).get('/authentication/me');

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Unauthorized request');
    });

    it('fails when token is not valid', async () => {
      const response = await request(server).get('/authentication/me').set('Authorization', `Bearer fakeToken`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });

    it('fails when no user is associated with token', async () => {
      const token = jwt.sign({ id: '9543254' }, process.env.JWT_SECRET as string);
      const response = await request(server).get('/authentication/me').set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(401);
      expect(response.body.error).toBe('Invalid token');
    });
  });
});
