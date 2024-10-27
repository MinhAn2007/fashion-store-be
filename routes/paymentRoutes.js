const express = require("express");
const router = express.Router();
const request = require("request");
const moment = require("moment");
const crypto = require("crypto");
const qs = require("qs");
require("dotenv").config();

// Utility function for sorting objects (moved to top for better organization)
function sortObject(obj) {
  const sorted = {};
  const str = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (let i = 0; i < str.length; i++) {
    sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, "+");
  }
  return sorted;
}

// Helper function to get client IP
function getClientIp(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress
  );
}

// Basic routes
router.get("/", (req, res) => {
  res.render("orderlist", { title: "Danh sách đơn hàng" });
});

router.get("/create_payment_url", (req, res) => {
  res.render("order", { title: "Tạo mới đơn hàng", amount: 10000 });
});

router.get("/querydr", (req, res) => {
  res.render("querydr", { title: "Truy vấn kết quả thanh toán" });
});

router.get("/refund", (req, res) => {
  res.render("refund", { title: "Hoàn tiền giao dịch thanh toán" });
});

// Payment URL creation
router.post("/create-payment-url", (req, res) => {
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const date = new Date();
    const createDate = moment(date).format("YYYYMMDDHHmmss");
    const ipAddr = getClientIp(req);
    const tmnCode = process.env.VNP_TMN_CODE;
    const secretKey = process.env.VNP_HASH_SECRET;
    const vnpUrl = process.env.VNP_URL;
    const returnUrl = process.env.VNP_RETURN_URL;
  
    // Thay đổi giá trị của vnp_TxnRef thành một giá trị duy nhất
    const orderId = moment(date).format("DDHHmmss");
    const { amount, language = "vn", userName } = req.body;
  
    const vnp_Params = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: tmnCode,
      vnp_Locale: language,
      vnp_CurrCode: "VND",
      vnp_TxnRef: orderId, // Đảm bảo orderId là duy nhất
      vnp_OrderInfo: "Thanh toan cho ma GD:" + orderId + " cua " + userName,
      vnp_OrderType: "QRCODE",
      vnp_Amount: amount, // Đảm bảo số tiền được tính bằng đồng VND
      vnp_ReturnUrl: returnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate,
    //   vnp_BankCode:"VNPAYQR"
    };

    const sortedParams = sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
  
    vnp_Params.vnp_SecureHash = signed;
    const finalUrl = vnpUrl + "?" + qs.stringify(vnp_Params, { encode: false });
  
    return res.json({ code: "00", url: finalUrl });
  });
  

// Payment return handler
router.get("/vnpay_return", (req, res) => {
  const vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);
  const secretKey = process.env.vnp_HashSecret;
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  if (secureHash === signed) {
    // Valid transaction
    res.render("success", { code: vnp_Params["vnp_ResponseCode"] });
  } else {
    // Invalid transaction
    res.render("success", { code: "97" });
  }
});

// IPN handler
router.get("/vnpay_ipn", (req, res) => {
  const vnp_Params = req.query;
  const secureHash = vnp_Params["vnp_SecureHash"];
  const orderId = vnp_Params["vnp_TxnRef"];
  const rspCode = vnp_Params["vnp_ResponseCode"];

  delete vnp_Params["vnp_SecureHash"];
  delete vnp_Params["vnp_SecureHashType"];

  const sortedParams = sortObject(vnp_Params);
  const secretKey = process.env.vnp_HashSecret;
  const signData = qs.stringify(sortedParams, { encode: false });
  const hmac = crypto.createHmac("sha512", secretKey);
  const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex");

  // Payment status simulation - in production, this should come from your database
  const paymentStatus = "0";
  const checkOrderId = true;
  const checkAmount = true;

  if (secureHash === signed) {
    if (checkOrderId) {
      if (checkAmount) {
        if (paymentStatus === "0") {
          if (rspCode === "00") {
            // Payment successful
            res.status(200).json({ RspCode: "00", Message: "Success" });
          } else {
            // Payment failed
            res.status(200).json({ RspCode: "00", Message: "Success" });
          }
        } else {
          res
            .status(200)
            .json({
              RspCode: "02",
              Message: "This order has been updated to the payment status",
            });
        }
      } else {
        res.status(200).json({ RspCode: "04", Message: "Amount invalid" });
      }
    } else {
      res.status(200).json({ RspCode: "01", Message: "Order not found" });
    }
  } else {
    res.status(200).json({ RspCode: "97", Message: "Checksum failed" });
  }
});

