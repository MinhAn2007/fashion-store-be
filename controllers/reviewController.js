const reviewService = require("../services/reviewService");
const multer = require("multer");
const AWS = require("aws-sdk");
const path = require("path");

const getReviewsByUserId = async (req, res) => {
  const { id } = req.params;

  try {
    const reviews = await reviewService.getReviewsByUserId(id);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews by user id:", error.message); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const reviewProduct = async (req, res) => {
  const { productId, userId, rating, content, images, video, title,orderId } = req.body;
  console.log("req.body:", req.body);
  
  try {
    const review = await reviewService.reviewProduct(
      productId,
      userId,
      rating,
      content,
      images,
      video,
      title,
      orderId
    );
    res.json(review);
  } catch (error) {
    console.error("Error reviewing product:", error.message); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE = "1";

AWS.config.update({
  region: process.env.REGION,
  accessKeyId: process.env.ACCESS_KEY_ID,
  secretAccessKey: process.env.SECRET_ACCESS_KEY,
});

const s3 = new AWS.S3();
const bucketName = process.env.S3_BUCKET_NAME;

const storage = multer.memoryStorage({
  destination(req, file, callback) {
    callback(null, "");
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30000000000 },
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
}).single("image");

function checkFileType(file, cb) {
  const fileTypes =
    /jpeg|jpg|png|gif|doc|docx|xls|xlsx|pdf|csv|json|mp4|mp3|mov|/;
  const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = fileTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  return cb("Error: Images, Word, Excel, and PDF files only !!!");
}

const uploadAvatarS3 = async (req, res) => {
  try {
    upload(req, res, async function (err) {
      console.log("req.file:", req.file);
      if (err instanceof multer.MulterError) {
        return res.status(400).json({
          success: false,
          message: "Lỗi trong quá trình upload ảnh",
        });
      } else if (err) {
        console.error("Upload error:", err); // Log any other errors
        return res.status(500).json({
          success: false,
          message: "Upload ảnh thất bại",
        });
      }

      const { userId } = req.params;
      const avatar = req.file?.originalname.split(".");
      const fileType = avatar[avatar.length - 1];
      const filePath = `zalo/W${userId}_W${Date.now().toString()}.${fileType}`;

      const paramsS3 = {
        Bucket: bucketName,
        Key: filePath,
        Body: req.file.buffer,
        ContentType: req.file.mimetype,
      };

      s3.upload(paramsS3, async (err, data) => {
        if (err) {
          console.error("S3 upload error:", err); // Log S3 upload errors
          return res.status(500).json({
            success: false,
            message: "Upload ảnh thất bại",
          });
        }
        const url = data.Location; // Get the URL of the uploaded image from AWS S3
        return res.status(200).json({
          success: true,
          message: "Upload ảnh thành công",
          avatar: url,
        });
      });
    });
  } catch (error) {
    console.error("General error:", error); // Log any general errors
    res.status(500).send("Error");
  }
};

const getReviewByOrderId = async (req, res) => {
  const { id } = req.params;
  console.log("orderId:", req.params);
  
  try {
    const reviews = await reviewService.getReviewByOrderId(id);
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews by order id:", error.message); // Log the error
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

module.exports = {
  getReviewsByUserId,
  reviewProduct,
  uploadAvatarS3,
  getReviewByOrderId,
};
