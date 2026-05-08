import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 20 },
        { duration: '30s', target: 20 },
        { duration: '10s', target: 0  },
    ],
    thresholds: {
        http_req_duration: ['p(95)<1000'],
        http_req_failed:   ['rate<0.01'],
    },
};
export default function () {
    const payload = JSON.stringify({
        correo: 'admin@gimnasio.com',
        contrasena: '123456'
    });
    const res = http.post(
        'http://localhost:1010/api/auth/login',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
    );
    check(res, { 'status < 400': r => r.status < 400 });
    sleep(1);
}