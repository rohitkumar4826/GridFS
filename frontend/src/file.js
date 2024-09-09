import React, { useState, useEffect } from "react";
import axios from "axios";

const FileUpload = () => {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);

  // Fetch all files from the backend
  useEffect(() => {
    axios.get("http://localhost:5000/files")
      .then(response => setFiles(response.data))
      .catch(error => console.error("Error fetching files:", error));
  }, []);

  // Handle file selection
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };

  // Handle file upload
  const handleUpload = () => {
    const formData = new FormData();
    formData.append("file", selectedFile);

    axios.post("http://localhost:5000/upload", formData)
      .then(response => {
        alert("File uploaded successfully");
        // Reload files after upload
        axios.get("http://localhost:5000/files")
          .then(response => setFiles(response.data));
      })
      .catch(error => console.error("Error uploading file:", error));
  };

  // Handle file download
  const handleDownload = (filename) => {
    axios.get(`http://localhost:5000/file/${filename}`, { responseType: 'blob' })
      .then(response => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
      })
      .catch(error => console.error("Error downloading file:", error));
  };

  // Handle file delete
  const handleDelete = (id) => {
    axios.delete(`http://localhost:5000/files/${id}`)
      .then(response => {
        alert("File deleted successfully");
        // Reload files after delete
        axios.get("http://localhost:5000/files")
          .then(response => setFiles(response.data));
      })
      .catch(error => console.error("Error deleting file:", error));
  };

  return (
    <div>
      <h1>File Upload</h1>
      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      <h2>Uploaded Files</h2>
      <ul>
        {files.map(file => (
          <li key={file._id}>
            {file.filename}
            <button onClick={() => handleDownload(file.filename)}>Download</button>
            <button onClick={() => handleDelete(file._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileUpload;
