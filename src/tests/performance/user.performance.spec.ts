import http, { Response } from "k6/http";
import { check, sleep } from "k6";
import { RegisterRequest } from "../../dto/auth.dto";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800"],
  },
};

interface LoginResponseBody {
  user: {
    id: string;
  };
  token: string;
}

/* =======================
   SETUP (runs once)
======================= */

export function setup(): { id: string; token: string } {
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


  if (registerRes.status !== 200 && registerRes.status !== 201) {
    throw new Error("Register failed – stopping test");
  }
  const loginParams = {
    headers: { "Content-Type": "application/json" },
  };

  // 🔹 LOGIN
  const loginRes: Response = http.post(
    "http://localhost:3000/api/auth/login",
    JSON.stringify({
      email,
      password
    }),
    loginParams
  );

  if (loginRes.status !== 200 || !loginRes.body) {
    throw new Error(`Login failed: ${loginRes.status}`);
  }

  const loginBody: LoginResponseBody = JSON.parse(String(loginRes.body));
  const id = loginBody.user.id;
  const token = loginBody.token;

  return {
    id,
    token,
  };
}
/* =======================
   DEFAULT (load happens here)
======================= */

export default function (data: { id: string; token: string }) {
  const authHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.token}`,
    },
  };

  /* 🔹 GET ALL USERS */
  const getAllRes: Response = http.get(
    "http://localhost:3000/api/users?page=1&limit=5",
    authHeaders
  );

  check(getAllRes, {
    "get all users": (r) => r.status === 200,
  });

  /* 🔹 GET USER BY ID */
  const getByIdRes: Response = http.get(
    `http://localhost:3000/api/users/${data.id}`,
    authHeaders
  );
  check(getByIdRes, {
    "get user by id": (r) => r.status === 200,
  });

  /* 🔹 UPDATE USER */
  const updateRes: Response = http.put(
    `http://localhost:3000/api/users/${data.id}`,
    JSON.stringify({ name: "Updated User Name" }),
    authHeaders
  );

  check(updateRes, {
    "user updated": (r) => r.status === 200,
  });

  

  sleep(1);
}

export function teardown(data: { token: string; id: string }) {
  const authHeaders = {
    headers: {
      Authorization: `Bearer ${data.token}`,
    },
  };

  const deleteRes = http.del(
    `http://localhost:3000/api/users/${data.id}`,
    null,
    authHeaders
  );

  check(deleteRes, {
    "user deleted once": (r) => r.status === 200,
  });

  console.log(`User ${data.id} deleted in teardown`);
}
