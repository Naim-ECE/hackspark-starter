import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/status", (req, res) => {
  res.status(200).json({
    service: "frontend",
    status: "OK"
  });
});

app.get("/", (req, res) => {
  res.status(200).send("RentPi frontend placeholder");
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`frontend listening on ${PORT}`);
});
