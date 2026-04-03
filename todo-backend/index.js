const http = require("http");
const mongoose = require("mongoose");

const PORT = Number(process.env.PORT) || 5050;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/todo-backend";

const server = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  if (req.url === "/health") {
    const dbOk = mongoose.connection.readyState === 1;
    res.writeHead(200);
    res.end(JSON.stringify({ ok: true, db: dbOk }));
    return;
  }

  res.writeHead(200);
  res.end(
    JSON.stringify({
      name: "todo-backend",
      hint: "GET /health for a simple health check",
    }),
  );
});

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("몽고디비 연결 성공");

  server.listen(PORT, () => {
    console.log(`서버가 ${PORT}번 포트에서 실행 중입니다.`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
