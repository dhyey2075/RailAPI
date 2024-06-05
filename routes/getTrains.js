import { Router } from "express";
import UserAgent from "user-agents";
import Prettify from "../utils/prettify.js";
import * as cheerio from 'cheerio';


const prettify = new Prettify();
const router = Router();

router.get('/', (req, res) => {
  res.send('Welcome to GetTrains API');
})

router.get("/getTrain", async (req, resp) => {
  const trainNo = req.query.TrainNo;
  const URL_Train = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNo}&DataSource=0&Language=0&Cache=true`;
  try {
    const response = await fetch(URL_Train);
    const data = await response.text();
    console.log(data)
    const json = prettify.CheckTrain(data);
    resp.json(json);
  } catch (e) {
    resp.send(e.message);
  }
});

router.get("/betweenStations", async (req, resp) => {
  const from = req.query.from;
  const to = req.query.to;
  const URL_Trains = `https://erail.in/rail/getTrains.aspx?Station_From=${from}&Station_To=${to}&DataSource=0&Language=0&Cache=true`;
  try {
    const userAgent = new UserAgent();
    const response = await fetch(URL_Trains, {
      method: "GET",
      headers: { "User-Agent": userAgent.toString() },
    });
    const data = await response.text();
    const json = prettify.BetweenStation(data);
    resp.json({ json });
  } catch (error) {
    console.log(error.message);
  }
});

router.get("/getTrainOn", async (req, resp) => {
  const arr = [];
  const retval = {};
  const from = req.query.from;
  const to = req.query.to;
  const date = req.query.date;
  if (!date) {
    retval["success"] = false;
    retval["time_stamp"] = Date.now();
    retval["data"] = "Please Add Specific Date";
    resp.json(retval);
    return;
  }
  const URL_Trains = `https://erail.in/rail/getTrains.aspx?Station_From=${from}&Station_To=${to}&DataSource=0&Language=0&Cache=true`;
  try {
    const userAgent = new UserAgent();
    const response = await fetch(URL_Trains, {
      method: "GET",
      headers: { "User-Agent": userAgent.toString() },
    });
    const data = await response.text();
    const json = prettify.BetweenStation(data);
    if (!json["success"]) {
      resp.json(json);
      return;
    }
    const [DD, MM, YYYY] = date.split("-");
    const day = prettify.getDayOnDate(DD, MM, YYYY);
    json["data"].forEach((ele) => {
      if (ele["train_base"]["running_days"][day] == 1) arr.push(ele);
    });
    retval["success"] = true;
    retval["time_stamp"] = Date.now();
    retval["data"] = arr;
    resp.json(retval);
  } catch (err) {
    console.log(err);
  }
});

router.get("/getRoute", async (req, resp) => {
  const trainNo = req.query.trainNo;
  try {
    let URL_Train = `https://erail.in/rail/getTrains.aspx?TrainNo=${trainNo}&DataSource=0&Language=0&Cache=true`;
    let response = await fetch(URL_Train);
    let data = await response.text();
    let json = prettify.CheckTrain(data);
    if (!json["success"]) {
      resp.json(json);
      return;
    }
    URL_Train = `https://erail.in/data.aspx?Action=TRAINROUTE&Password=2012&Data1=${json["data"]["train_id"]}&Data2=0&Cache=true`;
    response = await fetch(URL_Train);
    data = await response.text();
    json = prettify.GetRoute(data);
    resp.send(json);
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/stationLive", async (req, resp) => {
  const code = req.query.code;
  try {
    let URL_Train = `https://erail.in/station-live/${code}?DataSource=0&Language=0&Cache=true`;
    let response = await fetch(URL_Train);
    let data = await response.text();
    const $ = cheerio.load(data);
    let json = prettify.LiveStation($);
    resp.send(json);
  } catch (err) {
    console.log(err.message);
  }
});

router.get("/pnrstatus", async (req, resp) => {
  try {
    const pnr = req.query.pnr;
    if (!pnr) {
      resp.json({ success: false, message: "PNR is required" });
      return;
    }
    const URL_Train = `https://www.confirmtkt.com/pnr-status/${pnr}`;
    const response = await fetch(URL_Train);
    const data = await response.text();
    const json = prettify.PnrStatus(data);
    resp.send(json);
  } catch (error) {
    console.log(error.message);
    resp.json({error: error.message});
  }
});

export default router;
