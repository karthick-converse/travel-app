import http, { Response } from "k6/http";
import { check, sleep } from "k6";
import { RegisterRequest } from "../../dto/auth.dto";

export const options = {
  vus: 5,
  duration: "10s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<800"],
  },
};

interface LoginResponseBody {
  token: string;
}

interface PackageResponseBody {
  package: {
    _id: string;
  };
}



/* =======================
   SETUP (runs once)
======================= */

export function setup(): {
token: string;
} {
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
  const token = loginBody.token;

  /* 🔹 CREATE BOOKING */

  return {
    token,
  };
}

/* =======================
   DEFAULT (load happens here)
======================= */

export default function (data: { token: string }) {
  const authHeaders = {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.token}`,
    },
  };

  const createPackageRes: Response = http.post(
    "http://localhost:3000/api/packages",
    JSON.stringify({
      title: "Goa Trip",
      description: "A wonderful 5-day beach vacation in Goa",
      destination: "Goa",
      price: 15000,
      duration: 5,
      maxPeople: 5,
      isActive: true,
    }),
    authHeaders
  );

  if (
    (createPackageRes.status !== 200 && createPackageRes.status !== 201) ||
    !createPackageRes.body
  ) {
    throw new Error(`Create package failed: ${createPackageRes.status}`);
  }

  const packageBody: PackageResponseBody = JSON.parse(
    String(createPackageRes.body)
  );

  if (!packageBody.package?._id) {
    throw new Error("Package ID not found in response");
  }

  check(createPackageRes, {
    "package created": (r) => r.status === 201,
  });
  const packageId = packageBody.package._id;
  /* 🔹 GET ALL PACKAGES */
  const getAllRes: Response = http.get(
    "http://localhost:3000/api/packages?page=1&limit=5",
    authHeaders
  );

  check(getAllRes, {
    "get all packages": (r) => r.status === 200,
  });

  /* 🔹 GET PACKAGE BY ID */
  const getByIdRes: Response = http.get(
    `http://localhost:3000/api/packages/${packageId}`,
    authHeaders
  );
  check(getByIdRes, {
    "get package by id": (r) => r.status === 200,
  });

  /* 🔹 UPDATE PACKAGE */
  const updateRes: Response = http.put(
    `http://localhost:3000/api/packages/${packageId}`,
    JSON.stringify({ maxPeople: 15 }),
    authHeaders
  );

  check(updateRes, {
    "package updated": (r) => r.status === 200,
  });

  /* 🔹 DELETE PACKAGE */
  const deleteRes: Response = http.del(
    `http://localhost:3000/api/packages/${packageId}`,
    null,
    authHeaders
  );

  check(deleteRes, {
    "package deleted": (r) => r.status === 200,
  });

  sleep(1);
}
