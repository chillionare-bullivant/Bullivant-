import statusHandler from "./flashloan/status";
import executeHandler from "./flashloan/execute";

export default async function handler(req: any, res: any) {
  if (req.method === "GET") {
    return statusHandler(req, res);
  } else if (req.method === "POST") {
    return executeHandler(req, res);
  } else if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(200).end();
  }
  return res.status(405).json({ success: false, error: "Method not allowed" });
}
