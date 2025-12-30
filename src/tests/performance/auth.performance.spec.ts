import http, { Response } from "k6/http";
import { check, sleep } from "k6";
import { RegisterRequest } from "../../dto/auth.dto";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<500"],
  },
};



interface LoginResponseBody {
  token: string;
}


export function setup(): { token: string } {
  const email = `user_${Date.now()}_${Math.random()
    .toString(36)
    .substring(2)}@test.com`;

  const password = "admin@123";

  const params = {
    headers: { "Content-Type": "application/json" },
  };

  /* 🔹 REGISTER */
  const registerPayload: RegisterRequest = {
    name: "Test User",
    email,
    password,
    role: "admin",
  };

  const registerRes: Response = http.post(
    "http://localhost:3000/api/auth/register",
    JSON.stringify(registerPayload),
    params
  );

  check(registerRes, {
    "register success": (r) => r.status === 200 || r.status === 201,
  });

  if (registerRes.status !== 200 && registerRes.status !== 201) {
    throw new Error("Register failed – stopping test");
  }

  /* 🔹 LOGIN */
  const loginRes: Response = http.post(
    "http://localhost:3000/api/auth/login",
    JSON.stringify({ email, password }),
    params
  );

  if (loginRes.status !== 200 || !loginRes.body) {
    console.error("LOGIN FAILED:", loginRes.status, loginRes.body);
    throw new Error("Login failed – token not received");
  }

  const loginBody: LoginResponseBody =
    typeof loginRes.body === "string"
      ? (JSON.parse(loginRes.body) as LoginResponseBody)
      : (() => {
          throw new Error("Login response body is not JSON");
        })();

  check(loginRes, {
    "login success": (r) => r.status === 200,
    "token received": () => typeof loginBody.token === "string",
  });

  return { token: loginBody.token };
}


export default function (data: { token: string }): void {
  const res: Response = http.get(
    "http://localhost:3000/api/auth/profile",
    {
      headers: {
        Authorization: `Bearer ${data.token}`,
      },
    }
  );

  check(res, {
    "authorized request success": (r) => r.status === 200,
  });

  sleep(1);
}
