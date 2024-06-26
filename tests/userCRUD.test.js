const request = require('supertest');
const { authenticateTestUser } = require("../utils/testHelper");

const app = require('./test-app/test.app.js');
const db = require('../config/db.js');

const sequelize = db.sequelize;

describe('User CRUD functions', () => {
    let token;
    let cookie;

    let createdUserId;

    beforeAll(async () => {
        await sequelize.authenticate();
    });

    beforeAll(async () => {
        ({ token, cookie } = await authenticateTestUser(app));
    });

    describe('createUser', () => {
        it('should create a new user', async () => {
            const response = await request(app)
                .post('/admin/users')
                .set('Authorization', `${token}`)
                .set('Cookie', cookie)
                .send({
                    username: 'testuser',
                    password: '1234',
                    phoneNumber: '387603137056',
                    role: 'user'
                });

            createdUserId = response.body.id;

            expect(response.statusCode).toBe(201);
            expect(response.body).toHaveProperty('username', 'testuser');
            expect(response.body).toHaveProperty('password');
            expect(response.body).toHaveProperty('phoneNumber', '387603137056');
            expect(response.body).toHaveProperty('role', 'user');
        });
    });

    describe('getUsers', () => {
        it('should get all users', async () => {
            const response = await request(app)
                .get('/admin/users')
                .set('Authorization', `${token}`)
                .set('Cookie', cookie);

            expect(response.statusCode).toBe(200);
            expect(response.body.length).toBeGreaterThan(0);
            expect(response.body.some(user => user.id === createdUserId)).toBe(true);
        });
    });

    describe('updateUser', () => {
        it('should update a user', async () => {
            const response = await request(app)
                .put('/admin/users/' + createdUserId)
                .set('Authorization', `${token}`)
                .set('Cookie', cookie)
                .send({
                    username: 'testuser1',
                    password: '1234',
                    phoneNumber: '387613137056',
                    role: 'user'
                });

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('username', 'testuser1');
            expect(response.body).toHaveProperty('password');
            expect(response.body).toHaveProperty('phoneNumber', '387613137056');
            expect(response.body).toHaveProperty('role', 'user');
        });
        it('should not update non existing user', async () => {
            const response = await request(app)
                .put('/admin/users/' + "45654646456")
                .set('Authorization', `${token}`)
                .set('Cookie', cookie)
                .send({
                    username: 'testadmin1',
                    password: '1234',
                    phoneNumber: '387613137056',
                    role: 'admin'
                });

            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('message', 'User not found');
        });
    });

    describe('deleteUser', () => {
        it('should delete a user', async () => {
            const response = await request(app)
                .delete('/admin/users/' + createdUserId)
                .set('Authorization', `${token}`)
                .set('Cookie', cookie);

            expect(response.statusCode).toBe(200);
            expect(response.body).toHaveProperty('message', 'User sucessfully deleted');
        });

        it('should not delete non existing admin', async () => {
            const response = await request(app)
                .delete('/admin/users/' + "54353453453453435")
                .set('Authorization', `${token}`)
                .set('Cookie', cookie);

            expect(response.statusCode).toBe(404);
            expect(response.body).toHaveProperty('message', 'User not found');
        });
        
    });

    afterAll(async () => {
        await sequelize.close();
    });
});
