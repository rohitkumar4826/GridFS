const express = require("express");
const mongodb = require("mongodb");
const fs = require("fs");
const expressFormidable = require("express-formidable");
const cors = require("cors");

const app = express();
const port = 5000;

// Use middleware
app.use(cors()); 
app.use(expressFormidable());

// MongoDB connection
const mongoClient = mongodb.MongoClient;
const url = "mongodb://localhost:27017";
let bucket;

mongoClient.connect(url).then(client => {
  const db = client.db("mongodb_gridfs");
  bucket = new mongodb.GridFSBucket(db, { bucketName: "myBucketName" });
  console.log("Connected to MongoDB");
}).catch(err => {
  console.error("Error connecting to MongoDB", err);
});

// Upload file route
app.post("/upload", (req, res) => {
  const file = req.files.file;
  const filePath = Date.now() + "-" + file.name;

  // Read file stream and upload to GridFS
  fs.createReadStream(file.path)
    .pipe(bucket.openUploadStream(filePath, {
      chunkSizeBytes: 1048576, // 1MB chunks
      metadata: {
        name: file.name,
        size: file.size,
        type: file.type
      }
    }))
    .on("finish", () => {
      res.json({ message: "File uploaded successfully." });
    })
    .on("error", err => {
      res.status(500).json({ error: "File upload failed." });
    });
});

// Get all files route
app.get("/files", async (req, res) => {
  try {
    const files = await bucket.find().sort({ uploadDate: -1 }).toArray();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: "Unable to fetch files." });
  }
});

// Download file by filename
app.get("/file/:filename", async (req, res) => {
  const { filename } = req.params;

  try {
    const files = await bucket.find({ filename }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: "File not found." });
    }

    // Stream file to client
    bucket.openDownloadStreamByName(filename).pipe(res);
  } catch (error) {
    res.status(500).json({ error: "Error fetching file." });
  }
});

// Delete file by ID
app.delete("/files/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await bucket.delete(new mongodb.ObjectId(id));
    res.json({ message: "File deleted successfully." });
  } catch (error) {
    res.status(500).json({ error: "Error deleting file." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