// Query transaction status
router.post("/querydr", (req, res) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const date = new Date();
  const { orderId, transDate } = req.body;

  const vnp_RequestId = moment(date).format("HHmmss");
  const vnp_Version = "2.1.0";
  const vnp_Command = "querydr";
  const vnp_TmnCode = process.env.vnp_TmnCode;
  const vnp_OrderInfo = "Truy van GD ma:" + orderId;
  const secretKey = process.env.vnp_HashSecret;
  const vnp_Api = process.env.vnp_Api;
  const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");
  const vnp_IpAddr = getClientIp(req);

  const data = `${vnp_RequestId}|${vnp_Version}|${vnp_Command}|${vnp_TmnCode}|${orderId}|${transDate}|${vnp_CreateDate}|${vnp_IpAddr}|${vnp_OrderInfo}`;
  const hmac = crypto.createHmac("sha512", secretKey);
  const vnp_SecureHash = hmac.update(Buffer.from(data, "utf-8")).digest("hex");

  const requestData = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TxnRef: orderId,
    vnp_OrderInfo,
    vnp_TransactionDate: transDate,
    vnp_CreateDate,
    vnp_IpAddr,
    vnp_SecureHash,
  };

  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: requestData,
    },
    (error, response, body) => {
      if (error) {
        console.error("Query DR Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json(body);
      }
    }
  );
});

// Refund handler
router.post("/refund", (req, res) => {
  process.env.TZ = "Asia/Ho_Chi_Minh";
  const date = new Date();
  const { orderId, transDate, amount, transType, user } = req.body;

  const vnp_RequestId = moment(date).format("HHmmss");
  const vnp_Version = "2.1.0";
  const vnp_Command = "refund";
  const vnp_TmnCode = process.env.vnp_TmnCode;
  const vnp_TransactionType = transType;
  const vnp_Amount = amount * 100;
  const vnp_TransactionNo = "0";
  const vnp_OrderInfo = "Hoan tien GD ma:" + orderId;
  const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");
  const vnp_IpAddr = getClientIp(req);

  const secretKey = process.env.vnp_HashSecret;
  const vnp_Api = process.env.vnp_Api;

  const data = `${vnp_RequestId}|${vnp_Version}|${vnp_Command}|${vnp_TmnCode}|${vnp_TransactionType}|${orderId}|${vnp_Amount}|${vnp_TransactionNo}|${transDate}|${user}|${vnp_CreateDate}|${vnp_IpAddr}|${vnp_OrderInfo}`;
  const hmac = crypto.createHmac("sha512", secretKey);
  const vnp_SecureHash = hmac.update(Buffer.from(data, "utf-8")).digest("hex");

  const requestData = {
    vnp_RequestId,
    vnp_Version,
    vnp_Command,
    vnp_TmnCode,
    vnp_TransactionType,
    vnp_TxnRef: orderId,
    vnp_Amount: vnp_Amount,
    vnp_TransactionNo,
    vnp_CreateBy: user,
    vnp_OrderInfo,
    vnp_TransactionDate: transDate,
    vnp_CreateDate,
    vnp_IpAddr,
    vnp_SecureHash,
  };

  request(
    {
      url: vnp_Api,
      method: "POST",
      json: true,
      body: requestData,
    },
    (error, response, body) => {
      if (error) {
        console.error("Refund Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
      } else {
        res.json(body);
      }
    }
  );
});

module.exports = router;
