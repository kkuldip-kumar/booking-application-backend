// import * as request from 'supertest';
// // helpers: app, loginAs(role|email), createBooking(token), hmacSign(body)

// describe('Security: authorization & abuse', () => {
//   it('IDOR: user B cannot read user A booking', async () => {
//     const a = await loginAs('userA');
//     const b = await loginAs('userB');
//     const booking = await createBooking(a.token);
//     await request(app.getHttpServer())
//       .get(`/api/v1/bookings/${booking.id}`)
//       .set('Authorization', `Bearer ${b.token}`)
//       .expect(404);
//   });

//   it('RBAC: USER cannot access admin routes', async () => {
//     const u = await loginAs('userA');
//     await request(app.getHttpServer())
//       .post('/api/v1/admin/movies').set('Authorization', `Bearer ${u.token}`)
//       .send({}).expect(403);
//   });

//   it('Mass assignment: role and price from client are rejected', async () => {
//     await request(app.getHttpServer())
//       .post('/api/v1/auth/register')
//       .send({ email: 'x@y.com', password: 'Str0ng!Pass1', name: 'x', role: 'ADMIN' })
//       .expect(400);
//   });

//   it('Unauthenticated access is denied', async () => {
//     await request(app.getHttpServer()).get('/api/v1/bookings').expect(401);
//   });

//   it('Webhook: forged signature rejected', async () => {
//     await request(app.getHttpServer())
//       .post('/api/v1/payments/webhook')
//       .set('x-signature', 'deadbeef').send({ id: 'pay_1' }).expect(401);
//   });

//   it('Webhook: replay is idempotent', async () => {
//     const { body, sig } = signedWebhook('pay_1');
//     await request(app.getHttpServer()).post('/api/v1/payments/webhook').set('x-signature', sig).send(body).expect(200);
//     await request(app.getHttpServer()).post('/api/v1/payments/webhook').set('x-signature', sig).send(body).expect(200);
//     expect(await confirmedPaymentsCount('pay_1')).toBe(1);
//   });

//   it('Rate limit: login throttled', async () => {
//     const res = await Promise.all(
//       Array.from({ length: 20 }, () =>
//         request(app.getHttpServer()).post('/api/v1/auth/login').send({ email: 'a@b.com', password: 'wrong' }),
//       ),
//     );
//     expect(res.some((r) => r.status === 429)).toBe(true);
//   });

//   it('Hold abuse: >6 seats rejected', async () => {
//     const u = await loginAs('userA');
//     await request(app.getHttpServer())
//       .post(`/api/v1/shows/${showId}/seats/hold`).set('Authorization', `Bearer ${u.token}`)
//       .send({ seatIds: sevenSeatIds }).expect(400);
//   });
// });